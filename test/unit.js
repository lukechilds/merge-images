import test from 'ava';
import Canvas from 'canvas';
import mergeImages from '..';
import fixtures from './fixtures';

const fs = require('fs');
const { Buffer } = require('safe-buffer');
const currentOs = process.platform
require('browser-env')();

function decodeBase64Image(dataString) {
	const matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
	const response = {};

	if (matches.length !== 3) {
		return new Error('Invalid input string');
	}

	response.type = matches[1];
	response.data = Buffer.from(matches[2], 'base64');
	return response;
}

test('mergeImages returns empty b64 string if nothing is passed in', async t => {
	t.plan(1);
	const b64 = await mergeImages([], { Canvas });

	t.true(b64 === 'data:,');
});

test('mergeImages returns correct data URI', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], { Canvas });

	const expectedB64 = await fixtures.getDataURI('face.png');

	t.true(b64 === expectedB64);
});

['png', 'jpeg'].forEach(format => {
	test(`mergeImages encodes ${format} format`, async t => {
		t.plan(1);
		const image = await fixtures.getImage('face.png');
		const b64 = await mergeImages([image], {
			format: `image/${format}`,
			Canvas
		});

		const expectedB64 = await fixtures.getDataURI(`face-${currentOs}.${format}`);

		// let imageBuffer = await decodeBase64Image(b64)
		// fs.writeFile(`face-${currentOs}.${format}`, imageBuffer.data, () => { console.log('image saved') })

		t.true(b64 === expectedB64);
	});
});

test('mergeImages correctly merges images', async t => {
	t.plan(1);
	const images = await Promise.all(['body.png', 'mouth.png', 'eyes.png'].map(image => fixtures.getImage(image)));
	const b64 = await mergeImages(images, { Canvas });

	const expectedB64 = await fixtures.getDataURI('face.png');

	t.true(b64 === expectedB64);
});

test('mergeImages uses custom dimensions', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], {
		width: 128,
		height: 128,
		Canvas
	});

	const expectedB64 = await fixtures.getDataURI('face-custom-dimension.png');

	// let imageBuffer = await decodeBase64Image(b64)
	// fs.writeFile(`face-custom-dimension.png`, imageBuffer.data, () => { console.log('image saved') })

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
	const b64 = await mergeImages(images, { Canvas });

	const expectedB64 = await fixtures.getDataURI('face-custom-positions.png');

	t.true(b64 === expectedB64);
});

test('mergeImages uses custom jpeg quality', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([image], {
		format: 'image/jpeg',
		quality: 0.1,
		Canvas
	});

	const expectedB64 = await fixtures.getDataURI(`face-low-quality-${currentOs}.jpeg`);

	// let imageBuffer = await decodeBase64Image(b64)
	// fs.writeFile(`face-low-quality-${currentOs}.jpeg`, imageBuffer.data, () => { console.log('image saved') })

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
	const b64 = await mergeImages(images, { Canvas });

	const expectedB64 = await fixtures.getDataURI('face-opacity.png');

	t.true(b64 === expectedB64);
});

test('mergeImages adjust soure image width and height', async t => {
	t.plan(1);
	const image = await fixtures.getImage('face.png');
	const b64 = await mergeImages([{ src: image, width: 128, height: 128 }], {
		Canvas
	});

	const expectedB64 = await fixtures.getDataURI('face-128x128.png');

	// let imageBuffer = await decodeBase64Image(b64)
	// fs.writeFile(`face-128x128.png`, imageBuffer.data, () => { console.log('image saved') })

	t.true(b64 === expectedB64);
});
