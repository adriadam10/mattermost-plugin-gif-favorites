package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSlug(t *testing.T) {
	cases := map[string]string{
		"Homer Simpson Hides GIF":          "homer-simpson-hides",
		"Happy Dance GIF by Disney":        "happy-dance",
		"  ¡Qué camión!  ":                 "que-camion",
		"":                                 "",
		"Cat GIF by The Pet Collective 2!": "cat",
	}
	for in, want := range cases {
		if got := slug(in); got != want {
			t.Errorf("slug(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestNameFavoritesIsUniqueAndFallsBackToURL(t *testing.T) {
	favs := []favorite{
		{ID: "a", Title: "Happy Dance GIF"},
		{ID: "b", Title: "Happy Dance GIF by Someone"},
		{ID: "u1", URL: "https://media.tenor.com/xyz/party-time.gif"},
		{ID: "u2", URL: ""},
	}
	nameFavorites(favs)
	want := []string{"happy-dance", "happy-dance-2", "xyz", "gif"}
	for i, fav := range favs {
		if fav.Name != want[i] {
			t.Errorf("favourite %d named %q, want %q", i, fav.Name, want[i])
		}
	}
	if got := findFavorite(favs, "Happy-Dance-2"); got == nil || got.ID != "b" {
		t.Errorf("findFavorite by name = %+v", got)
	}
	if got := findFavorite(favs, "U1"); got == nil || got.ID != "u1" {
		t.Errorf("findFavorite by id = %+v", got)
	}
	if findFavorite(favs, "dancing cat") != nil {
		t.Error("words that name no favourite must not match one")
	}
}

func TestTitlesAreCachedAndMissingOnesNotAskedAgain(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.URL.Query().Get("api_key") != "k" {
			t.Errorf("no key sent: %s", r.URL)
		}
		_, _ = w.Write([]byte(`{"data":[{"id":"a","title":"Happy Dance GIF"}]}`))
	}))
	defer srv.Close()
	g := newGiphy(func() string { return "k" }, func(string, ...any) { t.Error("unexpected GIPHY error") })
	g.base = srv.URL
	for range 2 {
		titles := g.titles([]string{"a", "unknown"})
		if titles["a"] != "Happy Dance GIF" || titles["unknown"] != "" {
			t.Fatalf("titles = %v", titles)
		}
	}
	if calls != 1 {
		t.Errorf("GIPHY asked %d times, want 1", calls)
	}
}

func TestTitlesWithoutKeyAreLoggedAndRetried(t *testing.T) {
	logged := 0
	g := newGiphy(func() string { return "" }, func(string, ...any) { logged++ })
	for range 2 {
		if titles := g.titles([]string{"a"}); len(titles) != 0 {
			t.Fatalf("titles without a key = %v", titles)
		}
	}
	if logged != 2 {
		t.Errorf("logged %d failures, want 2 (failures are not cached)", logged)
	}
}
