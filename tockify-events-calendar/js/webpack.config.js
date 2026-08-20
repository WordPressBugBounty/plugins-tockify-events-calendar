// webpack.config.js
const path = require('path');
const {merge} = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {DuplicatesPlugin} = require('inspectpack/plugin')
const TerserPlugin = require("terser-webpack-plugin");


const isProductionMode = process.env.NODE_ENV === 'production';

const developmentPlugins = [
    new DuplicatesPlugin({
      // Emit compilation warning or error? (Default: `false`)
      emitErrors: false,
      // Display full duplicates information? (Default: `false`)
      verbose: false
    })
];

// react is supplied by gutenberg
const wplib = [
  'blocks',
  'components',
  'date',
  'blockEditor',
  'editor',
  'element',
  'i18n',
  'utils',
  'data',
];

module.exports = (env = {}) => {

  // Static report rather than a server, so the build exits when it is done.
  // Skip it with:  pnpm build --env showAnalyser=false
  const analyser = (!isProductionMode || env.showAnalyser === 'false') ? {} : {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        // written outside tockify/, so the report is never rsynced to wordpress.org
        reportFilename: path.resolve(__dirname, '../../report.html')
      })
    ]
  }

  return merge(analyser, {
  mode: isProductionMode ? 'production' : 'development',
  plugins: [
    /*
     * Emit the block's styles as a real stylesheet instead of injecting them at runtime:
     * since WP 7.1 the editor canvas is an iframe, and runtime injection writes into the
     * outer document. blocks.php registers this file as the block's editor_style, so
     * WordPress puts it in the canvas iframe and on the outer editor page, but not on the
     * front end.
     */
    new MiniCssExtractPlugin({filename: 'tockify.blocks.css'}),
    ...(isProductionMode ? [] : developmentPlugins)
  ],
  entry: {
    embed: path.resolve(__dirname, 'src/block.jsx')
  },
  output: {
    path: path.resolve(__dirname, 'bin'),
    filename: 'tockify.blocks.js',
    library: ['wp', '[name]'],
    libraryTarget: 'window',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // extractComments: 'all',
        terserOptions: {
          compress: {
            drop_console: false, // pure_funcs keeps console.warn & console.error
            pure_funcs: [ 'console.log', 'console.info', 'console.trace' ]
          },
        },
      }),
    ],
  },
// https://www.cssigniter.com/how-to-use-external-react-components-in-your-gutenberg-blocks
  externals: wplib.reduce((externals, lib) => {
    externals[`wp.${lib}`] = {
      window: ['wp', lib],
    };
    return externals;
  }, {
    'react': 'React',
    'react-dom': 'ReactDOM',
  }),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/env'
            ],
            "plugins": [
              "@babel/plugin-proposal-class-properties"
            ]
          },
        }],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader, // extracts to bin/tockify.blocks.css
          'css-loader', // translates CSS into CommonJS
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [[
                  'postcss-preset-env',
                  {
                    browsers: ['>1%']
                  }],
                  require('cssnano')()
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass')
            }
          }, // compiles Sass to CSS, using Node Sass by default
          // {
          //   loader: 'sass-resources-loader',
          //   options: {
          //     // Provide path to the file with resources
          //     resources: 'src/app/globals.scss'
          //   },
         // },
        ]

      },
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx']
  }
  });
};
