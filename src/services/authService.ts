import bcrypt from 'bcryptjs'
import supabase from './supabaseClient'
import mailService from './mailService'
import type {
  LoginCredentials,
  AuthResponse,
  RegisterInstructorPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ValidateTokenResult
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
   * Solicitar restablecimiento de contraseña:
   * Valida usuario, genera token de uso único con expiración de 1 hora y envía correo con enlace.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    const email = payload.email.trim().toLowerCase()

    // 1. Validar que el usuario exista en Supabase
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, fullname, email, status')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      throw {
        status: 500,
        message: 'Error al verificar el usuario en Supabase: ' + userError.message,
        errors: [userError.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    if (!userRecord) {
      throw {
        status: 404,
        message: 'No existe ninguna cuenta registrada con el correo ingresado.',
        errors: ['Correo no registrado en el sistema.'],
        fieldErrors: { email: ['Correo no registrado.'] },
        isNetworkError: false
      } as ApiError
    }

    if (userRecord.status !== 'ACTIVO') {
      throw {
        status: 403,
        message: 'Su usuario se encuentra inactivo. Comuníquese con el Administrador del sistema.',
        errors: ['Usuario inactivo.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    // 2. Invalidar tokens activos anteriores del mismo usuario para evitar ambigüedades
    try {
      await supabase
        .from('password_reset_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('user_id', userRecord.id)
        .eq('used', false)
    } catch {
      // Continuar si no hay tokens previos
    }

    // 3. Generar token criptográfico único y calcular expiración de 1 hora
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora de validez

    // 4. Guardar token en tabla password_reset_tokens en Supabase
    const { error: insertError } = await supabase.from('password_reset_tokens').insert({
      user_id: userRecord.id,
      email: userRecord.email,
      token,
      expires_at: expiresAt,
      used: false
    })

    if (insertError) {
      throw {
        status: 500,
        message: 'Error al registrar el token de recuperación en Supabase: ' + insertError.message,
        errors: [insertError.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    // 5. Construir enlace de recuperación con el token generado
    const origin = window.location.origin
    const resetLink = `${origin}/restablecer-contrasena?token=${token}`

    // 6. Enviar correo electrónico con la plantilla institucional y el botón/enlace
    try {
      await mailService.sendPasswordResetEmail(userRecord.email, userRecord.fullname, resetLink)
    } catch (mailErr: any) {
      console.error('[Error al enviar correo de recuperación]', mailErr)
      throw {
        status: 500,
        message:
          'El enlace fue generado, pero ocurrió un error al enviar el correo electrónico vía SMTP: ' +
          (mailErr?.response?.data?.error || mailErr?.message || 'Error de conexión SMTP'),
        errors: ['Error al enviar correo electrónico.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return {
      message: `Se ha enviado un correo electrónico con el enlace de recuperación a ${userRecord.email}. Recuerde que el enlace tiene una validez de 1 hora.`
    }
  },

  /**
   * Validar estado de un token de restablecimiento de contraseña:
   * Verifica existencia, que no haya sido utilizado y que no haya expirado (1 hora).
   */
  async validateResetToken(token: string): Promise<ValidateTokenResult> {
    if (!token || !token.trim()) {
      return {
        valid: false,
        errorType: 'NOT_FOUND',
        message: 'No se proporcionó un token de recuperación válido.'
      }
    }

    const { data: record, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token.trim())
      .maybeSingle()

    if (error || !record) {
      return {
        valid: false,
        errorType: 'NOT_FOUND',
        message: 'El enlace de recuperación es inválido o no existe en el sistema.'
      }
    }

    if (record.used) {
      return {
        valid: false,
        tokenRecord: record,
        errorType: 'USED',
        message: 'Este enlace de recuperación ya ha sido utilizado previamente.'
      }
    }

    const expiresTime = new Date(record.expires_at).getTime()
    const nowTime = Date.now()

    if (nowTime > expiresTime) {
      return {
        valid: false,
        tokenRecord: record,
        errorType: 'EXPIRED',
        message:
          'Este enlace de recuperación ha expirado. Por seguridad, los enlaces tienen una validez de 1 hora.'
      }
    }

    return {
      valid: true,
      tokenRecord: record
    }
  },

  /**
   * Restablecer contraseña en Supabase:
   * Valida uso único del token, actualiza clave en Supabase, marca token como usado y envía correo de confirmación.
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const token = payload.token.trim()

    // 1. Validar el token antes de aplicar cambios
    const tokenValidation = await this.validateResetToken(token)
    if (!tokenValidation.valid || !tokenValidation.tokenRecord) {
      throw {
        status: 400,
        message: tokenValidation.message || 'El enlace de recuperación no es válido.',
        errors: [tokenValidation.message || 'Token inválido'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    const tokenRecord = tokenValidation.tokenRecord

    // 2. Hashear la nueva contraseña con bcrypt
    const hashedPassword = bcrypt.hashSync(payload.password, 10)

    // 3. Actualizar la contraseña en la tabla users
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', tokenRecord.user_id)
      .select('id, fullname, email')
      .single()

    if (updateError || !updatedUser) {
      throw {
        status: 500,
        message: 'Error al actualizar la contraseña en Supabase: ' + (updateError?.message || ''),
        errors: [updateError?.message || 'Error desconocido'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    // 4. Marcar el token como utilizado (garantiza uso único)
    const { error: markError } = await supabase
      .from('password_reset_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', tokenRecord.id)

    if (markError) {
      console.warn('[Advertencia] No se pudo marcar el token como utilizado:', markError)
    }

    // 5. Enviar correo de notificación informando que la contraseña fue cambiada
    try {
      await mailService.sendPasswordChangedConfirmation(updatedUser.email, updatedUser.fullname)
    } catch (mailErr) {
      console.error('[Advertencia] Error al enviar correo de confirmación:', mailErr)
      // No bloqueamos el éxito del cambio de contraseña si el correo de confirmación falla
    }

    return {
      message:
        'Su contraseña ha sido restablecida exitosamente. Le hemos enviado un correo de confirmación.'
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

