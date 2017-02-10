const pify = require('pify');
const fs = require('fs');
const Datauri = require('datauri');

module.exports = fixtures = {
  getImage: image => pify(fs.readFile)(`${__dirname}/${image}`),
  getDataURI: image => {
    const datauri = new Datauri();
    const ext = image.substring(image.lastIndexOf('.'));
    return fixtures.getImage(image).then(buffer => datauri.format(ext, buffer).content);
  }
}
