import { createApp } from 'vue'
import App from './App.vue'
import CobyteViteUI from 'cobyte-vite-ui'
import 'cobyte-vite-ui/dist/style.css'

const app = createApp(App)
app.use(CobyteViteUI)
app.mount('#app')
