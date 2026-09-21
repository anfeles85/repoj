import supabase from './supabaseClient'
import type {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload
} from '@/interfaces/Group'
import type { ApiError } from '@/interfaces/ApiResponse'

/**
 * Servicio centralizado para el módulo de Gestión de Grupos en REPOJ conectado a Supabase
 */
export const groupService = {
  /**
   * Obtener todos los grupos del sistema desde la tabla 'groups' de Supabase
   */
  async getGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      throw {
        status: 500,
        message: 'Error al consultar los grupos en Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return (data || []) as Group[]
  },

  /**
   * Obtener un grupo específico por su ID
   */
  async getGroupById(id: number): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw {
        status: 404,
        message: `Grupo con ID ${id} no encontrado.`,
        errors: [error?.message || 'Grupo no encontrado'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as Group
  },

  /**
   * Crear un nuevo grupo
   */
  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const groupNumber = Number(payload.number)

    if (isNaN(groupNumber) || groupNumber <= 0) {
      throw {
        status: 422,
        message: 'El número de ficha debe ser un número entero positivo.',
        errors: ['Número de ficha inválido.'],
        fieldErrors: { number: ['Ingrese un número de ficha válido.'] },
        isNetworkError: false
      } as ApiError
    }

    // 1. Validar que no exista un grupo con el mismo número de ficha
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('number', groupNumber)
      .maybeSingle()

    if (existingGroup) {
      throw {
        status: 422,
        message: `El número de ficha ${groupNumber} ya se encuentra registrado.`,
        errors: ['Número de ficha duplicado.'],
        fieldErrors: { number: ['Este número de ficha ya existe en el sistema.'] },
        isNetworkError: false
      } as ApiError
    }

    // 2. Validar coherencia de fechas
    if (payload.initial_date && payload.final_date && payload.final_date < payload.initial_date) {
      throw {
        status: 422,
        message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
        errors: ['Rango de fechas incoherente.'],
        fieldErrors: { final_date: ['La fecha de fin debe ser posterior a la fecha de inicio.'] },
        isNetworkError: false
      } as ApiError
    }

    // 3. Insertar en Supabase
    const insertData: Record<string, unknown> = {
      number: groupNumber,
      program: payload.program.trim(),
      shift: payload.shift,
      initial_date: payload.initial_date,
      final_date: payload.final_date,
      status: payload.status || 'EN EJECUCION'
    }

    if (payload.evaluative_judgments_file !== undefined) {
      insertData.evaluative_judgments_file = payload.evaluative_judgments_file
    }
    if (payload.evaluative_judgments_file_name !== undefined) {
      insertData.evaluative_judgments_file_name = payload.evaluative_judgments_file_name
    }

    const { data, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select('*')
      .single()

    if (error || !data) {
      throw {
        status: 500,
        message: 'Error al registrar el grupo en Supabase: ' + (error?.message || ''),
        errors: [error?.message || 'Error desconocido'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as Group
  },

  /**
   * Actualizar un grupo existente
   */
  async updateGroup(id: number, payload: UpdateGroupPayload): Promise<Group> {
    const currentGroup = await this.getGroupById(id)

    // 1. Si se actualiza el número de ficha, validar unicidad
    if (payload.number !== undefined) {
      const groupNumber = Number(payload.number)
      if (isNaN(groupNumber) || groupNumber <= 0) {
        throw {
          status: 422,
          message: 'El número de ficha debe ser un número entero positivo.',
          errors: ['Número de ficha inválido.'],
          fieldErrors: { number: ['Ingrese un número de ficha válido.'] },
          isNetworkError: false
        } as ApiError
      }

      if (groupNumber !== currentGroup.number) {
        const { data: duplicate } = await supabase
          .from('groups')
          .select('id')
          .eq('number', groupNumber)
          .neq('id', id)
          .maybeSingle()

        if (duplicate) {
          throw {
            status: 422,
            message: `El número de ficha ${groupNumber} ya está registrado para otro grupo.`,
            errors: ['Número de ficha duplicado.'],
            fieldErrors: { number: ['Este número de ficha ya está en uso.'] },
            isNetworkError: false
          } as ApiError
        }
      }
    }

    // 2. Validar coherencia de fechas
    const effectiveInitial = payload.initial_date || currentGroup.initial_date
    const effectiveFinal = payload.final_date || currentGroup.final_date
    if (effectiveInitial && effectiveFinal && effectiveFinal < effectiveInitial) {
      throw {
        status: 422,
        message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
        errors: ['Rango de fechas incoherente.'],
        fieldErrors: { final_date: ['La fecha de fin debe ser posterior a la fecha de inicio.'] },
        isNetworkError: false
      } as ApiError
    }

    // 3. Preparar payload de actualización
    const updateData: Record<string, unknown> = {}
    if (payload.number !== undefined) updateData.number = Number(payload.number)
    if (payload.program !== undefined) updateData.program = payload.program.trim()
    if (payload.shift !== undefined) updateData.shift = payload.shift
    if (payload.initial_date !== undefined) updateData.initial_date = payload.initial_date
    if (payload.final_date !== undefined) updateData.final_date = payload.final_date
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.evaluative_judgments_file !== undefined) {
      updateData.evaluative_judgments_file = payload.evaluative_judgments_file
    }
    if (payload.evaluative_judgments_file_name !== undefined) {
      updateData.evaluative_judgments_file_name = payload.evaluative_judgments_file_name
    }

    // 4. Ejecutar actualización en Supabase
    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw {
        status: 500,
        message: 'Error al actualizar el grupo en Supabase: ' + (error?.message || ''),
        errors: [error?.message || 'Error al actualizar'],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return data as Group
  },

  /**
   * Eliminar un grupo
   */
  async deleteGroup(id: number): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (error) {
      throw {
        status: 500,
        message: 'Error al eliminar el grupo en Supabase: ' + error.message,
        errors: [error.message],
        fieldErrors: {},
        isNetworkError: false
      } as ApiError
    }

    return { success: true, message: 'Grupo eliminado con éxito de Supabase.' }
  },

  /**
   * Convertir un archivo File del navegador a cadena Base64 Data URL
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('No se pudo convertir el archivo a Base64'))
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  },

  /**
   * Descargar archivo de juicios evaluativos en el navegador
   */
  downloadJudgmentsFile(fileDataUrl: string, fileName: string = 'juicios_evaluativos.xls'): void {
    const link = document.createElement('a')
    link.href = fileDataUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default groupService
