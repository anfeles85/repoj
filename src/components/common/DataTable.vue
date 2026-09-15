<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue'
import type { TableColumn } from '@/interfaces/Pagination'
import Loading from './Loading.vue'
import BaseButton from './BaseButton.vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    error?: string | null
    searchable?: boolean
    searchPlaceholder?: string
    pageSize?: number
    emptyText?: string
    showActions?: boolean
  }>(),
  {
    loading: false,
    error: null,
    searchable: true,
    searchPlaceholder: 'Buscar registros...',
    pageSize: 10,
    emptyText: 'No se encontraron registros en el sistema.',
    showActions: true
  }
)

const emit = defineEmits<{
  (e: 'edit', item: T): void
  (e: 'delete', item: T): void
  (e: 'refresh'): void
}>()

const search = ref('')
const sortKey = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const perPage = ref(props.pageSize)

// Resetear página al buscar
watch(search, () => {
  currentPage.value = 1
})

// Filtrado de búsqueda
const filteredItems = computed(() => {
  let result = [...props.items]

  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    result = result.filter((item) => {
      return props.columns.some((col) => {
        const val = item[col.key]
        if (val === null || val === undefined) return false
        return String(val).toLowerCase().includes(q)
      })
    })
  }

  // Ordenamiento
  if (sortKey.value) {
    result.sort((a, b) => {
      const valA = a[sortKey.value]
      const valB = b[sortKey.value]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      let comp = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        comp = valA - valB
      } else {
        comp = String(valA).localeCompare(String(valB))
      }
      return sortOrder.value === 'asc' ? comp : -comp
    })
  }

  return result
})

// Total de registros filtrados
const totalItems = computed(() => filteredItems.value.length)

// Total de páginas
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value) || 1)

// Elementos paginados
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredItems.value.slice(start, start + perPage.value)
})

// Rango de elementos mostrados
const rangeStart = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * perPage.value + 1
})

const rangeEnd = computed(() => {
  return Math.min(currentPage.value * perPage.value, totalItems.value)
})

// Métodos de interacción
const handleSort = (col: TableColumn<T>) => {
  if (col.sortable === false) return
  if (sortKey.value === col.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = col.key
    sortOrder.value = 'asc'
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<template>
  <div class="data-table-wrapper card shadow-sm border-0">
    <!-- Header de la tabla: Buscador y acciones superiores -->
    <div class="card-header bg-white py-3 border-0">
      <div class="row align-items-center g-2">
        <div class="col-md-6 col-12">
          <div v-if="searchable" class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted">
              <i class="fas fa-search"></i>
            </span>
            <input
              v-model="search"
              type="search"
              class="form-control bg-light border-start-0 ps-0"
              :placeholder="searchPlaceholder"
              aria-label="Buscar"
            />
            <button
              v-if="search"
              class="btn btn-light border"
              type="button"
              title="Limpiar búsqueda"
              @click="search = ''"
            >
              <i class="fas fa-times text-muted"></i>
            </button>
          </div>
        </div>

        <div class="col-md-6 col-12 text-md-end">
          <div class="d-flex justify-content-md-end align-items-center gap-2">
            <BaseButton
              variant="outline-secondary"
              size="sm"
              icon="fas fa-sync-alt"
              :loading="loading"
              @click="emit('refresh')"
            >
              Refrescar
            </BaseButton>

            <slot name="header-actions" />
          </div>
        </div>
      </div>
    </div>

    <!-- Contenedor con posición relativa para overlay de carga -->
    <div class="table-responsive position-relative">
      <Loading v-if="loading" :overlay="true" message="Actualizando datos..." />

      <table class="table table-hover align-middle mb-0">
        <thead class="table-light text-secondary small text-uppercase">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
              :class="['user-select-none', { 'cursor-pointer': col.sortable !== false }]"
              @click="handleSort(col)"
            >
              <div
                class="d-flex align-items-center gap-1"
                :class="{
                  'justify-content-center': col.align === 'center',
                  'justify-content-end': col.align === 'right'
                }"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable !== false" class="text-muted ms-1 small">
                  <i
                    v-if="sortKey === col.key"
                    :class="sortOrder === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'"
                  ></i>
                  <i v-else class="fas fa-sort opacity-25"></i>
                </span>
              </div>
            </th>

            <th
              v-if="showActions"
              class="text-center"
              style="width: 140px;"
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Estado con registros -->
          <tr v-for="(item, idx) in paginatedItems" :key="item.id || idx">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot
                :name="`cell(${col.key})`"
                :item="item"
                :column="col"
                :value="item[col.key]"
                :index="idx"
              >
                <slot
                  name="cell"
                  :item="item"
                  :column="col"
                  :value="item[col.key]"
                  :index="idx"
                >
                  <span v-if="col.formatter">
                    {{ col.formatter(item[col.key], item) }}
                  </span>
                  <span v-else>
                    {{ item[col.key] ?? '—' }}
                  </span>
                </slot>
              </slot>
            </td>

            <!-- Columna de acciones por fila -->
            <td v-if="showActions" class="text-center">
              <slot name="actions" :item="item" :index="idx">
                <div class="btn-group btn-group-sm" role="group" aria-label="Acciones">
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    title="Editar registro"
                    @click="emit('edit', item)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    title="Eliminar registro"
                    @click="emit('delete', item)"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </slot>
            </td>
          </tr>

          <!-- Estado vacío -->
          <tr v-if="!loading && paginatedItems.length === 0">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="text-center py-5">
              <slot name="empty">
                <div class="text-muted">
                  <i class="fas fa-inbox fa-3x mb-3 text-secondary opacity-50"></i>
                  <p class="mb-0 fw-semibold">{{ emptyText }}</p>
                  <small v-if="search" class="text-muted">
                    No se encontraron coincidencias para "{{ search }}".
                  </small>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer con paginación -->
    <div
      v-if="totalItems > 0"
      class="card-footer bg-white border-0 py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2"
    >
      <div class="text-muted small">
        Mostrando <span class="fw-bold">{{ rangeStart }}</span> a
        <span class="fw-bold">{{ rangeEnd }}</span> de
        <span class="fw-bold">{{ totalItems }}</span> registros
      </div>

      <nav v-if="totalPages > 1" aria-label="Paginación de tabla">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link"
              type="button"
              aria-label="Anterior"
              @click="goToPage(currentPage - 1)"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
          </li>

          <li
            v-for="p in totalPages"
            :key="p"
            class="page-item"
            :class="{ active: p === currentPage }"
          >
            <button class="page-link" type="button" @click="goToPage(p)">
              {{ p }}
            </button>
          </li>

          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link"
              type="button"
              aria-label="Siguiente"
              @click="goToPage(currentPage + 1)"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.table th {
  font-weight: 700;
  letter-spacing: 0.03rem;
  border-top: none;
}

.pagination .page-item.active .page-link {
  background-color: var(--primary-color, #4e73df);
  border-color: var(--primary-color, #4e73df);
}

.pagination .page-link {
  color: var(--primary-color, #4e73df);
}
</style>
