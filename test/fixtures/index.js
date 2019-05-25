const fs = require('fs');
const pify = require('pify');
const Datauri = require('datauri');

const fixtures = {
	getImage: image => pify(fs.readFile)(`${__dirname}/${image}`),
	getDataURI: image => {
		const datauri = new Datauri();
		const ext = image.substring(image.lastIndexOf('.'));
		return pify(fs.readFile)(`${__dirname}/${image}`)
			.then(buffer => datauri.format(ext, buffer).content);
	}
};

module.exports = fixtures;
