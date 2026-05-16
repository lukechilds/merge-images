import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import canvas from 'canvas'
import mergeImages from '../dist/index.mjs'

const { Canvas, Image, createCanvas, loadImage } = canvas
const require = createRequire(import.meta.url)
const mergeImagesCommonJs = require('..')

const fixtureUrl = (image) => new URL(`fixtures/${image}`, import.meta.url)

const getImage = (image) => readFile(fixtureUrl(image))

const getDataUri = async (image) => {
  const buffer = await getImage(image)
  const extension = image.slice(image.lastIndexOf('.') + 1)
  const mimeType =
    extension === 'jpeg' || extension === 'jpg'
      ? 'image/jpeg'
      : `image/${extension}`

  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

const getImageData = async (source) => {
  const image = await loadImage(source)
  const canvas = createCanvas(image.width, image.height)
  const context = canvas.getContext('2d')

  context.drawImage(image, 0, 0)

  return {
    width: image.width,
    height: image.height,
    data: context.getImageData(0, 0, image.width, image.height).data
  }
}

const assertMatchesFixture = async (actualDataUri, fixture, tolerance = 0) => {
  const expectedDataUri = await getDataUri(fixture)
  const actual = await getImageData(actualDataUri)
  const expected = await getImageData(expectedDataUri)

  assert.equal(actual.width, expected.width)
  assert.equal(actual.height, expected.height)
  assert.equal(actual.data.length, expected.data.length)

  let mismatchedPixels = 0

  for (let index = 0; index < actual.data.length; index += 4) {
    const maxChannelDelta = Math.max(
      Math.abs(actual.data[index] - expected.data[index]),
      Math.abs(actual.data[index + 1] - expected.data[index + 1]),
      Math.abs(actual.data[index + 2] - expected.data[index + 2]),
      Math.abs(actual.data[index + 3] - expected.data[index + 3])
    )

    if (maxChannelDelta > tolerance) {
      mismatchedPixels++
    }
  }

  assert.equal(mismatchedPixels, 0)
}

const assertImageSize = async (dataUri, width, height) => {
  const image = await loadImage(dataUri)

  assert.equal(image.width, width)
  assert.equal(image.height, height)
}

test('mergeImages is exposed from ESM and CommonJS entry points', () => {
  assert.equal(typeof mergeImages, 'function')
  assert.equal(typeof mergeImagesCommonJs, 'function')
})

test('mergeImages returns a Promise', () => {
  assert.ok(mergeImages([], { Canvas, Image }) instanceof Promise)
})

test('mergeImages returns empty b64 string if nothing is passed in', async () => {
  assert.equal(await mergeImages([], { Canvas, Image }), 'data:,')
})

test('mergeImages returns correct data URI', async () => {
  const image = await getImage('face.png')
  const dataUri = await mergeImages([image], { Canvas, Image })

  await assertMatchesFixture(dataUri, 'face.png')
})

test('mergeImages encodes png format', async () => {
  const image = await getImage('face.png')
  const dataUri = await mergeImages([image], {
    format: 'image/png',
    Canvas,
    Image
  })

  assert.ok(dataUri.startsWith('data:image/png;base64,'))
  await assertMatchesFixture(dataUri, 'face.png')
})

test('mergeImages encodes jpeg format', async () => {
  const image = await getImage('face.png')
  const dataUri = await mergeImages([image], {
    format: 'image/jpeg',
    Canvas,
    Image
  })

  assert.ok(dataUri.startsWith('data:image/jpeg;base64,'))
  await assertImageSize(dataUri, 256, 256)
})

test('mergeImages correctly merges images', async () => {
  const images = await Promise.all(
    ['body.png', 'mouth.png', 'eyes.png'].map((image) => getImage(image))
  )
  const dataUri = await mergeImages(images, { Canvas, Image })

  await assertMatchesFixture(dataUri, 'face.png')
})

test('mergeImages uses custom dimensions', async () => {
  const image = await getImage('face.png')
  const dataUri = await mergeImages([image], {
    width: 128,
    height: 128,
    Canvas,
    Image
  })

  await assertMatchesFixture(dataUri, 'face-custom-dimension.png')
})

test('mergeImages uses custom positions', async () => {
  const images = await Promise.all(
    [
      { src: 'body.png', x: 0, y: 0 },
      { src: 'eyes.png', x: 32, y: 0 },
      { src: 'mouth.png', x: 16, y: 0 }
    ].map(async (image) => ({
      ...image,
      src: await getImage(image.src)
    }))
  )
  const dataUri = await mergeImages(images, { Canvas, Image })

  await assertMatchesFixture(dataUri, 'face-custom-positions.png')
})

test('mergeImages uses custom jpeg quality', async () => {
  const image = await getImage('face.png')
  const highQualityDataUri = await mergeImages([image], {
    format: 'image/jpeg',
    quality: 0.92,
    Canvas,
    Image
  })
  const lowQualityDataUri = await mergeImages([image], {
    format: 'image/jpeg',
    quality: 0.1,
    Canvas,
    Image
  })

  assert.ok(highQualityDataUri.startsWith('data:image/jpeg;base64,'))
  assert.ok(lowQualityDataUri.startsWith('data:image/jpeg;base64,'))
  assert.ok(lowQualityDataUri.length < highQualityDataUri.length)
  await assertImageSize(lowQualityDataUri, 256, 256)
})

test('mergeImages uses opacity', async () => {
  const images = await Promise.all(
    [
      { src: 'body.png' },
      { src: 'eyes.png', opacity: 0.7 },
      { src: 'mouth.png', opacity: 0.3 }
    ].map(async (image) => ({
      ...image,
      src: await getImage(image.src)
    }))
  )
  const dataUri = await mergeImages(images, { Canvas, Image })

  await assertMatchesFixture(dataUri, 'face-opacity.png')
})

test('mergeImages rejects Promise if node-canvas instance is not passed in', async () => {
  await assert.rejects(mergeImages([]))
})

test('mergeImages rejects Promise if image load errors', async () => {
  await assert.rejects(mergeImages(['nothing-here.jpg'], { Canvas, Image }))
})
