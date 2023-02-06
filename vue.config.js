const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: '/',
  transpileDependencies: true,
  outputDir: 'docs',
  assetsDir: './',
  publicPath: './',
  devServer: {
    historyApiFallback: true
  },
})
