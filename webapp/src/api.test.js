import assert from 'node:assert/strict';
import {test} from 'node:test';

import {gifFromPost, toFavorite} from './api.js';

test('toFavorite se queda con id y url downsized', () => {
    const gif = {id: 'abc', images: {downsized: {url: 'https://media.giphy.com/media/abc/giphy.gif'}, original: {url: 'x'}}};
    assert.deepEqual(toFavorite(gif), {id: 'abc', url: 'https://media.giphy.com/media/abc/giphy.gif'});
});

test('gifFromPost: imagen markdown de GIPHY', () => {
    const url = 'https://media0.giphy.com/media/v1.Y2lk/0DcSVWiPysUBk9b5W6/giphy-downsized.gif';
    assert.deepEqual(gifFromPost({message: `![gif](${url})`}), {id: '0DcSVWiPysUBk9b5W6', url});
});

test('gifFromPost: imagen resuelta en metadata y URL ajena con id estable', () => {
    const url = 'https://example.com/a/b.gif';
    const a = gifFromPost({message: '', metadata: {images: {[url]: {}}}});
    assert.equal(a.url, url);
    assert.ok(a.id.length <= 32);
    assert.equal(gifFromPost({message: url}).id, a.id);
});

test('gifFromPost: enlace de página de GIPHY', () => {
    assert.deepEqual(gifFromPost({message: 'mira https://giphy.com/gifs/cat-funny-AbC123 jaja'}), {id: 'AbC123', url: 'https://media.giphy.com/media/AbC123/giphy.gif'});
});

test('gifFromPost: mensaje sin GIF', () => {
    assert.equal(gifFromPost({message: 'hola https://aavv.com/foto.png'}), null);
});
