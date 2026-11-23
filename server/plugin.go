// Server part of GIF Favorites: the /gif-fav command, so clients without the
// webapp part (Matty, the mobile apps) can send favourites. Searching GIPHY is
// left to /gif, which the GIPHY commands plugin already registers.
package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

const (
	manifestID = "com.github.adriadam10.gif-favorites"
	command    = "gif-fav"
	// Same category the webapp writes: name = GIPHY id, value = GIF URL.
	prefCategory = "gif_favorites"
)

type Plugin struct {
	plugin.MattermostPlugin
	giphy *giphy
}

func (p *Plugin) OnActivate() error {
	p.giphy = newGiphy(func() string {
		// GetConfig masks the key as a secret, so it needs the unsanitized config.
		key := p.API.GetUnsanitizedConfig().ServiceSettings.GiphySdkKey
		if key == nil {
			return ""
		}
		return *key
	}, p.API.LogWarn)
	auto := model.NewAutocompleteData(command, "[favourite]", "Send one of your favourite GIFs")
	auto.AddDynamicListArgument("Favourite", "/plugins/"+manifestID+"/autocomplete", false)
	return p.API.RegisterCommand(&model.Command{
		Trigger:          command,
		AutoComplete:     true,
		AutoCompleteDesc: "Send one of your favourite GIFs.",
		AutoCompleteHint: "[favourite]",
		AutocompleteData: auto,
		DisplayName:      "GIF Favorites",
	})
}

func (p *Plugin) ExecuteCommand(_ *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	query := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(args.Command), "/"+command))
	t := texts(p.locale(args.UserId))
	favs := p.favorites(args.UserId)
	if query == "" {
		p.ephemeral(args, usage(t, favs))
		return &model.CommandResponse{}, nil
	}
	fav := findFavorite(favs, query)
	if fav == nil {
		p.ephemeral(args, notFound(t, query, favs))
		return &model.CommandResponse{}, nil
	}
	// The same message the webapp panel sends, so every client shows the image.
	post := &model.Post{UserId: args.UserId, ChannelId: args.ChannelId, RootId: args.RootId, Message: gifMessage(fav.URL)}
	if _, appErr := p.API.CreatePost(post); appErr != nil {
		return nil, appErr
	}
	return &model.CommandResponse{}, nil
}

func gifMessage(url string) string {
	return "![gif](" + url + ")"
}

func (p *Plugin) ephemeral(args *model.CommandArgs, message string) {
	p.API.SendEphemeralPost(args.UserId, &model.Post{ChannelId: args.ChannelId, RootId: args.RootId, Message: message})
}

func (p *Plugin) locale(userID string) string {
	if user, appErr := p.API.GetUser(userID); appErr == nil {
		return user.Locale
	}
	return "en"
}

// ServeHTTP answers the dynamic argument of /gif-fav: the user's favourites by name.
func (p *Plugin) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-Id")
	if userID == "" {
		http.Error(w, "not authorized", http.StatusUnauthorized)
		return
	}
	if r.Method != http.MethodGet || r.URL.Path != "/autocomplete" {
		http.NotFound(w, r)
		return
	}
	items := []model.AutocompleteListItem{}
	for _, fav := range p.favorites(userID) {
		items = append(items, model.AutocompleteListItem{Item: fav.Name, HelpText: fav.Title})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(items)
}

func main() {
	plugin.ClientMain(&Plugin{})
}
