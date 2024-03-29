const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
  const package = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json')));
  const banner = `@version ${package.name} ${package.version}`;
  const worker = env ? env.worker : false;
  let minimize = env ? env.minimize : false;
  console.log(banner);

  if (worker) {
    minimize = true;
    fs.mkdirSync(path.resolve(__dirname, './dist'), { recursive: true });
    fs.copyFileSync(
      path.resolve(__dirname, './src/bassoon.worker.js'),
      path.resolve(__dirname, './dist/bassoon.worker.js')
    );
    fs.copyFileSync(
      path.resolve(__dirname, './src/bassoon.worker.js'),
      path.resolve(__dirname, './dist/bassoon-worker.js')
    );
  }

  const webpackConfig = {
    mode: 'production',
    target: worker ? 'webworker' : ['webworker', 'web'],
    entry: worker ? { 'bassoon-worker': './src/bassoon.worker.js' } : { bassoon: './src/bassoon.mjs' },
    output: {
      chunkLoading: false,
      wasmLoading: false,
      path: path.resolve(__dirname, 'dist/'),
      filename: minimize ? '[name].min.js' : '[name].js',
      library: worker ? undefined : 'bassoon',
      libraryTarget: worker ? undefined : 'global',
      libraryExport: 'default',
    },
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: { loader: 'worker-loader' },
        },
        {
          include: [path.resolve(__dirname, 'src/')],
          test: /\.m?js$/i,
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { loose: true }]],
            plugins: ['minify-simplify', 'minify-guarded-expressions', 'minify-mangle-names'],
          },
        },
      ],
    },
    devtool: minimize ? 'source-map' : false,
    optimization: {
      minimize: minimize,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: { comments: /@version/i },
            mangle: { module: true },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [new webpack.BannerPlugin({ banner, entryOnly: true })],
  };

  return webpackConfig;
};
