import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/interfaces/User'
import type { LoginCredentials, RegisterInstructorPayload } from '@/interfaces/Auth'
import authService from '@/services/authService'
import userService from '@/services/userService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('repoj_token'))
  const user = ref<User | null>(
    localStorage.getItem('repoj_user')
      ? JSON.parse(localStorage.getItem('repoj_user') as string)
      : null
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMINISTRADOR')
  const isInstructor = computed(() => user.value?.role === 'INSTRUCTOR')
  const isCoordinador = computed(() => user.value?.role === 'COORDINADOR')

  const userName = computed(() => user.value?.fullname || 'Usuario')
  const userRoleLabel = computed(() => {
    switch (user.value?.role) {
      case 'ADMINISTRADOR':
        return 'Administrador'
      case 'INSTRUCTOR':
        return 'Instructor'
      case 'COORDINADOR':
        return 'Coordinador'
      default:
        return 'Invitado'
    }
  })

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('repoj_token', newToken)
  }

  const setUser = (newUser: User) => {
    user.value = newUser
    localStorage.setItem('repoj_user', JSON.stringify(newUser))
  }

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const res = await authService.login(credentials)
    setToken(res.token)
    setUser(res.user)
    return res.user
  }

  const registerInstructor = async (payload: RegisterInstructorPayload): Promise<User> => {
    const res = await authService.registerInstructor(payload)
    setToken(res.token)
    setUser(res.user)
    return res.user
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Continuar con limpieza local ante fallo
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('repoj_token')
      localStorage.removeItem('repoj_user')
    }
  }

  const updateProfile = async (payload: {
    fullname: string
    email: string
    password?: string
  }): Promise<User> => {
    if (!user.value) {
      throw new Error('No hay una sesión activa en el sistema.')
    }
    const updatedUser = await userService.updateUser(user.value.id, payload)
    setUser(updatedUser)
    return updatedUser
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isInstructor,
    isCoordinador,
    userName,
    userRoleLabel,
    setToken,
    setUser,
    login,
    registerInstructor,
    logout,
    updateProfile
  }
})

export default useAuthStore
