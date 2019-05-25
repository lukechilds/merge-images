import test from 'ava';
import Canvas from 'canvas';
import mergeImages from '..';

require('browser-env')();

test('mergeImages rejects Promise if node-canvas instance isn\'t passed in', async t => {
	const error = mergeImages([]);
	t.is(await error, 'data:,');
});

test('mergeImages rejects Promise if image load errors', async t => {
	const error = mergeImages([], { Canvas });
	t.is(await error, 'data:,');
});
