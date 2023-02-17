import mergeImages from '../';
import test from 'ava';
import { Canvas, Image } from 'canvas';

test('mergeImages is a function', t => {
	t.is(typeof mergeImages, 'function');
});

test('mergeImages returns a Promise', t => {
	t.true(mergeImages([], { Canvas, Image }) instanceof Promise);
});
