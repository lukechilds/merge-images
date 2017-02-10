import test from 'ava';
import Canvas from 'canvas';
import fixtures from './fixtures';
import mergeImages from '../';

test('mergeImages returns empty b64 string if nothing is passed in', async t => {
	t.plan(1);
	await mergeImages([], { Canvas }).then(b64 => t.is(b64, 'data:,'));
});

test('mergeImages correctly merges images', async t => {
	t.plan(1);
	const images = await Promise.all(['body', 'mouth', 'eyes'].map(image => fixtures.getImage(image)));
	const b64 = await mergeImages(images, { Canvas });

	const face = await fixtures.getImage('face');
	const expectedB64 = `data:image/png;base64,${face.toString('base64')}`;

	t.is(b64, expectedB64);
});
