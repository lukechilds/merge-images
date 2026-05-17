import {Buffer} from 'node:buffer';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {expect, test} from '@playwright/test';

const bundlePath = fileURLToPath(new URL('../../dist/index.umd.js', import.meta.url));
const modulePath = new URL('../../dist/index.mjs', import.meta.url);
const fixtureUrl = image => new URL(`../fixtures/${image}`, import.meta.url);

const getDataUri = async image => {
	const buffer = await readFile(fixtureUrl(image));
	const extension = image.slice(image.lastIndexOf('.') + 1);
	const mimeType = extension === 'jpeg' || extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;

	return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const getFixtureDataUris = async names => Object.fromEntries(await Promise.all(names.map(async name => [name, await getDataUri(name)])));

const installBundle = async page => {
	await page.goto('about:blank');
	await page.addScriptTag({path: bundlePath});

	expect(await page.evaluate(() => typeof globalThis.mergeImages)).toBe('function');
};

const installModuleBundle = async page => {
	const moduleSource = await readFile(modulePath);
	const moduleDataUrl = `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`;

	await page.goto('about:blank');
	await page.addScriptTag({
		type: 'module',
		content: `import mergeImages from ${JSON.stringify(moduleDataUrl)}; globalThis.mergeImagesModule = mergeImages;`,
	});
	await page.waitForFunction(() => typeof globalThis.mergeImagesModule === 'function');
};

const composeExpectedBrowserImage = async (page, sources, options = {}) => page.evaluate(async ({sources, options}) => {
	const loadImage = source => new Promise((resolve, reject) => {
		const image = new globalThis.Image();

		image.onerror = () => {
			reject(new Error('Couldn\'t load image'));
		};

		image.onload = () => {
			resolve(image);
		};

		image.src = source;
	});

	const images = await Promise.all(sources.map(async source => {
		const normalizedSource = typeof source === 'object' && source !== null && 'src' in source ? source : {src: source};

		return {
			...normalizedSource,
			image: await loadImage(normalizedSource.src),
		};
	}));

	const canvas = globalThis.document.createElement('canvas');
	const context = canvas.getContext('2d');

	canvas.width = options.width || Math.max(...images.map(image => image.image.width));
	canvas.height = options.height || Math.max(...images.map(image => image.image.height));

	for (const image of images) {
		context.globalAlpha = image.opacity || 1;
		context.drawImage(image.image, image.x || 0, image.y || 0);
	}

	return canvas.toDataURL(options.format || 'image/png', options.quality ?? 0.92);
}, {sources, options});

const assertBrowserImagesMatch = async (page, actualDataUri, expectedDataUri, tolerance = 0) => {
	const result = await page.evaluate(async ({actualDataUri, expectedDataUri, tolerance}) => {
		const loadImage = source => new Promise((resolve, reject) => {
			const image = new globalThis.Image();

			image.onerror = () => {
				reject(new Error('Couldn\'t load image'));
			};

			image.onload = () => {
				resolve(image);
			};

			image.src = source;
		});

		const getImageData = image => {
			const canvas = globalThis.document.createElement('canvas');
			const context = canvas.getContext('2d');

			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0);

			return context.getImageData(0, 0, image.width, image.height).data;
		};

		const [actualImage, expectedImage] = await Promise.all([
			loadImage(actualDataUri),
			loadImage(expectedDataUri),
		]);

		if (actualImage.width !== expectedImage.width || actualImage.height !== expectedImage.height) {
			return {
				width: actualImage.width,
				height: actualImage.height,
				expectedWidth: expectedImage.width,
				expectedHeight: expectedImage.height,
				mismatchedPixels: Number.POSITIVE_INFINITY,
			};
		}

		const actual = getImageData(actualImage);
		const expected = getImageData(expectedImage);
		let mismatchedPixels = 0;

		for (let index = 0; index < actual.length; index += 4) {
			const maxChannelDelta = Math.max(
				Math.abs(actual[index] - expected[index]),
				Math.abs(actual[index + 1] - expected[index + 1]),
				Math.abs(actual[index + 2] - expected[index + 2]),
				Math.abs(actual[index + 3] - expected[index + 3]),
			);

			if (maxChannelDelta > tolerance) {
				mismatchedPixels++;
			}
		}

		return {
			width: actualImage.width,
			height: actualImage.height,
			expectedWidth: expectedImage.width,
			expectedHeight: expectedImage.height,
			mismatchedPixels,
		};
	}, {actualDataUri, expectedDataUri, tolerance});

	expect(result).toEqual({
		width: result.expectedWidth,
		height: result.expectedHeight,
		expectedWidth: result.expectedWidth,
		expectedHeight: result.expectedHeight,
		mismatchedPixels: 0,
	});
};

const getBrowserImageSize = async (page, dataUri) => page.evaluate(async dataUri => {
	const image = await new Promise((resolve, reject) => {
		const image = new globalThis.Image();

		image.onerror = () => {
			reject(new Error('Couldn\'t load image'));
		};

		image.onload = () => {
			resolve(image);
		};

		image.src = dataUri;
	});

	return {
		width: image.width,
		height: image.height,
	};
}, dataUri);

test('UMD browser build exposes mergeImages and returns a Promise', async ({page}) => {
	await installBundle(page);

	expect(await page.evaluate(() => globalThis.mergeImages([]) instanceof Promise)).toBe(true);
	expect(await page.evaluate(() => globalThis.mergeImages([]))).toBe('data:,');
});

test('ESM browser build exposes mergeImages and uses DOM defaults', async ({page}) => {
	await installModuleBundle(page);

	const fixtures = await getFixtureDataUris(['face.png']);
	const dataUri = await page.evaluate(async image => globalThis.mergeImagesModule([image]), fixtures['face.png']);

	expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);
	expect(await getBrowserImageSize(page, dataUri)).toEqual({
		width: 256,
		height: 256,
	});
});

test('UMD browser build merges images with DOM Image and browser canvas', async ({page}) => {
	await installBundle(page);

	const fixtures = await getFixtureDataUris(['body.png', 'mouth.png', 'eyes.png']);
	const dataUri = await page.evaluate(async fixtures => globalThis.mergeImages([
		fixtures['body.png'],
		fixtures['mouth.png'],
		fixtures['eyes.png'],
	]), fixtures);
	const expectedDataUri = await composeExpectedBrowserImage(page, [
		fixtures['body.png'],
		fixtures['mouth.png'],
		fixtures['eyes.png'],
	]);

	expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);
	await assertBrowserImagesMatch(page, dataUri, expectedDataUri);
});

test('UMD browser build supports dimensions, positions and opacity', async ({page}) => {
	await installBundle(page);

	const fixtures = await getFixtureDataUris([
		'body.png',
		'eyes.png',
		'mouth.png',
		'face-opacity.png',
	]);

	const customDimensions = await page.evaluate(async fixtures => globalThis.mergeImages([fixtures['face-opacity.png']], {
		width: 128,
		height: 128,
	}), fixtures);
	const expectedCustomDimensions = await composeExpectedBrowserImage(page, [fixtures['face-opacity.png']], {
		width: 128,
		height: 128,
	});

	await assertBrowserImagesMatch(page, customDimensions, expectedCustomDimensions);

	const customPositions = await page.evaluate(async fixtures => globalThis.mergeImages([
		{src: fixtures['body.png'], x: 0, y: 0},
		{src: fixtures['eyes.png'], x: 32, y: 0},
		{src: fixtures['mouth.png'], x: 16, y: 0},
	]), fixtures);
	const expectedCustomPositions = await composeExpectedBrowserImage(page, [
		{src: fixtures['body.png'], x: 0, y: 0},
		{src: fixtures['eyes.png'], x: 32, y: 0},
		{src: fixtures['mouth.png'], x: 16, y: 0},
	]);

	await assertBrowserImagesMatch(page, customPositions, expectedCustomPositions);

	const opacity = await page.evaluate(async fixtures => globalThis.mergeImages([
		{src: fixtures['body.png']},
		{src: fixtures['eyes.png'], opacity: 0.7},
		{src: fixtures['mouth.png'], opacity: 0.3},
	]), fixtures);
	const expectedOpacity = await composeExpectedBrowserImage(page, [
		{src: fixtures['body.png']},
		{src: fixtures['eyes.png'], opacity: 0.7},
		{src: fixtures['mouth.png'], opacity: 0.3},
	]);

	await assertBrowserImagesMatch(page, opacity, expectedOpacity);
});

test('UMD browser build supports jpeg format and quality', async ({page}) => {
	await installBundle(page);

	const fixtures = await getFixtureDataUris(['face.png']);
	const highQualityDataUri = await page.evaluate(async image => globalThis.mergeImages([image], {
		format: 'image/jpeg',
		quality: 0.92,
	}), fixtures['face.png']);
	const lowQualityDataUri = await page.evaluate(async image => globalThis.mergeImages([image], {
		format: 'image/jpeg',
		quality: 0.1,
	}), fixtures['face.png']);

	expect(highQualityDataUri.startsWith('data:image/jpeg;base64,')).toBe(true);
	expect(lowQualityDataUri.startsWith('data:image/jpeg;base64,')).toBe(true);
	expect(lowQualityDataUri.length).toBeLessThan(highQualityDataUri.length);
	expect(await getBrowserImageSize(page, lowQualityDataUri)).toEqual({
		width: 256,
		height: 256,
	});
});

test('UMD browser build applies crossOrigin and rejects image load errors', async ({page}) => {
	await installBundle(page);

	const fixtures = await getFixtureDataUris(['face.png']);
	const crossOriginValues = await page.evaluate(async image => {
		const OriginalImage = globalThis.Image;
		const crossOriginValues = [];

		globalThis.Image = class TrackingImage extends OriginalImage {
			get crossOrigin() {
				return super.crossOrigin;
			}

			set crossOrigin(value) {
				crossOriginValues.push(value);
				super.crossOrigin = value;
			}
		};

		try {
			await globalThis.mergeImages([image], {
				crossOrigin: 'Anonymous',
			});
		} finally {
			globalThis.Image = OriginalImage;
		}

		return crossOriginValues;
	}, fixtures['face.png']);

	expect(crossOriginValues).toContain('Anonymous');

	expect(await page.evaluate(async () => {
		try {
			await globalThis.mergeImages(['nothing-here.jpg']);
			return 'resolved';
		} catch (error) {
			return error.message;
		}
	})).toBe('Couldn\'t load image');
});
