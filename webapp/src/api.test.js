import assert from 'node:assert/strict';
import {test} from 'node:test';

import {toFavorite} from './api.js';

test('toFavorite se queda con id y url downsized', () => {
    const gif = {id: 'abc', images: {downsized: {url: 'https://media.giphy.com/media/abc/giphy.gif'}, original: {url: 'x'}}};
    assert.deepEqual(toFavorite(gif), {id: 'abc', url: 'https://media.giphy.com/media/abc/giphy.gif'});
});
