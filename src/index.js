// Return Promise
const imageMerge = (sources = []) => new Promise(resolve => {
	// Load sources
	const images = sources.map(src => new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.src = src;
	}));

	// Create canvas
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	// When sources have loaded
	Promise.all(images)
		.then(images => {
			// Set canvas dimensions
			canvas.width = Math.max(images.map(img => img.width));
			canvas.height = Math.max(images.map(img => img.height));

			// Draw images to canvas
			images.forEach(img => ctx.drawImage(img, 0, 0));

			// Resolve data uri
			resolve(canvas.toDataURL());
		});
});

module.exports = imageMerge;
