package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const giphyAPI = "https://api.giphy.com/v1/gifs"

// giphy talks to GIPHY with the server's own SDK key (ServiceSettings.GiphySdkKey),
// the one the webapp panel and Mattermost's GIF picker use.
type giphy struct {
	key    func() string
	client *http.Client
	base   string
	logErr func(msg string, keyValuePairs ...any)

	mu sync.Mutex
	// GIF titles never change, so they are kept for the life of the plugin.
	titleCache map[string]string
}

func newGiphy(key func() string, logErr func(string, ...any)) *giphy {
	return &giphy{key: key, logErr: logErr, client: &http.Client{Timeout: 5 * time.Second}, base: giphyAPI, titleCache: map[string]string{}}
}

type giphyGIF struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

func (g *giphy) get(path string, query url.Values) ([]giphyGIF, error) {
	key := g.key()
	if key == "" {
		return nil, fmt.Errorf("no GIPHY key in ServiceSettings.GiphySdkKey")
	}
	query.Set("api_key", key)
	resp, err := g.client.Get(g.base + path + "?" + query.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GIPHY %s: %s", path, resp.Status)
	}
	var body struct {
		Data []giphyGIF `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("GIPHY %s: %w", path, err)
	}
	return body.Data, nil
}

// titles looks up the titles of GIPHY ids, from the cache when it can. Ids that
// are not GIPHY's (favourites from elsewhere) or a failed lookup get no title.
func (g *giphy) titles(ids []string) map[string]string {
	out := map[string]string{}
	var missing []string
	g.mu.Lock()
	for _, id := range ids {
		if title, ok := g.titleCache[id]; ok {
			out[id] = title
		} else {
			missing = append(missing, id)
		}
	}
	g.mu.Unlock()
	if len(missing) == 0 {
		return out
	}
	gifs, err := g.get("", url.Values{"ids": {strings.Join(missing, ",")}})
	if err != nil {
		// Names then come from the URL; the next request tries again.
		g.logErr("Failed to look up GIF titles on GIPHY", "err", err.Error())
		return out
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	for _, id := range missing {
		// Remembered even when GIPHY does not know it, so it is not asked again.
		g.titleCache[id] = ""
	}
	for _, gif := range gifs {
		g.titleCache[gif.ID] = gif.Title
		out[gif.ID] = gif.Title
	}
	return out
}
