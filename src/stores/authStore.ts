import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('repoj_token'))
  const user = ref<AuthUser | null>(
    localStorage.getItem('repoj_user')
      ? JSON.parse(localStorage.getItem('repoj_user') as string)
      : { id: 1, name: 'Administrador REPOJ', email: 'admin@repoj.gov.co', role: 'Superadmin' }
  )

  const isAuthenticated = computed(() => !!token.value || !!user.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('repoj_token', newToken)
  }

  const setUser = (newUser: AuthUser) => {
    user.value = newUser
    localStorage.setItem('repoj_user', JSON.stringify(newUser))
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('repoj_token')
    localStorage.removeItem('repoj_user')
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout
  }
})
