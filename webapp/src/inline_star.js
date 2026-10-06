import {addFavorite, gifFromPost, listFavorites, removeFavorite} from './api.js';

export const CHANGED_EVENT = 'gif-favorites:changed';

// Mattermost no deja poner nada sobre la imagen de un mensaje: se cuelga una ★ del <figure> que la envuelve.
// Si el servidor pasa la imagen por su proxy, la URL original va en el parámetro `url`.
const realSrc = (src) => (src.includes('/api/v4/image?') ? new URL(src).searchParams.get('url') || src : src);

export function startInlineStars(store) {
    const userId = () => store.getState().entities.users.currentUserId;
    let ids = new Set();

    const paint = (b) => {
        const fav = ids.has(b.dataset.id);
        b.textContent = fav ? '★' : '☆';
        b.classList.toggle('is-fav', fav);
    };
    const reload = () => listFavorites(userId()).then((l) => {
        ids = new Set(l.map((f) => f.id));
        document.querySelectorAll('.gif-fav__imgstar').forEach(paint);
    }, () => {});

    const toggle = async (gif) => {
        if (ids.has(gif.id)) {
            await removeFavorite(userId(), gif);
        } else {
            await addFavorite(userId(), gif);
        }
        window.dispatchEvent(new Event(CHANGED_EVENT));
    };

    const scan = () => document.querySelectorAll('.post-message__text figure.image-loaded-container').forEach((fig) => {
        const img = fig.querySelector('img');
        const gif = img && !fig.querySelector('.gif-fav__imgstar') && gifFromPost({message: realSrc(img.src)});
        if (!gif) {
            return;
        }
        const b = document.createElement('button');
        b.className = 'gif-fav__imgstar';
        b.title = 'Favoritos de GIFs';
        b.dataset.id = gif.id;
        b.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); // sin esto el click abre la vista ampliada de la imagen
            toggle(gif).catch(() => {});
        };
        paint(b);
        fig.appendChild(b);
    });

    let queued = false;
    const observer = new MutationObserver(() => {
        if (!queued) {
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                scan();
            });
        }
    });
    observer.observe(document.body, {childList: true, subtree: true});
    window.addEventListener(CHANGED_EVENT, reload);
    reload();
    scan();

    return () => {
        observer.disconnect();
        window.removeEventListener(CHANGED_EVENT, reload);
        document.querySelectorAll('.gif-fav__imgstar').forEach((b) => b.remove());
    };
}
