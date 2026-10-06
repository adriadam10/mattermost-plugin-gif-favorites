import React, {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {addFavorite, listFavorites, removeFavorite, searchGiphy, sendGif} from './api.js';

export const OPEN_EVENT = 'gif-favorites:open';

export default function Panel() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('favorites');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [favs, setFavs] = useState([]);
    const [error, setError] = useState('');

    const userId = useSelector((s) => s.entities.users.currentUserId);
    const channelId = useSelector((s) => s.entities.channels.currentChannelId);
    const key = useSelector((s) => s.entities.general.config.GiphySdkKey);

    useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => window.removeEventListener(OPEN_EVENT, onOpen);
    }, []);

    const fail = (e) => setError(String(e.message || e));

    useEffect(() => {
        if (open) {
            listFavorites(userId).then(setFavs, fail);
        }
    }, [open, userId]);

    // Búsqueda con debounce; sin texto muestra los trending.
    useEffect(() => {
        if (!open || tab !== 'search') {
            return undefined;
        }
        if (!key) {
            setError('Falta ServiceSettings.GiphySdkKey');
            return undefined;
        }
        const t = setTimeout(() => searchGiphy(key, query.trim()).then(setResults, fail), 300);
        return () => clearTimeout(t);
    }, [open, tab, query, key]);

    const isFav = (id) => favs.some((f) => f.id === id);

    const toggle = useCallback(async (gif) => {
        try {
            if (isFav(gif.id)) {
                await removeFavorite(userId, gif);
                setFavs((l) => l.filter((f) => f.id !== gif.id));
            } else {
                await addFavorite(userId, gif);
                setFavs((l) => [...l, gif]);
            }
        } catch (e) {
            fail(e);
        }
    }, [userId, favs]);

    const send = async (gif) => {
        try {
            await sendGif(channelId, gif.url);
            setOpen(false);
        } catch (e) {
            fail(e);
        }
    };

    if (!open) {
        return null;
    }

    const list = tab === 'favorites' ? favs : results;
    return (
        <div className='gif-fav__backdrop' onClick={() => setOpen(false)}>
            <div className='gif-fav' onClick={(e) => e.stopPropagation()}>
                <div className='gif-fav__bar'>
                    <button className={tab === 'favorites' ? 'is-active' : ''} onClick={() => setTab('favorites')}>{'★ Favoritos'}</button>
                    <button className={tab === 'search' ? 'is-active' : ''} onClick={() => setTab('search')}>{'Buscar'}</button>
                    {tab === 'search' && (
                        <input autoFocus={true} placeholder='Buscar en GIPHY…' value={query} onChange={(e) => setQuery(e.target.value)}/>
                    )}
                    <button onClick={() => setOpen(false)}>{'✕'}</button>
                </div>
                {error && <div className='gif-fav__error'>{error}</div>}
                {list.length === 0 && <div className='gif-fav__empty'>{tab === 'favorites' ? 'Aún no tienes favoritos: búscalos y pulsa ☆.' : 'Sin resultados.'}</div>}
                <div className='gif-fav__grid'>
                    {list.map((g) => (
                        <div key={g.id} className='gif-fav__item'>
                            <img src={g.url} loading='lazy' onClick={() => send(g)}/>
                            <button onClick={() => toggle(g)}>{isFav(g.id) ? '★' : '☆'}</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
