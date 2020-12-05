const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
  const package = JSON.parse(fs.readFileSync('./package.json'));
  const banner = `@version ${package.name} ${package.version}`;
  const minimize = env ? env.minimize : false;
  console.log(banner);
  console.log(minimize);

  const webpackConfig = {
    mode: 'production',
    target: 'web',
    entry: minimize
      ? { 'bassoon.min': './src/bassoon.js' }
      : { bassoon: './src/bassoon.js' },
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: '[name].js',
      library: 'bassoon',
      libraryTarget: 'window',
      libraryExport: 'default',
    },
    module: {
      rules: [
        {
          include: [path.resolve(__dirname, 'src/')],
          test: /\.js$/i,
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] },
        },
      ],
    },
    optimization: {
      minimize,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: /@version/i,
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [new webpack.BannerPlugin({ banner, entryOnly: true })],
  };

  return webpackConfig;
};
