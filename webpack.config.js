const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
  const package = JSON.parse(fs.readFileSync('./package.json'));
  const banner = `${package.name} ${package.version}`;
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
    optimization: { minimize },
    plugins: [new webpack.BannerPlugin(banner)],
  };

  return webpackConfig;
};
