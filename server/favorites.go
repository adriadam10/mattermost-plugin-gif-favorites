package main

import (
	"path"
	"strconv"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// favorite is one saved GIF with the name /gif-fav knows it by.
type favorite struct {
	ID    string
	URL   string
	Title string
	Name  string
}

// favorites reads the user's favourites and names them after their GIPHY
// titles. Without a title (a GIF from elsewhere, or GIPHY down) the name
// comes from the URL.
func (p *Plugin) favorites(userID string) []favorite {
	prefs, appErr := p.API.GetPreferencesForUser(userID)
	if appErr != nil {
		p.API.LogWarn("Failed to read favourites", "user_id", userID, "err", appErr.Error())
		return nil
	}
	var favs []favorite
	var ids []string
	for _, pref := range prefs {
		if pref.Category != prefCategory {
			continue
		}
		favs = append(favs, favorite{ID: pref.Name, URL: pref.Value})
		ids = append(ids, pref.Name)
	}
	titles := p.giphy.titles(ids)
	for i := range favs {
		favs[i].Title = titles[favs[i].ID]
	}
	nameFavorites(favs)
	return favs
}

// nameFavorites gives each favourite a unique one-word name: autocomplete
// completes a word at a time, so a name cannot contain spaces.
func nameFavorites(favs []favorite) {
	used := map[string]int{}
	for i := range favs {
		base := slug(favs[i].Title)
		if base == "" {
			base = slug(strings.TrimSuffix(path.Base(path.Dir(favs[i].URL)), ".gif"))
		}
		if base == "" {
			base = "gif"
		}
		used[base]++
		name := base
		if n := used[base]; n > 1 {
			name = base + "-" + strconv.Itoa(n)
		}
		favs[i].Name = name
	}
}

// slug turns "Homer Simpson Hides GIF" into "homer-simpson-hides".
func slug(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimSuffix(s, " GIF")
	if before, _, found := strings.Cut(s, " GIF by "); found {
		s = before
	}
	var b strings.Builder
	dash := false
	for _, r := range norm.NFD.String(strings.ToLower(s)) {
		switch {
		case unicode.Is(unicode.Mn, r):
			// accents dropped: "camión" -> "camion"
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
			dash = false
		case b.Len() > 0 && !dash:
			b.WriteByte('-')
			dash = true
		}
	}
	return strings.TrimSuffix(b.String(), "-")
}

// findFavorite matches the command argument to a favourite by name or id.
func findFavorite(favs []favorite, query string) *favorite {
	query = strings.ToLower(strings.TrimSpace(query))
	for i := range favs {
		if favs[i].Name == query || strings.EqualFold(favs[i].ID, query) {
			return &favs[i]
		}
	}
	return nil
}
