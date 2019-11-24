// Defaults
const defaultOptions = {
	format: 'image/png',
	quality: 0.92,
	width: undefined,
	height: undefined,
	Canvas: undefined
};

const createCanvas = options =>
  options.Canvas ?
    new options.Canvas() :
		window.document.createElement('canvas');

const createImage = options =>
	options.Canvas ?
		options.Canvas.Image :
		window.Image;

// Return Promise
const mergeImages = (sources = [], options = {}) => new Promise(resolve => {
	options = Object.assign({}, defaultOptions, options);

	// Setup browser/Node.js specific variables
	const canvas = createCanvas(options);
	const Image = createImage(options);
	if (options.Canvas) {
		options.quality *= 100;
	}

	// Load sources
	const images = sources.map(source => new Promise((resolve, reject) => {
		// Convert sources to objects
		if (source.constructor.name !== 'Object') {
			source = { src: source };
		}

		if (source.width && source.height) {
			const img = new Image(source.width, source.height);

			img.onerror = () => reject(new Error('Couldn\'t load image'));
			img.onload = () => {
				const { width, height } = source;
				const canvas = createCanvas(options);
				const ctx = canvas.getContext('2d');

				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				// Adjust source image width and height
				const resizeImg = new Image();
				resizeImg.onerror = () => reject(new Error('Couldn\'t load image'));
				resizeImg.onload = () => resolve(Object.assign({}, source, { img: resizeImg }));
				resizeImg.src = canvas.toDataURL();
			};
			img.src = source.src;
		} else {
      // Resolve source and img when loaded
			const img = new Image();
			img.onerror = () => reject(new Error('Couldn\'t load image'));
			img.onload = () => resolve(Object.assign({}, source, { img }));
			img.src = source.src;
		}
	}));

	// Get canvas context
	const ctx = canvas.getContext('2d');

	// When sources have loaded
	resolve(Promise.all(images)
		.then(images => {
			// Set canvas dimensions
			const getSize = dim => options[dim] || Math.max(...images.map(image => image.img[dim]));
			canvas.width = getSize('width');
			canvas.height = getSize('height');

			// Draw images to canvas
			images.forEach(image => {
				ctx.globalAlpha = image.opacity ? image.opacity : 1;
				return ctx.drawImage(image.img, image.x || 0, image.y || 0);
			});

			if (options.Canvas && options.format === 'image/jpeg') {
				// Resolve data URI for node-canvas jpeg async
				return new Promise(resolve => {
					canvas.toDataURL(options.format, {
						quality: options.quality,
						progressive: false
					}, (err, jpeg) => {
						if (err) {
							throw err;
						}
						resolve(jpeg);
					});
				});
			}

			// Resolve all other data URIs sync
			return canvas.toDataURL(options.format, options.quality);
		}));
});

export default mergeImages;
