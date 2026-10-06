import React from 'react';
import manifest from '../../plugin.json';

import {startInlineStars} from './inline_star.js';
import Panel, {OPEN_EVENT} from './panel.jsx';

const ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#f5a623" d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg>')}`;

const STYLES = `
.gif-fav__backdrop { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
.gif-fav { width: 640px; max-width: 95vw; height: 70vh; display: flex; flex-direction: column; background: var(--center-channel-bg); color: var(--center-channel-color); border-radius: 8px; padding: 12px; }
.gif-fav__bar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.gif-fav__bar input { flex: 1; padding: 4px 8px; background: var(--center-channel-bg); color: var(--center-channel-color); border: 1px solid rgba(var(--center-channel-color-rgb), 0.24); border-radius: 4px; }
.gif-fav__bar input::placeholder { color: rgba(var(--center-channel-color-rgb), 0.56); }
.gif-fav__bar button.is-active { font-weight: bold; text-decoration: underline; }
.gif-fav__bar button, .gif-fav__item button { border: none; background: none; color: inherit; cursor: pointer; }
.gif-fav__grid { flex: 1; overflow-y: auto; overflow-x: hidden; }
.gif-fav__cols { columns: 3; column-gap: 8px; }
.gif-fav__item { position: relative; break-inside: avoid; margin-bottom: 8px; }
.gif-fav__item img { width: 100%; display: block; border-radius: 4px; cursor: pointer; }
.gif-fav__item button { position: absolute; top: 4px; right: 4px; font-size: 20px; color: #f5c518; text-shadow: 0 0 3px #000; }
.gif-fav__imgstar { position: absolute; bottom: 6px; right: 6px; border: none; border-radius: 4px; padding: 0 6px; background: rgba(0,0,0,.55); color: #fff; font-size: 20px; line-height: 28px; cursor: pointer; opacity: 0; transition: opacity .15s; }
figure:hover > .gif-fav__imgstar, .gif-fav__imgstar.is-fav { opacity: 1; }
.gif-fav__imgstar.is-fav { color: #f5c518; }
.gif-fav__error { color: var(--error-text); font-size: 12px; }
.gif-fav__empty { opacity: .7; padding: 16px; }
`;

class Plugin {
    initialize(registry, store) {
        this.style = document.createElement('style');
        this.style.textContent = STYLES;
        document.head.appendChild(this.style);

        registry.registerRootComponent(Panel);
        registry.registerChannelHeaderButtonAction(
            <img src={ICON} width={20} height={20}/>,
            () => window.dispatchEvent(new Event(OPEN_EVENT)),
            'GIFs favoritos',
            'GIFs favoritos',
        );

        this.stopStars = startInlineStars(store);
    }

    uninitialize() {
        this.stopStars?.();
        this.style?.remove();
    }
}

window.registerPlugin(manifest.id, new Plugin());
