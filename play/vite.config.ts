import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoComponent from 'cobyte-vite-ui/dist/utils'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), AutoComponent()],
})
