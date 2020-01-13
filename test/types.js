import test from 'ava';
import { Canvas, Image } from 'canvas';
import mergeImages from '../';

test('mergeImages is a function', t => {
	t.is(typeof mergeImages, 'function');
});

test('mergeImages returns a Promise', t => {
	t.true(mergeImages([], { Canvas, Image }) instanceof Promise);
});
