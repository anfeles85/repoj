import type { User } from './User'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
  message?: string
}

export interface RegisterInstructorPayload {
  fullname: string
  email: string
  password: string
  password_confirmation?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordResponse {
  message: string
  token?: string
}
