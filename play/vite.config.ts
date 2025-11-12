import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { CobyteViteUiResolver, NaiveUiResolver } from 'cobyte-vite-ui/dist/utils'
import AutoComponents from 'unplugin-vue-components/vite';
import pkg from './package.json';
const dependencies = Object.keys(pkg.dependencies);

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), AutoComponents({
    include: [
      /\.vue$/,
      /\.mjs$/
    ],
    resolvers: [CobyteViteUiResolver(), NaiveUiResolver()]
  })],
  optimizeDeps: {
    include: [...dependencies]
  }
})
