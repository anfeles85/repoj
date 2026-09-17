import bcrypt from 'bcryptjs'
import supabase from './supabaseClient'
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserStatus
} from '@/interfaces/User'
import type { ApiError } from '@/interfaces/ApiResponse'

/**
 * Servicio centralizado para el módulo de Gestión de Usuarios en REPOJ conectado a Supabase
 */
export const userService = {
  /**
   * Obtener todos los usuarios del sistema desde la tabla 'users' de Supabase
   */
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, fullname, email, role, status')
      .order('id', { ascending: true })

    if (error) {
      throw {
        status: 500,
        message: 'Error al consultar los usuarios en Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return (data || []) as User[]
  },

  /**
   * Obtener un usuario específico por su ID
   */
  async getUserById(id: number): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('id, fullname, email, role, status')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw {
        status: 404,
        message: `Usuario con ID ${id} no encontrado.`,
        errors: [error?.message || 'Usuario no encontrado'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as User
  },

  /**
   * Crear usuario Instructor o Coordinador (El sistema no permite crear Administradores)
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    // 1. Validar restricción de rol administrador
    if ((payload.role as string) === 'ADMINISTRADOR') {
      throw {
        status: 422,
        message: 'No está permitido crear usuarios con rol Administrador.',
        errors: ['No se puede asignar el rol de Administrador.'],
        fieldErrors: { role: ['No está permitido crear administradores.'] },
        isNetworkError: false
      } as ApiError
    }

    const email = payload.email.trim().toLowerCase()

    // 2. Validar que el correo no esté ya registrado
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      throw {
        status: 422,
        message: `El correo electrónico ${email} ya se encuentra registrado.`,
        errors: ['Correo duplicado.'],
        fieldErrors: { email: ['Este correo electrónico ya está registrado.'] },
        isNetworkError: false
      } as ApiError
    }

    // 3. Hashear la contraseña con bcrypt
    const hashedPassword = bcrypt.hashSync(payload.password, 10)

    // 4. Insertar en Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        fullname: payload.fullname.trim(),
        email,
        role: payload.role,
        password: hashedPassword,
        status: payload.status || 'ACTIVO'
      })
      .select('id, fullname, email, role, status')
      .single()

    if (error || !data) {
      throw {
        status: 500,
        message: 'Error al registrar el usuario en Supabase: ' + (error?.message || ''),
        errors: [error?.message || 'Error desconocido'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as User
  },

  /**
   * Actualizar información de un usuario
   */
  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    // 1. Obtener datos actuales del usuario
    const currentUser = await this.getUserById(id)

    // 2. Proteger al Administrador de cambios de rol o desactivación
    if (currentUser.role === 'ADMINISTRADOR') {
      if (payload.role) {
        throw {
          status: 422,
          message: 'No está permitido modificar el rol del Administrador.',
          errors: ['El rol del administrador es inmutable.'],
          fieldErrors: { role: ['No puede cambiar el rol del Administrador.'] },
          isNetworkError: false
        } as ApiError
      }
      if (payload.status === 'INACTIVO') {
        throw {
          status: 422,
          message: 'El Administrador del sistema no puede ser desactivado.',
          errors: ['El administrador debe permanecer activo.'],
          fieldErrors: { status: ['El administrador no puede ser desactivado.'] },
          isNetworkError: false
        } as ApiError
      }
    }

    // 3. Si se cambia el email, verificar que no esté en uso por otro usuario
    if (payload.email) {
      const email = payload.email.trim().toLowerCase()
      if (email !== currentUser.email.toLowerCase()) {
        const { data: duplicate } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .maybeSingle()

        if (duplicate) {
          throw {
            status: 422,
            message: `El correo electrónico ${email} ya está en uso por otro usuario.`,
            errors: ['Correo ya utilizado.'],
            fieldErrors: { email: ['Correo en uso por otra cuenta.'] },
            isNetworkError: false
          } as ApiError
        }
      }
    }

    // 4. Construir objeto a actualizar
    const updateData: Record<string, unknown> = {}
    if (payload.fullname !== undefined) updateData.fullname = payload.fullname.trim()
    if (payload.email !== undefined) updateData.email = payload.email.trim().toLowerCase()
    if (payload.role !== undefined && currentUser.role !== 'ADMINISTRADOR') {
      updateData.role = payload.role
    }
    if (payload.status !== undefined && currentUser.role !== 'ADMINISTRADOR') {
      updateData.status = payload.status
    }
    if (payload.password && payload.password.trim().length > 0) {
      updateData.password = bcrypt.hashSync(payload.password, 10)
    }

    // 5. Ejecutar actualización en Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, fullname, email, role, status')
      .single()

    if (error || !data) {
      throw {
        status: 500,
        message: 'Error al actualizar el usuario en Supabase: ' + (error?.message || ''),
        errors: [error?.message || 'Error al actualizar'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as User
  },

  /**
   * Cambiar estado activo/inactivo (El administrador no puede ser desactivado)
   */
  async toggleUserStatus(id: number, targetStatus?: UserStatus): Promise<User> {
    const currentUser = await this.getUserById(id)

    if (currentUser.role === 'ADMINISTRADOR') {
      throw {
        status: 403,
        message: 'El Administrador del sistema no puede ser desactivado.',
        errors: ['Operación no permitida sobre la cuenta de Administrador.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    const nextStatus: UserStatus =
      targetStatus || (currentUser.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')

    const { data, error } = await supabase
      .from('users')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('id, fullname, email, role, status')
      .single()

    if (error || !data) {
      throw {
        status: 500,
        message: 'Error al cambiar estado del usuario: ' + (error?.message || ''),
        errors: [error?.message || 'Error de actualización'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as User
  },

  /**
   * Eliminar usuario (El administrador no puede ser eliminado)
   */
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const currentUser = await this.getUserById(id)

    if (currentUser.role === 'ADMINISTRADOR') {
      throw {
        status: 403,
        message: 'El Administrador del sistema no puede ser eliminado.',
        errors: ['Operación no permitida sobre la cuenta de Administrador.'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw {
        status: 500,
        message: 'Error al eliminar el usuario en Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return { success: true, message: 'Usuario eliminado con éxito de Supabase.' }
  }
}

export default userService
