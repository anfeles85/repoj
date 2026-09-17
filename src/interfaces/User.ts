export type UserRole = 'ADMINISTRADOR' | 'INSTRUCTOR' | 'COORDINADOR'

export type UserStatus = 'ACTIVO' | 'INACTIVO'

export interface User {
  id: number
  fullname: string
  email: string
  role: UserRole
  status: UserStatus
  password?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUserPayload {
  fullname: string
  email: string
  role: 'INSTRUCTOR' | 'COORDINADOR' // El sistema NO permite crear administradores
  password: string
  status?: UserStatus
}

export interface UpdateUserPayload {
  fullname?: string
  email?: string
  role?: 'INSTRUCTOR' | 'COORDINADOR'
  status?: UserStatus
  password?: string
}

export interface ToggleStatusPayload {
  status: UserStatus
}
