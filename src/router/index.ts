import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          requiresAuth: false
        }
      },
      {
        path: 'causales',
        name: 'causales',
        component: () => import('@/views/CausalesView.vue'),
        meta: {
          title: 'Causales',
          requiresAuth: false
        }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosView.vue'),
        meta: {
          title: 'Usuarios',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Página No Encontrada'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Guardia de navegación global
router.beforeEach((to, _from, next) => {
  // Actualizar título del documento dinámicamente
  const appName = import.meta.env.VITE_APP_TITLE || 'REPOJ'
  const pageTitle = to.meta.title ? `${to.meta.title} | ${appName}` : appName
  document.title = String(pageTitle)

  // Verificación de autenticación mediante meta
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      console.warn(`[Router Guard] Acceso protegido a ${String(to.name)}. Requiere autenticación.`)
      // Si existiera vista de Login se redirigiría aquí: next({ name: 'login' })
      next()
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
