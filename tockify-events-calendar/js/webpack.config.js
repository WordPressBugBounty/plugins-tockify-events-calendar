// webpack.config.js
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {DuplicatesPlugin} = require('inspectpack/plugin')
const TerserPlugin = require("terser-webpack-plugin");


const isProductionMode = process.env.NODE_ENV === 'production';

const productionPlugins = [
    new BundleAnalyzerPlugin({analyzerPort:8889})
];

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

module.exports = {
  mode: isProductionMode ? 'production' : 'development',
  plugins: isProductionMode ? productionPlugins : developmentPlugins,
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
          'style-loader',
          'css-loader',
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader', // creates style nodes from JS strings
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
};
