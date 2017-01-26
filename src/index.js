// Return Promise
const imageMerge = (sources = []) => new Promise(resolve => {
	// Create canvas
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	// Load sources
	const images = sources.map(src => new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.src = src;
	}));

	// When sources have loaded
	Promise.all(images)
		.then(images => {
			// Draw images to canvas
			images.forEach(img => ctx.drawImage(img, 0, 0));

			// Resolve data uri
			resolve(canvas.toDataURL());
		});
});

module.exports = imageMerge;
