# GIF Favorites

Plugin de Mattermost con dos partes:

- **Webapp**: botón ★ en el header de canal que abre un panel con **Favoritos** y **Buscar**
  (GIPHY, con la `ServiceSettings.GiphySdkKey` del servidor). Click en un GIF lo envía al canal actual.
- **Servidor**: el comando **`/gif-fav`**, para los clientes sin la parte web (apps móviles, clientes
  nativos como Matty). `/gif-fav <favorito>` envía un favorito, con autocompletado de sus nombres;
  `/gif-fav` solo los lista. El nombre de cada favorito sale de su título en GIPHY
  (`Happy Dance GIF` → `happy-dance`). Buscar en GIPHY desde esos clientes es cosa de `/gif`, del
  plugin [GIPHY commands](https://github.com/moussetc/mattermost-plugin-giphy).

Los favoritos se guardan por usuario en las preferencias de Mattermost (categoría `gif_favorites`,
nombre = id de GIPHY, valor = URL), así que son los mismos en todos los clientes. Guardarlos sigue
siendo cosa del panel web.

Build: `./build.sh` → `dist/<id>-<version>.tar.gz` (Go y Node en contenedores; solo hace falta Docker).
Release: push de tag `vX.Y.Z`. Instalación: `mmctl plugin install-url` con el asset del release.
