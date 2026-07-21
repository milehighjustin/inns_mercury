const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectoryLocal: undefined,
  cacheDirectory: '/opt/render/project/src/.cache/puppeteer',
};