import test from 'ava';
import { Canvas, Image } from 'canvas';
import mergeImages from '../';
import fixtures from './fixtures';

test('mergeImages returns empty b64 string if nothing is passed in', async t => {
	t.plan(1);
	await mergeImages([], { Canvas, Image }).then(b64 => t.true(b64 === 'data:,'));
});

test('mergeImages returns correct data URI', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], { Canvas, Image });

	const expectedB64 = await fixtures.getDataURI('face.png');

	t.true(b64 === expectedB64);
});

['png', 'jpeg'].forEach(format => {
	test(`mergeImages encodes ${format} format`, async t => {
		t.plan(1);
		const image = await fixtures.getImage('face.png');
		const b64 = await mergeImages([image], {
			format: `image/${format}`,
			Canvas,
			Image
		});

		const expectedB64 = await fixtures.getDataURI(`face.${format}`);

		t.true(b64 === expectedB64);
	});
});

test('mergeImages correctly merges images', async t => {
	t.plan(1);
	const images = await Promise.all(['body.png', 'mouth.png', 'eyes.png'].map(image => fixtures.getImage(image)));
	const b64 = await mergeImages(images, { Canvas, Image });

	const expectedB64 = await fixtures.getDataURI('face.png');

	t.true(b64 === expectedB64);
});

test('mergeImages uses custom dimensions', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], {
		width: 128,
		height: 128,
		Canvas,
		Image
	});

	const expectedB64 = await fixtures.getDataURI('face-custom-dimension.png');

	t.true(b64 === expectedB64);
});

test('mergeImages uses custom positions', async t => {
	t.plan(1);
	const images = await Promise.all([
		{ src: 'body.png', x: 0, y: 0 },
		{ src: 'eyes.png', x: 32, y: 0 },
		{ src: 'mouth.png', x: 16, y: 0 }
	].map(image => fixtures.getImage(image.src).then(src => {
		image.src = src;
		return image;
	})));
	const b64 = await mergeImages(images, { Canvas, Image });

	const expectedB64 = await fixtures.getDataURI('face-custom-positions.png');

	t.true(b64 === expectedB64);
});

test('mergeImages uses custom jpeg quality', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], {
		format: 'image/jpeg',
		quality: 0.1,
		Canvas,
		Image
	});

	const expectedB64 = await fixtures.getDataURI('face-low-quality.jpeg');

	t.true(b64 === expectedB64);
});

test('mergeImages uses opacity', async t => {
	t.plan(1);
	const images = await Promise.all([
		{ src: 'body.png' },
		{ src: 'eyes.png', opacity: 0.7 },
		{ src: 'mouth.png', opacity: 0.3 }
	].map(image => fixtures.getImage(image.src).then(src => {
		image.src = src;
		return image;
	})));
	const b64 = await mergeImages(images, { Canvas, Image });

	const expectedB64 = await fixtures.getDataURI('face-opacity.png');

	t.true(b64 === expectedB64);
});
