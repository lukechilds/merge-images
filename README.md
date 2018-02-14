# merge-images

> Easily compose images together without messing around with canvas

[![Build Status](https://travis-ci.org/lukechilds/merge-images.svg?branch=master)](https://travis-ci.org/lukechilds/merge-images)
[![Coverage Status](https://coveralls.io/repos/github/lukechilds/merge-images/badge.svg?branch=master)](https://coveralls.io/github/lukechilds/merge-images?branch=master)
[![npm](https://img.shields.io/npm/dm/merge-images.svg)](https://www.npmjs.com/package/merge-images)
[![npm](https://img.shields.io/npm/v/merge-images.svg)](https://www.npmjs.com/package/merge-images)

Canvas can be kind of a pain to work with sometimes, especially if you just need a canvas context to do something relatively simple like merge some images together. `merge-images` abstracts away all the repetitive tasks into one simple function call.

Images can be overlaid on top of each other and repositioned. The function returns a Promise which resolves to a base64 data URI. Supports both the browser and Node.js.

## Install

```shell
npm install --save merge-images
```

or for quick testing:

```html
<script src="https://unpkg.com/merge-images"></script>
```

## Usage

With the following images:

`/body.png`|`/eyes.png`|`/mouth.png`
---|---|---
<img src="/test/fixtures/body.png" width="128">|<img src="/test/fixtures/eyes.png" width="128">|<img src="/test/fixtures/mouth.png" width="128">

You can do:

```js
import mergeImages from 'merge-images';

mergeImages(['/body.png', '/eyes.png', '/mouth.png'])
  .then(b64 => document.querySelector('img').src = b64);
  // data:image/png;base64,iVBORw0KGgoAA...
```

And that would update the `img` element to show this image:

<img src="/test/fixtures/face.png" width="128">

### Positioning

Those source png images were already the right dimensions to be overlaid on top of each other. You can also supply an array of objects with x/y co-ords to manually position each image:

```js
mergeImages([
  { src: 'body.png', x: 0, y: 0 },
  { src: 'eyes.png', x: 32, y: 0 },
  { src: 'mouth.png', x: 16, y: 0 }
])
  .then(b64 => ...);
  // data:image/png;base64,iVBORw0KGgoAA...
```

Using the same source images as above would output this:

<img src="/test/fixtures/face-custom-positions.png" width="128">

### Opacity

The opacity can also be tweaked on each image.

```js
mergeImages([
  { src: 'body.png' },
  { src: 'eyes.png', opacity: 0.7 },
  { src: 'mouth.png', opacity: 0.3 }
])
  .then(b64 => ...);
  // data:image/png;base64,iVBORw0KGgoAA...
```

<img src="/test/fixtures/face-opacity.png" width="128">

### Dimensions

By default the new image dimensions will be set to the width of the widest source image and the height of the tallest source image. You can manually specify your own dimensions in the options object:

```js
mergeImages(['/body.png', '/eyes.png', '/mouth.png'], {
  width: 128,
  height: 128
})
  .then(b64 => ...);
  // data:image/png;base64,iVBORw0KGgoAA...
```

Which will look like this:

<img src="/test/fixtures/face-custom-dimension.png" width="64">

## Node.js Usage

Usage in Node.js is the same, however you'll need to also require [node-canvas](https://github.com/Automattic/node-canvas) and pass it in via the options object.

```js
const mergeImages = require('merge-images');
const Canvas = require('canvas');

mergeImages(['./body.png', './eyes.png', './mouth.png'], {
  Canvas: Canvas
})
  .then(b64 => ...);
  // data:image/png;base64,iVBORw0KGgoAA...
```

One thing to note is that you need to provide a valid image source for the node-canvas `Image` rather than a DOM `Image`. Notice the above example uses a file path, not a relative URL like the other examples. Check the [node-canvas docs](https://github.com/Automattic/node-canvas) for more information on valid `Image` sources.

## API

### mergeImages(images, [options])

Returns a Promise which resolves to a base64 data URI

#### images

Type: `array`<br>
Default: `[]`

Array of valid image sources for `new Image()`.<br>
Alternatively an [array of objects](#positioning) with `x`/`y` co-ords and `src` property with a valid image source.

#### options

Type: `object`

##### options.format

Type: `string`<br>
Default: `'image/png'`

A DOMString indicating the image format.

##### options.quality

Type: `number`<br>
Default: `0.92`

A number between 0 and 1 indicating image quality if the requested format is image/jpeg or image/webp.

##### options.width

Type: `number`<br>
Default: `undefined`

The width in pixels the rendered image should be. Defaults to the width of the widest source image.

##### options.height

Type: `number`<br>
Default: `undefined`

The height in pixels the rendered image should be. Defaults to the height of the tallest source image.

##### options.Canvas

Type: `Canvas`<br>
Default: `undefined`

Canvas implementation to be used to allow usage outside of the browser. e.g Node.js with node-canvas.

## License

MIT © Luke Childs
