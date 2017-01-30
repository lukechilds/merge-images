// Return Promise
const imageMerge = (sources = [], options = {}) => new Promise(resolve => {
	// Load sources
	const images = sources.map(source => new Promise(resolve => {
		// Convert strings to objects
		if (typeof source === 'string') {
			source = {src: source};
		}

		// Resolve source and img when loaded
		const img = new Image();
		img.onload = () => resolve(Object.assign({}, source, {img}));
		img.src = source.src;
	}));

	// Create canvas
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	// When sources have loaded
	Promise.all(images)
		.then(images => {
			// Set canvas dimensions
			canvas.width = options.width || Math.max(...images.map(image => image.img.width));
			canvas.height = options.height || Math.max(...images.map(image => image.img.height));

			// Draw images to canvas
			images.forEach(image => ctx.drawImage(image.img, image.x || 0, image.y || 0));

			// Resolve data uri
			resolve(canvas.toDataURL());
		});
});

module.exports = imageMerge;
