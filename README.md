# GIF Favorites

Plugin de Mattermost (solo webapp): botón ★ en el header de canal que abre un panel con
**Favoritos** y **Buscar** (GIPHY, con la `ServiceSettings.GiphySdkKey` del servidor).
Los favoritos se guardan por usuario en las preferencias de Mattermost (categoría `gif_favorites`).
Click en un GIF lo envía al canal actual.

Build: `./build.sh` → `dist/<id>-<version>.tar.gz`. Release: push de tag `vX.Y.Z`.
Instalación: ver skill `mattermost-plugins` (`install-url` con el asset del release).
