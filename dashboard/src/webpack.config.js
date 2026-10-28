// webpack.config.js

const path = require('/home/ananas/Desktop/Clone/18.10.2023_W4/react-admin-dashboard/node_modules/'); // Import path module if not already imported

module.exports = {
  // ...other webpack configuration options...

  resolve: {
    fallback: {
      "http": require.resolve("http-browserify"),
      "https": require.resolve("https-browserify"),
      "assert": require.resolve("assert"),
      "stream": require.resolve("stream"),
      "zlib": require.resolve("browserify-zlib"),
      "micro-ftch": requite.solve("micro-ftch"),
      "path": require.resolve("path-browserify"),
      "util": require.resolve("util/"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false,
      "tls": false,
      "net": false,
      "https": false
    },
  },

  // ...other webpack configuration options...
};
