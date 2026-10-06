import manifest from '../../plugin.json';

import Panel, {OPEN_EVENT} from './panel.jsx';

const STYLES = `
.gif-fav__backdrop { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
.gif-fav { width: 640px; max-width: 95vw; height: 70vh; display: flex; flex-direction: column; background: var(--center-channel-bg); color: var(--center-channel-color); border-radius: 8px; padding: 12px; }
.gif-fav__bar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.gif-fav__bar input { flex: 1; padding: 4px 8px; }
.gif-fav__bar button.is-active { font-weight: bold; text-decoration: underline; }
.gif-fav__bar button, .gif-fav__item button { border: none; background: none; color: inherit; cursor: pointer; }
.gif-fav__grid { flex: 1; overflow-y: auto; columns: 3; column-gap: 8px; }
.gif-fav__item { position: relative; break-inside: avoid; margin-bottom: 8px; }
.gif-fav__item img { width: 100%; display: block; border-radius: 4px; cursor: pointer; }
.gif-fav__item button { position: absolute; top: 4px; right: 4px; font-size: 20px; color: #f5c518; text-shadow: 0 0 3px #000; }
.gif-fav__error { color: var(--error-text); font-size: 12px; }
.gif-fav__empty { opacity: .7; padding: 16px; }
`;

class Plugin {
    initialize(registry) {
        this.style = document.createElement('style');
        this.style.textContent = STYLES;
        document.head.appendChild(this.style);

        registry.registerRootComponent(Panel);
        registry.registerChannelHeaderButtonAction(
            <span style={{fontSize: 18}}>{'★'}</span>,
            () => window.dispatchEvent(new Event(OPEN_EVENT)),
            'GIFs favoritos',
            'GIFs favoritos',
        );
    }

    uninitialize() {
        this.style?.remove();
    }
}

window.registerPlugin(manifest.id, new Plugin());
