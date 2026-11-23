package main

import (
	"fmt"
	"strings"
)

type messages struct {
	usage       string
	noFavorites string
	notFound    string
}

var spanish = messages{
	usage:       "`/gif-fav <favorito>` envía uno de tus favoritos (para buscar en GIPHY, `/gif`). Tus favoritos:",
	noFavorites: "Aún no tienes favoritos: guárdalos con la ★ desde Mattermost en el navegador o el escritorio.",
	notFound:    "No tienes ningún favorito llamado `%s`.",
}

var english = messages{
	usage:       "`/gif-fav <favourite>` sends one of your favourites (to search GIPHY, `/gif`). Your favourites:",
	noFavorites: "No favourites yet: save them with the ★ from Mattermost on the web or the desktop app.",
	notFound:    "You have no favourite named `%s`.",
}

func texts(locale string) messages {
	if strings.HasPrefix(locale, "es") {
		return spanish
	}
	return english
}

func usage(t messages, favs []favorite) string {
	if len(favs) == 0 {
		return t.noFavorites
	}
	var b strings.Builder
	b.WriteString(t.usage)
	for _, fav := range favs {
		b.WriteString("\n- `" + fav.Name + "`")
		if fav.Title != "" {
			b.WriteString(" — " + fav.Title)
		}
	}
	return b.String()
}

func notFound(t messages, query string, favs []favorite) string {
	return fmt.Sprintf(t.notFound, query) + "\n\n" + usage(t, favs)
}
