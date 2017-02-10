const pify = require('pify');
const fs = require('fs');

module.exports = fixtures = {
  getImage: image => pify(fs.readFile)(`${__dirname}/${image}`)
}
