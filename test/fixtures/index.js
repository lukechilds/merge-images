const pify = require('pify');
const fs = require('fs');

module.exports = fixtures = {
  images: {
    body: 'body.png',
    eyes: 'eyes.png',
    mouth: 'mouth.png'
  },
  getImage: image => pify(fs.readFile)(`${__dirname}/${fixtures.images[image]}`)
}
