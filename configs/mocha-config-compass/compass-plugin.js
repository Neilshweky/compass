const path = require('path');

module.exports = {
  ...require('./react'),
  // electron-mocha config options (ignored when run with just mocha)
  // https://github.com/jprichardson/electron-mocha
  renderer: true,
  windowConfig: path.resolve(__dirname, 'window-config.json'),
};
