import test from 'ava';
import Canvas from 'canvas';
import mergeImages from '../';
import fixtures from './fixtures';

test('mergeImages rejects Promise if node-canvas instance isn\'t passed in', async t => {
	t.plan(1);
	t.throws(mergeImages([]));
});

test('mergeImages rejects Promise if image load errors', async t => {
	t.plan(1);
	t.throws(mergeImages([1], { Canvas }));
});
