import test from 'ava';
import Canvas from 'canvas';
import mergeImages from '../';

test('mergeImages returns empty b64 string if nothing is passed in', async t => {
	t.plan(1);
	await mergeImages([], { Canvas }).then(b64 => t.is(b64, 'data:,'));
});
