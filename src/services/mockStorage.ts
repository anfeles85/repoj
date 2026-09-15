import type { Causal, CausalPayload } from '@/interfaces/Causal'

const STORAGE_KEY = 'repoj_causales_data'

const INITIAL_CAUSALES: Causal[] = [
  {
    id: 1,
    description: 'Reparación contador',
    created_at: '2026-01-15 08:30:00',
    updated_at: '2026-01-15 08:30:00'
  },
  {
    id: 2,
    description: 'Cambio de acometida eléctrica',
    created_at: '2026-02-10 11:15:00',
    updated_at: '2026-02-10 11:15:00'
  },
  {
    id: 3,
    description: 'Revisión técnica de medidor',
    created_at: '2026-03-01 14:00:00',
    updated_at: '2026-03-01 14:00:00'
  },
  {
    id: 4,
    description: 'Detección de conexión no autorizada',
    created_at: '2026-04-12 09:45:00',
    updated_at: '2026-04-12 09:45:00'
  },
  {
    id: 5,
    description: 'Suspensión temporal de servicio',
    created_at: '2026-05-20 16:20:00',
    updated_at: '2026-05-20 16:20:00'
  }
]

export const mockStorage = {
  getAll(): Causal[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAUSALES))
      return [...INITIAL_CAUSALES]
    }
    try {
      return JSON.parse(raw) as Causal[]
    } catch {
      return [...INITIAL_CAUSALES]
    }
  },

  getById(id: number): Causal | undefined {
    const list = this.getAll()
    return list.find((c) => c.id === id)
  },

  create(payload: CausalPayload): Causal {
    const list = this.getAll()
    const nextId = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newCausal: Causal = {
      id: nextId,
      description: payload.description,
      created_at: now,
      updated_at: now
    }
    list.unshift(newCausal)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return newCausal
  },

  update(id: number, payload: CausalPayload): Causal {
    const list = this.getAll()
    const index = list.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error(`Causal con ID ${id} no encontrada`)
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    list[index] = {
      ...list[index],
      description: payload.description,
      updated_at: now
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return list[index]
  },

  delete(id: number): boolean {
    const list = this.getAll()
    const filtered = list.filter((c) => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }
}
