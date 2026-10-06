// Favoritos = preferencias del usuario en Mattermost (categoría gif_favorites, nombre = id de GIPHY).
// Se guardan en el servidor por usuario, sin parte servidor en el plugin.
export const CATEGORY = 'gif_favorites';

const csrf = () => document.cookie.split('; ').find((c) => c.startsWith('MMCSRF='))?.split('=')[1] || '';

async function mm(path, options = {}) {
    const res = await fetch(`/api/v4${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: {'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-Token': csrf(), 'Content-Type': 'application/json'},
    });
    if (!res.ok) {
        throw new Error(`${path}: ${res.status}`);
    }
    return res.json();
}

export const toFavorite = (gif) => ({id: gif.id, url: gif.images.downsized.url});

export async function listFavorites(userId) {
    const prefs = await mm(`/users/${userId}/preferences/${CATEGORY}`);
    return prefs.map((p) => ({id: p.name, url: p.value}));
}

export const addFavorite = (userId, fav) => mm(`/users/${userId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify([{user_id: userId, category: CATEGORY, name: fav.id, value: fav.url}]),
});

export const removeFavorite = (userId, fav) => mm(`/users/${userId}/preferences/delete`, {
    method: 'POST',
    body: JSON.stringify([{user_id: userId, category: CATEGORY, name: fav.id, value: fav.url}]),
});

export const sendGif = (channelId, url) => mm('/posts', {
    method: 'POST',
    body: JSON.stringify({channel_id: channelId, message: `![gif](${url})`}),
});

// La clave SDK es la misma que usa el selector nativo (ServiceSettings.GiphySdkKey).
export async function searchGiphy(key, query) {
    const q = new URLSearchParams({api_key: key, limit: '30', rating: 'pg-13'});
    if (query) {
        q.set('q', query);
    }
    const res = await fetch(`https://api.giphy.com/v1/gifs/${query ? 'search' : 'trending'}?${q}`);
    if (!res.ok) {
        throw new Error(`giphy: ${res.status}`);
    }
    return (await res.json()).data.map(toFavorite);
}
