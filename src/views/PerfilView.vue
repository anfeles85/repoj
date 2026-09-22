<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { ApiError } from '@/interfaces/ApiResponse'
import AlertMessage from '@/components/common/AlertMessage.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Campos del formulario
const fullname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Visibilidad de contraseñas
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Estados de interfaz
const isSaving = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

// Inicializar datos del usuario actual
const initFormData = () => {
  if (authStore.user) {
    fullname.value = authStore.user.fullname || ''
    email.value = authStore.user.email || ''
  }
  password.value = ''
  confirmPassword.value = ''
  fieldErrors.value = {}
  errorMessage.value = null
}

onMounted(() => {
  initFormData()
})

// Badge de rol
const roleBadgeClass = computed(() => {
  switch (authStore.user?.role) {
    case 'ADMINISTRADOR':
      return 'bg-danger-subtle text-danger border border-danger-subtle'
    case 'COORDINADOR':
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
    case 'INSTRUCTOR':
      return 'bg-success-subtle text-success border border-success-subtle'
    default:
      return 'bg-secondary-subtle text-secondary border'
  }
})

// Validación en cliente
const validateForm = (): boolean => {
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!trimmedEmail) {
    fieldErrors.value.email = 'El correo electrónico es obligatorio.'
    isValid = false
  } else if (!emailRegex.test(trimmedEmail)) {
    fieldErrors.value.email = 'Ingrese un formato de correo electrónico válido.'
    isValid = false
  }

  // Validación opcional de contraseña
  const trimmedPassword = password.value.trim()
  const trimmedConfirm = confirmPassword.value.trim()

  if (trimmedPassword || trimmedConfirm) {
    if (trimmedPassword.length < 6) {
      fieldErrors.value.password = 'La nueva contraseña debe tener al menos 6 caracteres.'
      isValid = false
    }

    if (trimmedPassword !== trimmedConfirm) {
      fieldErrors.value.confirmPassword = 'Las contraseñas ingresadas no coinciden.'
      isValid = false
    }
  }

  return isValid
}

// Guardar cambios
const handleSubmit = async () => {
  successMessage.value = null
  errorMessage.value = null

  if (!validateForm()) return

  isSaving.value = true

  try {
    const payload: { fullname: string; email: string; password?: string } = {
      fullname: fullname.value.trim(),
      email: email.value.trim().toLowerCase()
    }

    if (password.value.trim()) {
      payload.password = password.value.trim()
    }

    await authStore.updateProfile(payload)

    successMessage.value = 'Su información de perfil ha sido actualizada exitosamente.'
    password.value = ''
    confirmPassword.value = ''
    fieldErrors.value = {}

    notificationStore.addNotification(
      'Perfil actualizado exitosamente.',
      'success',
      'Perfil Actualizado'
    )
  } catch (err: unknown) {
    const apiError = err as ApiError
    if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0) {
      const mapped: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(apiError.fieldErrors)) {
        if (msgs && msgs.length > 0) {
          mapped[key] = msgs[0]
        }
      }
      fieldErrors.value = mapped
    }

    errorMessage.value =
      apiError.message ||
      'Ocurrió un error al actualizar la información del perfil. Intente nuevamente.'
  } finally {
    isSaving.value = false
  }
}

// Cancelar / Restaurar
const handleCancel = () => {
  initFormData()
  successMessage.value = null
  errorMessage.value = null
}
</script>

<template>
  <div class="perfil-view">
    <!-- Encabezado de vista -->
    <div class="mb-4">
      <h1 class="h3 mb-1 text-gray-800 fw-bold">Mi Perfil</h1>
      <p class="text-muted small mb-0">
        Consulte su información de usuario y actualice sus datos personales y contraseña de acceso
      </p>
    </div>

    <!-- Mensaje informativo sobre el rol (requisito req004) -->
    <div class="alert alert-info border-0 shadow-sm mb-4 d-flex align-items-start gap-3 p-3">
      <div class="alert-icon text-primary fs-5 mt-1">
        <i class="fas fa-info-circle"></i>
      </div>
      <div>
        <h6 class="fw-bold mb-1 text-dark">Información sobre Rol en el Sistema</h6>
        <p class="mb-0 small text-dark">
          Su rol actual asignado es <strong class="text-primary">{{ authStore.userRoleLabel }}</strong>.
          Tenga en cuenta que <strong>el cambio de rol en el sistema debe solicitarse al Administrador</strong>.
        </p>
      </div>
    </div>

    <div class="row g-4">
      <!-- Columna Izquierda: Tarjeta Resumen de Usuario -->
      <div class="col-12 col-lg-4">
        <div class="card border-0 shadow-sm text-center p-4 h-100">
          <div class="card-body d-flex flex-column align-items-center justify-content-center">
            <!-- Avatar con Iniciales -->
            <div class="profile-avatar mb-3 shadow-sm">
              {{ authStore.userName.charAt(0).toUpperCase() }}
            </div>

            <h5 class="fw-bold text-dark mb-1">{{ authStore.userName }}</h5>
            <p class="text-muted small mb-2 text-break">{{ authStore.user?.email }}</p>

            <span :class="['badge px-3 py-2 mb-4 font-monospace', roleBadgeClass]">
              <i class="fas fa-user-tag me-1"></i> Rol: {{ authStore.userRoleLabel }}
            </span>

            <div class="w-100 border-top pt-3 text-start small">
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted">Estado de Cuenta:</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle">
                  {{ authStore.user?.status || 'ACTIVO' }}
                </span>
              </div>
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted">Identificador:</span>
                <span class="font-monospace text-dark fw-semibold">#{{ authStore.user?.id }}</span>
              </div>
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted">Permisos:</span>
                <span class="text-dark">{{ authStore.isAdmin ? 'Acceso Total' : 'Operativo' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Formulario de Datos y Contraseña -->
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <i class="fas fa-user-edit text-success"></i>
              <span>Datos Personales y Credenciales</span>
            </h6>
          </div>

          <div class="card-body p-4">
            <!-- Mensajes de Éxito y Error -->
            <div v-if="successMessage" class="mb-4">
              <AlertMessage
                variant="success"
                title="Actualización Exitosa"
                :message="successMessage"
                dismissible
                @dismiss="successMessage = null"
              />
            </div>

            <div v-if="errorMessage" class="mb-4">
              <AlertMessage
                variant="danger"
                title="Error al Actualizar"
                :message="errorMessage"
                dismissible
                @dismiss="errorMessage = null"
              />
            </div>

            <form @submit.prevent="handleSubmit" novalidate>
              <!-- 1. Nombre Completo -->
              <div class="mb-3">
                <label for="profile-fullname" class="form-label fw-bold small text-dark">
                  Nombre Completo <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <i class="fas fa-user"></i>
                  </span>
                  <input
                    id="profile-fullname"
                    v-model="fullname"
                    type="text"
                    :class="['form-control', { 'is-invalid': fieldErrors.fullname }]"
                    placeholder="Ingrese su nombre y apellido completo"
                    :disabled="isSaving"
                    required
                  />
                  <div v-if="fieldErrors.fullname" class="invalid-feedback">
                    {{ fieldErrors.fullname }}
                  </div>
                </div>
              </div>

              <!-- 2. Correo Electrónico -->
              <div class="mb-3">
                <label for="profile-email" class="form-label fw-bold small text-dark">
                  Correo Electrónico <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input
                    id="profile-email"
                    v-model="email"
                    type="email"
                    :class="['form-control', { 'is-invalid': fieldErrors.email }]"
                    placeholder="ejemplo@sena.edu.co"
                    :disabled="isSaving"
                    required
                  />
                  <div v-if="fieldErrors.email" class="invalid-feedback">
                    {{ fieldErrors.email }}
                  </div>
                </div>
                <small class="form-text text-muted" style="font-size: 0.75rem;">
                  El correo debe ser único en la plataforma. Se validará contra la base de datos en Supabase.
                </small>
              </div>

              <!-- 3. Rol (Solo lectura - requisito req004) -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label for="profile-role" class="form-label fw-bold small text-dark mb-0">
                    Rol Asignado
                  </label>
                  <span class="badge bg-secondary-subtle text-secondary small" style="font-size: 0.7rem;">
                    <i class="fas fa-lock me-1"></i> Solo lectura
                  </span>
                </div>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <i class="fas fa-shield-alt"></i>
                  </span>
                  <input
                    id="profile-role"
                    type="text"
                    class="form-control bg-light text-muted fw-semibold"
                    :value="authStore.userRoleLabel"
                    disabled
                    readonly
                  />
                </div>
                <small class="form-text text-muted" style="font-size: 0.75rem;">
                  Para solicitar un cambio de rol, debe contactar a un Administrador del sistema.
                </small>
              </div>

              <hr class="my-4" />

              <!-- 4. Sección de Cambio de Contraseña (Opcional) -->
              <div class="mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <h6 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <i class="fas fa-key text-primary"></i>
                    <span>Cambiar Contraseña</span>
                  </h6>
                  <span class="badge bg-light text-muted border small font-monospace">
                    Opcional
                  </span>
                </div>
                <p class="text-muted small mb-3">
                  Deje estos campos en blanco si no desea modificar su contraseña actual.
                </p>

                <div class="row g-3">
                  <!-- Nueva Contraseña -->
                  <div class="col-12 col-md-6">
                    <label for="profile-password" class="form-label fw-bold small text-dark">
                      Nueva Contraseña
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-light text-muted">
                        <i class="fas fa-lock"></i>
                      </span>
                      <input
                        id="profile-password"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        :class="['form-control', { 'is-invalid': fieldErrors.password }]"
                        placeholder="Mínimo 6 caracteres"
                        :disabled="isSaving"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                        tabindex="-1"
                        @click="showPassword = !showPassword"
                      >
                        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                      <div v-if="fieldErrors.password" class="invalid-feedback">
                        {{ fieldErrors.password }}
                      </div>
                    </div>
                  </div>

                  <!-- Confirmar Nueva Contraseña -->
                  <div class="col-12 col-md-6">
                    <label for="profile-confirm-password" class="form-label fw-bold small text-dark">
                      Confirmar Nueva Contraseña
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-light text-muted">
                        <i class="fas fa-lock"></i>
                      </span>
                      <input
                        id="profile-confirm-password"
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        :class="['form-control', { 'is-invalid': fieldErrors.confirmPassword }]"
                        placeholder="Repita la nueva contraseña"
                        :disabled="isSaving"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        :title="showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                        tabindex="-1"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                      <div v-if="fieldErrors.confirmPassword" class="invalid-feedback">
                        {{ fieldErrors.confirmPassword }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botones de Acción -->
              <div class="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
                <BaseButton
                  type="button"
                  variant="outline-secondary"
                  icon="fas fa-undo"
                  :disabled="isSaving"
                  @click="handleCancel"
                >
                  Restablecer
                </BaseButton>

                <BaseButton
                  type="submit"
                  variant="primary"
                  icon="fas fa-save"
                  :loading="isSaving"
                >
                  Guardar Cambios
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil-view {
  animation: fadeIn 0.15s ease-out;
}

.profile-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--primary-gradient, linear-gradient(180deg, #39A900 10%, #267a00 100%));
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
