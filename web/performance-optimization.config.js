/**
 * Yamshat Performance Optimization Configuration
 * تحسين الأداء والـ Bundle Optimization
 * Version 2.0.0
 */

// ============ Webpack Configuration for Performance ============

module.exports = {
  // ============ Code Splitting Strategy ============
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // React and core libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendors',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Communication libraries
        communication: {
          test: /[\\/]node_modules[\\/](socket\.io|webrtc|peerjs)[\\/]/,
          name: 'communication',
          priority: 15,
          reuseExistingChunk: true,
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](antd|material-ui|bootstrap)[\\/]/,
          name: 'ui-libs',
          priority: 12,
          reuseExistingChunk: true,
        },
        // Common code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
    runtimeChunk: 'single',
    minimize: true,
    minimizer: [
      // Terser for JS minification
      {
        test: /\.js(\?.*)?$/i,
        compress: {
          drop_console: true,
          pure_funcs: ['console.log'],
          passes: 2,
        },
        output: {
          comments: false,
        },
      },
      // CSS minification
      {
        test: /\.css$/i,
      },
    ],
  },

  // ============ Module Rules for Optimization ============
  module: {
    rules: [
      // JavaScript/TypeScript
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3,
              }],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties',
              ['@babel/plugin-transform-runtime', {
                corejs: 3,
              }],
            ],
          },
        },
      },

      // Image Optimization
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]',
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
            },
          },
        ],
      },

      // WebP Conversion
      {
        test: /\.(png|jpg|jpeg)$/i,
        use: [
          {
            loader: 'webp-loader',
            options: {
              quality: 75,
            },
          },
        ],
      },

      // AVIF Support
      {
        test: /\.(png|jpg|jpeg)$/i,
        use: [
          {
            loader: 'avif-loader',
            options: {
              quality: 70,
            },
          },
        ],
      },

      // CSS/SCSS
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                  ['cssnano', {
                    preset: ['default', {
                      discardComments: {
                        removeAll: true,
                      },
                    }],
                  }],
                ],
              },
            },
          },
          'sass-loader',
        ],
      },

      // Font files
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },

  // ============ Plugins for Performance ============
  plugins: [
    // Tree shaking configuration
    {
      sideEffects: false,
    },

    // Bundle analysis
    {
      test: /\.js$/,
      use: {
        loader: 'webpack-bundle-analyzer',
        options: {
          analyzerMode: 'static',
          generateStatsFile: true,
          openAnalyzer: false,
        },
      },
    },

    // Compression
    {
      test: /\.(js|css|html|svg)$/,
      use: {
        loader: 'compression-webpack-plugin',
        options: {
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        },
      },
    },

    // Brotli compression
    {
      test: /\.(js|css|html|svg)$/,
      use: {
        loader: 'compression-webpack-plugin',
        options: {
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        },
      },
    },
  ],

  // ============ Performance Budgets ============
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },

  // ============ Caching Strategy ============
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    path: '/dist',
    clean: true,
  },

  // ============ Development vs Production ============
  mode: process.env.NODE_ENV || 'production',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
};

// ============ Vite Configuration for Performance ============

export const viteConfig = {
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendors': ['react', 'react-dom', 'react-router-dom'],
          'communication': ['socket.io-client', 'webrtc', 'peerjs'],
          'ui': ['antd', '@mui/material'],
        },
      },
    },

    // Optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        pure_funcs: ['console.log'],
      },
    },

    // Source maps
    sourcemap: false,

    // CSS code splitting
    cssCodeSplit: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // Report compressed size
    reportCompressedSize: true,
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'socket.io-client',
      'antd',
    ],
  },
};

// ============ Lazy Loading Routes ============

export const lazyRoutes = {
  // Main routes
  Home: () => import(/* webpackChunkName: "home" */ '../pages/Home'),
  Profile: () => import(/* webpackChunkName: "profile" */ '../pages/Profile'),
  Messages: () => import(/* webpackChunkName: "messages" */ '../pages/Messages'),

  // Call routes
  Calls: () => import(/* webpackChunkName: "calls" */ '../pages/Calls'),
  CallDetail: () => import(/* webpackChunkName: "call-detail" */ '../pages/CallDetail'),

  // Live routes
  Live: () => import(/* webpackChunkName: "live" */ '../pages/Live'),
  LiveDetail: () => import(/* webpackChunkName: "live-detail" */ '../pages/LiveDetail'),

  // Group routes
  Groups: () => import(/* webpackChunkName: "groups" */ '../pages/Groups'),
  GroupDetail: () => import(/* webpackChunkName: "group-detail" */ '../pages/GroupDetail'),

  // Reels routes
  Reels: () => import(/* webpackChunkName: "reels" */ '../pages/Reels'),
  ReelDetail: () => import(/* webpackChunkName: "reel-detail" */ '../pages/ReelDetail'),

  // Admin routes
  Admin: () => import(/* webpackChunkName: "admin" */ '../pages/Admin'),
  AdminDashboard: () => import(/* webpackChunkName: "admin-dashboard" */ '../pages/AdminDashboard'),
};

// ============ Prefetching and Preloading ============

export const prefetchConfig = {
  // Prefetch routes
  prefetchRoutes: [
    'Home',
    'Profile',
    'Messages',
  ],

  // Preload critical resources
  preloadResources: [
    {
      href: '/fonts/main.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: true,
    },
    {
      href: '/css/main.css',
      as: 'style',
    },
  ],

  // DNS prefetch
  dnsPrefetch: [
    'https://api.yamshat.com',
    'https://cdn.yamshat.com',
    'https://analytics.yamshat.com',
  ],

  // Preconnect
  preconnect: [
    {
      href: 'https://api.yamshat.com',
      crossorigin: true,
    },
    {
      href: 'https://cdn.yamshat.com',
      crossorigin: true,
    },
  ],
};

// ============ Caching Strategy ============

export const cachingStrategy = {
  // HTTP caching headers
  headers: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': true,
    'Last-Modified': true,
  },

  // Service worker caching
  serviceWorkerCache: {
    version: 'v1',
    cacheName: 'yamshat-v1',
    cacheUrls: [
      '/',
      '/index.html',
      '/manifest.json',
      '/css/main.css',
      '/js/main.js',
    ],
    networkFirst: [
      '/api/',
    ],
    cacheFirst: [
      '/images/',
      '/fonts/',
      '/css/',
      '/js/',
    ],
  },

  // CDN configuration
  cdn: {
    enabled: true,
    url: 'https://cdn.yamshat.com',
    paths: {
      images: '/images/',
      fonts: '/fonts/',
      css: '/css/',
      js: '/js/',
    },
  },
};

// ============ Memory Optimization ============

export const memoryOptimization = {
  // Virtual scrolling
  virtualScroll: {
    enabled: true,
    itemHeight: 50,
    bufferSize: 5,
  },

  // Image lazy loading
  imageLazyLoad: {
    enabled: true,
    threshold: 0.1,
    rootMargin: '50px',
  },

  // Debounce/Throttle
  debounce: {
    search: 300,
    resize: 250,
    scroll: 200,
  },

  throttle: {
    mousemove: 100,
    scroll: 150,
  },

  // Memory pooling
  memoryPool: {
    enabled: true,
    poolSize: 100,
  },
};

// ============ API Batching and Deduplication ============

export const apiOptimization = {
  // Request batching
  batching: {
    enabled: true,
    batchSize: 10,
    batchDelay: 50,
  },

  // Request deduplication
  deduplication: {
    enabled: true,
    timeout: 5000,
  },

  // Request compression
  compression: {
    enabled: true,
    algorithm: 'gzip',
  },

  // Response caching
  caching: {
    enabled: true,
    ttl: 3600,
  },
};

export default {
  lazyRoutes,
  prefetchConfig,
  cachingStrategy,
  memoryOptimization,
  apiOptimization,
};
