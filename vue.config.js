const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/legeclodb/' : '/',
  transpileDependencies: true,
  outputDir: 'dist',
  assetsDir: './',
  publicPath: './',
})
