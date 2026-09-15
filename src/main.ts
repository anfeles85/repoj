import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'

// Importación de estilos y scripts de Bootstrap 5
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Importación de Font Awesome Free
import '@fortawesome/fontawesome-free/css/all.min.css'

// Estilos globales de REPOJ (estilo SB Admin 2 y personalizaciones)
import '@/assets/css/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')
