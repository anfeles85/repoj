import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const routes: RouteRecordRaw[] = [
  // Rutas de Autenticación (Públicas / Sólo Invitados)
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: {
          title: 'Iniciar Sesión',
          guestOnly: true
        }
      },
      {
        path: '/registro',
        name: 'register',
        component: () => import('@/views/auth/RegisterInstructorView.vue'),
        meta: {
          title: 'Registro de Instructor',
          guestOnly: true
        }
      },
      {
        path: '/recuperar-contrasena',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: {
          title: 'Recuperar Contraseña',
          guestOnly: true
        }
      }
    ]
  },

  // Rutas del Sistema Principal (Protegidas)
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
          requiresAuth: true
        }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosView.vue'),
        meta: {
          title: 'Gestión de Usuarios',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'grupos',
        name: 'grupos',
        component: () => import('@/views/GruposView.vue'),
        meta: {
          title: 'Gestión de Grupos',
          requiresAuth: true
        }
      },
      {
        path: 'analisis-juicios',
        name: 'analisis-juicios',
        component: () => import('@/views/AnalisisJuiciosView.vue'),
        meta: {
          title: 'Análisis de Juicios Evaluativos',
          requiresAuth: true
        }
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/views/PerfilView.vue'),
        meta: {
          title: 'Mi Perfil',
          requiresAuth: true
        }
      }
    ]
  },

  // Ruta 404
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
  // Actualizar título dinámico del navegador
  const appName = import.meta.env.VITE_APP_TITLE || 'REPOJ'
  const pageTitle = to.meta.title ? `${to.meta.title} | ${appName}` : appName
  document.title = String(pageTitle)

  const authStore = useAuthStore()

  // 1. Si la ruta es sólo para invitados (login, registro, recuperación) y ya está autenticado
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // 2. Si la ruta requiere autenticación y el usuario NO está autenticado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const notificationStore = useNotificationStore()
    notificationStore.addNotification(
      'Debe iniciar sesión para acceder al módulo solicitado.',
      'warning',
      'Acceso Restringido'
    )
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 3. Si la ruta requiere privilegios de Administrador y el usuario no lo es
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    const notificationStore = useNotificationStore()
    notificationStore.addNotification(
      'No tiene permisos de administrador para acceder a este módulo.',
      'danger',
      'Permiso Denegado'
    )
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
