import bcrypt from 'bcryptjs'
import supabase from './supabaseClient'
import type {
  LoginCredentials,
  AuthResponse,
  RegisterInstructorPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload
} from '@/interfaces/Auth'
import type { User } from '@/interfaces/User'
import type { ApiError } from '@/interfaces/ApiResponse'

/**
 * Servicio centralizado para operaciones de Autenticación en REPOJ conectado a Supabase
 */
export const authService = {
  /**
   * Iniciar sesión en el sistema validando contra Supabase.
   * Regla de negocio: Solo los usuarios con estado ACTIVO pueden iniciar sesión.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const email = credentials.email.trim().toLowerCase()

    // 1. Consultar usuario por email
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      throw {
        status: 500,
        message: 'Error al conectar con la base de datos Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    if (!userRecord) {
      throw {
        status: 401,
        message: 'Credenciales inválidas. Verifique su correo y contraseña.',
        errors: ['Correo o contraseña incorrectos.'],
        fieldErrors: {
          email: ['Credenciales inválidas.'],
          password: ['Credenciales inválidas.']
        },
        isNetworkError: false
      } as ApiError
    }

    // 2. Validar contraseña cifrada con bcrypt
    const passwordMatch = bcrypt.compareSync(credentials.password, userRecord.password || '')
    if (!passwordMatch) {
      throw {
        status: 401,
        message: 'Credenciales inválidas. Verifique su correo y contraseña.',
        errors: ['Correo o contraseña incorrectos.'],
        fieldErrors: {
          email: ['Credenciales inválidas.'],
          password: ['Credenciales inválidas.']
        },
        isNetworkError: false
      } as ApiError
    }

    // 3. Regla obligatoria: Solo usuarios con estado ACTIVO pueden ingresar
    if (userRecord.status !== 'ACTIVO') {
      throw {
        status: 403,
        message: 'Su usuario se encuentra inactivo. Comuníquese con el Administrador del sistema.',
        errors: ['Usuario inactivo en el sistema.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    // 4. Preparar respuesta segura sin contraseña
    const safeUser: User = {
      id: userRecord.id,
      fullname: userRecord.fullname,
      email: userRecord.email,
      role: userRecord.role,
      status: userRecord.status
    }

    const token = `repoj-jwt-${userRecord.id}-${Date.now()}`

    return {
      token,
      user: safeUser,
      message: 'Inicio de sesión exitoso.'
    }
  },

  /**
   * Registro exclusivo para usuarios instructores
   */
  async registerInstructor(payload: RegisterInstructorPayload): Promise<AuthResponse> {
    const email = payload.email.trim().toLowerCase()

    // 1. Validar que no exista un usuario con ese correo
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      throw {
        status: 422,
        message: `El correo electrónico ${email} ya se encuentra registrado en el sistema.`,
        errors: ['El correo electrónico ya existe.'],
        fieldErrors: { email: ['Este correo electrónico ya está registrado.'] },
        isNetworkError: false
      } as ApiError
    }

    // 2. Hashear contraseña con bcrypt
    const hashedPassword = bcrypt.hashSync(payload.password, 10)

    // 3. Insertar instructor en Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        fullname: payload.fullname.trim(),
        email,
        role: 'INSTRUCTOR',
        password: hashedPassword,
        status: 'ACTIVO'
      })
      .select('id, fullname, email, role, status')
      .single()

    if (error || !newUser) {
      throw {
        status: 500,
        message: 'Error al registrar el instructor en Supabase: ' + (error?.message || ''),
        errors: [error?.message || 'Error desconocido'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    const safeUser: User = {
      id: newUser.id,
      fullname: newUser.fullname,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status
    }

    const token = `repoj-jwt-${newUser.id}-${Date.now()}`

    return {
      token,
      user: safeUser,
      message: 'Registro de instructor completado con éxito.'
    }
  },

  /**
   * Solicitar restablecimiento de contraseña
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    const email = payload.email.trim().toLowerCase()

    const { data: userRecord } = await supabase
      .from('users')
      .select('id, fullname')
      .eq('email', email)
      .maybeSingle()

    if (!userRecord) {
      throw {
        status: 404,
        message: 'No existe ninguna cuenta registrada con el correo ingresado.',
        errors: ['Correo no registrado en el sistema.'],
        fieldErrors: { email: ['Correo no registrado.'] },
        isNetworkError: false
      } as ApiError
    }

    return {
      message: `Se ha verificado la cuenta de ${userRecord.fullname}. Ingrese su nueva contraseña a continuación.`,
      token: `recovery-token-${userRecord.id}-${Date.now()}`
    }
  },

  /**
   * Restablecer contraseña en Supabase
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const email = payload.email.trim().toLowerCase()

    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!userRecord) {
      throw {
        status: 404,
        message: 'No se encontró la cuenta para restablecer la contraseña.',
        errors: ['Usuario no encontrado.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    const hashedPassword = bcrypt.hashSync(payload.password, 10)

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userRecord.id)

    if (error) {
      throw {
        status: 500,
        message: 'Error al actualizar la contraseña en Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return {
      message: 'Su contraseña ha sido restablecida exitosamente. Ya puede iniciar sesión.'
    }
  },

  /**
   * Cerrar sesión en el sistema
   */
  async logout(): Promise<void> {
    // Supabase REST sin estado de sesión de servidor
    return Promise.resolve()
  }
}

export default authService
