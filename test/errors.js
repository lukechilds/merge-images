import test from 'ava';
import { Canvas, Image } from 'canvas';
import mergeImages from '../';

test('mergeImages rejects Promise if node-canvas instance isn\'t passed in', async t => {
	t.plan(1);
	await t.throws(mergeImages([]));
});

test('mergeImages rejects Promise if image load errors', async t => {
	t.plan(1);
	await t.throws(mergeImages(['nothing-here.jpg'], { Canvas, Image }));
});
