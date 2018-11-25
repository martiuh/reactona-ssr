const path = require('path')
const webpack = require('webpack')
const slash = require('slash')
const WriteFilePlugin =  require('write-file-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const webpackMerge = require('webpack-merge')
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin')
const { InjectManifest } = require('workbox-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const base = require('./webpack.base')
const mode = process.env.NODE_ENV || 'development'
const isDev = mode === 'development'

const webpackConfig = {
  mode,
  devtool: isDev ? 'inline-source-map' : 'source-map',
  name: 'client',
  context: __dirname,
  entry: [
      slash(path.join(__dirname, 'src')),
  ],
  output: {
    path: path.resolve(__dirname, '_client'),
    publicPath: '/static/',
  },
  plugins: [
    new HtmlPlugin({
      template: `!!raw-loader!${path.join(__dirname, 'server/template.ejs')}`,
      filename: 'render.ejs',
      chunks: []
    }),
    new WriteFilePlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      IS_SERVER: JSON.stringify(false),
      'process.env': {
        NODE_ENV: JSON.stringify(mode || 'development')
      }
    })
  ]
}

  if (isDev) {
    webpackConfig.entry.push(`webpack-hot-middleware/client?__webpack_hmr&reload=true&overlay=false`)
  }
  else {
    webpackConfig.plugins.push(new InjectManifest({
      swDest: 'unstatic/serviceWorker.js', // It helps me get the worker in / instead of /static directory
      swSrc: path.join(__dirname, 'src', 'serviceWorker.js'),
      include: [
        /vendor.*/,
        /bootstrap.*/,
        /main.*/,
        /Home.*/,
        /App.*/,
        /logo\.*/,
        /Offline.*/,
        /\**\/*.ico/
      ]
    }))

    webpackConfig.optimization = {
      runtimeChunk: {
        name: 'bootstrap'
      },
      splitChunks: {
        chunks: 'initial',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor'
          }
        }
      },
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: {
              comments: false,
              ascii_only: true
            },
            compress: {
              comparisons: false
            }
          }
        })
      ]
    }
  }

module.exports = webpackMerge(base, webpackConfig);
