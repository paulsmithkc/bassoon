const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
  const package = JSON.parse(fs.readFileSync('./package.json'));
  const banner = `@version ${package.name} ${package.version}`;
  const minimize = env ? env.minimize : false;
  const worker = env ? env.worker : false;
  console.log(banner);

  const webpackConfig = {
    mode: 'production',
    target: worker ? 'webworker' : 'web',
    entry: worker
      ? { 'bassoon-worker': './src/bassoon-worker.js' }
      : { bassoon: './src/bassoon.mjs' },
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: minimize ? '[name].min.js' : '[name].js',
      library: worker ? undefined : 'bassoon',
      libraryTarget: worker ? undefined : 'window',
      libraryExport: 'default',
    },
    module: {
      rules: [
        {
          include: [path.resolve(__dirname, 'src/')],
          test: /\.m?js$/i,
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
