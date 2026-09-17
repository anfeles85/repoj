<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { User, CreateUserPayload, UpdateUserPayload, UserStatus } from '@/interfaces/User'
import type { ApiError } from '@/interfaces/ApiResponse'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/common/BaseSelect.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    user?: User | null
    loading?: boolean
    apiError?: ApiError | null
  }>(),
  {
    user: null,
    loading: false,
    apiError: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: CreateUserPayload | UpdateUserPayload): void
}>()

const isEditing = computed(() => !!props.user)
const modalTitle = computed(() => (isEditing.value ? 'Editar Usuario' : 'Crear Nuevo Usuario'))

// Campos del formulario
const fullname = ref('')
const email = ref('')
const role = ref<'INSTRUCTOR' | 'COORDINADOR'>('INSTRUCTOR')
const status = ref<UserStatus>('ACTIVO')
const password = ref('')
const showPassword = ref(false)

const clientError = ref('')
const fieldErrors = ref<Record<string, string>>({})

// Opciones de rol: REGLA ESTRICTA - El sistema NO permite crear administradores
const roleOptions: SelectOption[] = [
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'COORDINADOR', label: 'Coordinador' }
]

const statusOptions: SelectOption[] = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' }
]

// Sincronizar formulario al abrir modal o cambiar usuario a editar
const resetForm = () => {
  clientError.value = ''
  fieldErrors.value = {}
  showPassword.value = false

  if (props.user) {
    fullname.value = props.user.fullname
    email.value = props.user.email
    role.value = (props.user.role === 'ADMINISTRADOR' ? 'INSTRUCTOR' : props.user.role) as 'INSTRUCTOR' | 'COORDINADOR'
    status.value = props.user.status
    password.value = ''
  } else {
    fullname.value = ''
    email.value = ''
    role.value = 'INSTRUCTOR'
    status.value = 'ACTIVO'
    password.value = ''
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

watch(
  () => props.user,
  () => {
    if (props.modelValue) {
      resetForm()
    }
  }
)

const close = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}

const validate = (): boolean => {
  clientError.value = ''
  fieldErrors.value = {}
  let isValid = true

  const trimmedName = fullname.value.trim()
  if (!trimmedName) {
    fieldErrors.value.fullname = 'El nombre completo es obligatorio.'
    isValid = false
  } else if (trimmedName.length < 3) {
    fieldErrors.value.fullname = 'El nombre debe tener al menos 3 caracteres.'
    isValid = false
  }

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    fieldErrors.value.email = 'El correo electrónico es obligatorio.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    fieldErrors.value.email = 'Ingrese un correo electrónico válido.'
    isValid = false
  }

  if (!isEditing.value) {
    if (!password.value) {
      fieldErrors.value.password = 'La contraseña inicial es obligatoria para nuevos usuarios.'
      isValid = false
    } else if (password.value.length < 6) {
      fieldErrors.value.password = 'La contraseña debe tener mínimo 6 caracteres.'
      isValid = false
    }
  } else if (password.value && password.value.length < 6) {
    fieldErrors.value.password = 'Si actualiza la contraseña, debe tener mínimo 6 caracteres.'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validate()) return

  if (isEditing.value) {
    const payload: UpdateUserPayload = {
      fullname: fullname.value.trim(),
      email: email.value.trim(),
      role: props.user?.role === 'ADMINISTRADOR' ? undefined : role.value,
      status: props.user?.role === 'ADMINISTRADOR' ? undefined : status.value
    }
    if (password.value.trim()) {
      payload.password = password.value.trim()
    }
    emit('submit', payload)
  } else {
    const payload: CreateUserPayload = {
      fullname: fullname.value.trim(),
      email: email.value.trim(),
      role: role.value,
      password: password.value,
      status: status.value
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop-custom" @click.self="close">
    <div class="modal-dialog-custom">
      <div class="modal-content bg-white shadow-lg border-0 rounded-3">
        <!-- Encabezado del modal -->
        <div class="modal-header border-bottom py-3 px-4 bg-light">
          <div class="d-flex align-items-center gap-2">
            <div class="modal-icon-badge bg-primary-subtle text-primary">
              <i :class="isEditing ? 'fas fa-user-edit' : 'fas fa-user-plus'"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold text-dark mb-0">{{ modalTitle }}</h5>
              <p class="text-muted small mb-0">
                {{
                  isEditing
                    ? 'Actualice la información del usuario en el sistema'
                    : 'Registre un nuevo instructor o coordinador en REPOJ'
                }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            :disabled="loading"
            aria-label="Cerrar"
            @click="close"
          ></button>
        </div>

        <!-- Alerta de advertencia para Admin -->
        <div v-if="user?.role === 'ADMINISTRADOR'" class="px-4 pt-3">
          <div class="alert alert-warning py-2 px-3 small mb-0 d-flex align-items-center gap-2">
            <i class="fas fa-shield-alt"></i>
            <span>El rol y estado del Administrador General están protegidos contra modificaciones.</span>
          </div>
        </div>

        <!-- Alertas de error -->
        <div v-if="clientError || apiError?.message" class="px-4 pt-3">
          <AlertMessage
            variant="danger"
            :message="clientError || apiError?.message || ''"
            :errors="apiError?.errors"
            dismissible
            @dismiss="clientError = ''"
          />
        </div>

        <!-- Cuerpo del formulario -->
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="modal-body px-4 py-3 bg-white">
            <BaseInput
              id="user-modal-nombre"
              v-model="fullname"
              label="Nombre Completo"
              placeholder="Ej: Carlos Mario Gómez"
              :error="fieldErrors.fullname || apiError?.fieldErrors?.fullname?.[0]"
              :disabled="loading"
              required
            >
              <template #prepend>
                <span class="input-group-text bg-light text-muted">
                  <i class="fas fa-user"></i>
                </span>
              </template>
            </BaseInput>

            <BaseInput
              id="user-modal-correo"
              v-model="email"
              label="Correo Electrónico"
              type="email"
              placeholder="ejemplo@repoj.gov.co"
              :error="fieldErrors.email || apiError?.fieldErrors?.email?.[0]"
              :disabled="loading"
              required
            >
              <template #prepend>
                <span class="input-group-text bg-light text-muted">
                  <i class="fas fa-envelope"></i>
                </span>
              </template>
            </BaseInput>

            <div class="row g-2">
              <div class="col-sm-6">
                <!-- Selector de Rol (Excluye Admin siempre) -->
                <BaseSelect
                  id="user-modal-rol"
                  v-model="role"
                  label="Rol del Usuario"
                  :options="roleOptions"
                  :disabled="loading || user?.role === 'ADMINISTRADOR'"
                  help-text="Solo instructores y coordinadores."
                  required
                />
              </div>

              <div class="col-sm-6">
                <BaseSelect
                  id="user-modal-estado"
                  v-model="status"
                  label="Estado"
                  :options="statusOptions"
                  :disabled="loading || user?.role === 'ADMINISTRADOR'"
                  required
                />
              </div>
            </div>

            <!-- Campo Contraseña -->
            <div class="mb-3 mt-1">
              <label for="user-modal-password" class="form-label fw-bold small text-dark mb-1">
                {{ isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso' }}
                <span v-if="!isEditing" class="text-danger">*</span>
              </label>
              <div class="input-group has-validation">
                <span class="input-group-text bg-light text-muted">
                  <i class="fas fa-key"></i>
                </span>
                <input
                  id="user-modal-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  :class="{ 'is-invalid': !!fieldErrors.password }"
                  :placeholder="isEditing ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'"
                  :disabled="loading"
                />
                <button
                  type="button"
                  class="btn btn-light border"
                  title="Mostrar u ocultar contraseña"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash text-muted' : 'fas fa-eye text-muted'"></i>
                </button>
                <div v-if="fieldErrors.password" class="invalid-feedback d-block">
                  {{ fieldErrors.password }}
                </div>
              </div>
              <div v-if="isEditing" class="form-text text-muted small">
                Solo complete este campo si desea cambiar la contraseña del usuario.
              </div>
            </div>
          </div>

          <!-- Pie del modal con acciones -->
          <div class="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-end gap-2">
            <BaseButton
              type="button"
              variant="outline-secondary"
              :disabled="loading"
              @click="close"
            >
              Cancelar
            </BaseButton>

            <BaseButton
              type="submit"
              variant="primary"
              :loading="loading"
              icon="fas fa-save"
            >
              {{ isEditing ? 'Guardar Cambios' : 'Crear Usuario' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease-out;
}

.modal-dialog-custom {
  width: 100%;
  max-width: 540px;
  animation: scaleUp 0.15s ease-out;
}

.modal-content {
  background-color: #ffffff !important;
}

.modal-body {
  background-color: #ffffff !important;
}

.modal-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
