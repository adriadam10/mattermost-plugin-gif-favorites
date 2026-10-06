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
        throw Object.assign(new Error(`${path}: ${res.status}`), {status: res.status});
    }
    return res.json();
}

export const toFavorite = (gif) => ({id: gif.id, url: gif.images.downsized.url});

export async function listFavorites(userId) {
    let prefs;
    try {
        prefs = await mm(`/users/${userId}/preferences/${CATEGORY}`);
    } catch (e) {
        // Mattermost devuelve 404 mientras la categoría no tiene ninguna preferencia.
        if (e.status === 404) {
            return [];
        }
        throw e;
    }
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
// Devuelve una página y el offset de la siguiente (null si no quedan; GIPHY limita el offset a 4999).
export async function searchGiphy(key, query, offset = 0) {
    const q = new URLSearchParams({api_key: key, limit: '30', rating: 'pg-13', offset: String(offset)});
    if (query) {
        q.set('q', query);
    }
    const res = await fetch(`https://api.giphy.com/v1/gifs/${query ? 'search' : 'trending'}?${q}`);
    if (!res.ok) {
        throw new Error(`giphy: ${res.status}`);
    }
    const {data, pagination} = await res.json();
    const next = offset + data.length;
    return {gifs: data.map(toFavorite), next: data.length && next < Math.min(pagination.total_count || 5000, 5000) ? next : null};
}

// GIF de un mensaje: imágenes que Mattermost ya ha resuelto, imágenes markdown y enlaces a GIPHY.
const GIF_URL = /https?:\/\/[^\s)<>"]+/g;
const isGif = (u) => /\.gif(\?|$)/i.test(u) || /(media[0-9]*\.giphy\.com\/media|tenor\.com\/)/i.test(u);

// El nombre de una preferencia admite 32 caracteres: id de GIPHY si lo hay, si no un hash de la URL.
function gifId(url) {
    const m = url.match(/giphy\.com\/media\/(?:v1\.[^/]+\/)?([A-Za-z0-9]+)\//);
    if (m) {
        return m[1];
    }
    let h = 5381;
    for (const c of url) {
        h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
    }
    return `u${h.toString(36)}${url.length.toString(36)}`;
}

export function gifFromPost(post) {
    const candidates = [...Object.keys(post?.metadata?.images || {}), ...(post?.message?.match(GIF_URL) || [])];
    const url = candidates.find(isGif);
    if (url) {
        return {id: gifId(url), url};
    }
    // Enlace de página de GIPHY (giphy.com/gifs/slug-ID): se reconstruye la URL del fichero.
    const page = post?.message?.match(/giphy\.com\/gifs\/(?:[^/\s)]*-)?([A-Za-z0-9]+)(?:[\s)]|$)/);
    return page ? {id: page[1], url: `https://media.giphy.com/media/${page[1]}/giphy.gif`} : null;
}
