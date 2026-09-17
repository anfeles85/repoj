<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'
import authService from '@/services/authService'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import type { ApiError } from '@/interfaces/ApiResponse'

const router = useRouter()
const notificationStore = useNotificationStore()

// Estados del flujo: 'request' (pedir correo) | 'reset' (ingresar nueva contraseña)
const step = ref<'request' | 'reset'>('request')

const email = ref('')
const resetToken = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const showPassword = ref(false)

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

const handleRequestReset = async () => {
  fieldErrors.value = {}
  errorMessage.value = ''
  successMessage.value = ''

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    fieldErrors.value.email = 'El correo electrónico es requerido.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    fieldErrors.value.email = 'Ingrese un correo electrónico válido.'
    return
  }

  loading.value = true
  try {
    const res = await authService.forgotPassword({ email: trimmedEmail })
    successMessage.value =
      res.message || 'Se ha generado la solicitud de restablecimiento exitosamente.'
    resetToken.value = res.token || 'recovery-token'
    step.value = 'reset'
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'No se pudo procesar la solicitud para el correo ingresado.'
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  fieldErrors.value = {}
  errorMessage.value = ''

  if (!newPassword.value) {
    fieldErrors.value.newPassword = 'La nueva contraseña es requerida.'
    return
  }
  if (newPassword.value.length < 6) {
    fieldErrors.value.newPassword = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    fieldErrors.value.newPasswordConfirm = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    await authService.resetPassword({
      email: email.value.trim(),
      token: resetToken.value,
      password: newPassword.value,
      password_confirmation: newPasswordConfirm.value
    })

    notificationStore.addNotification(
      'Su contraseña ha sido actualizada con éxito. Ya puede iniciar sesión.',
      'success',
      'Contraseña Restablecida'
    )
    router.push('/login')
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'Error al restablecer la contraseña. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
    <div class="card-body p-4 p-sm-5">
      <!-- Encabezado de la tarjeta -->
      <div class="text-center mb-4">
        <div class="auth-icon-circle bg-warning-subtle text-warning mx-auto mb-3">
          <i class="fas fa-key fa-lg"></i>
        </div>
        <h2 class="h4 fw-bold text-dark mb-1">Recuperar Contraseña</h2>
        <p class="text-muted small mb-0">
          {{
            step === 'request'
              ? 'Ingrese su correo electrónico institucional para restablecer su acceso'
              : 'Ingrese su nueva contraseña de acceso para continuar'
          }}
        </p>
      </div>

      <!-- Mensajes de Alerta -->
      <AlertMessage
        v-if="errorMessage"
        variant="danger"
        :message="errorMessage"
        dismissible
        @dismiss="errorMessage = ''"
      />

      <AlertMessage
        v-if="successMessage"
        variant="success"
        :message="successMessage"
        dismissible
        @dismiss="successMessage = ''"
      />

      <!-- Paso 1: Solicitar recuperación -->
      <form v-if="step === 'request'" @submit.prevent="handleRequestReset" novalidate>
        <BaseInput
          id="forgot-correo"
          v-model="email"
          label="Correo Electrónico Registrado"
          type="email"
          placeholder="ejemplo@sena.edu.co"
          :error="fieldErrors.email"
          :disabled="loading"
          required
        >
          <template #prepend>
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-envelope"></i>
            </span>
          </template>
        </BaseInput>

        <BaseButton
          type="submit"
          variant="primary"
          class="w-100 py-2 mt-3"
          :loading="loading"
          icon="fas fa-paper-plane"
        >
          Enviar Instrucciones de Recuperación
        </BaseButton>
      </form>

      <!-- Paso 2: Restablecer Contraseña -->
      <form v-else @submit.prevent="handleResetPassword" novalidate>
        <div class="mb-3">
          <label class="form-label fw-bold small text-dark mb-1">
            Correo Verificado
          </label>
          <input
            type="text"
            class="form-control bg-light"
            :value="email"
            disabled
          />
        </div>

        <div class="mb-3">
          <label for="new-pass" class="form-label fw-bold small text-dark mb-1">
            Nueva Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-lock"></i>
            </span>
            <input
              id="new-pass"
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': !!fieldErrors.newPassword }"
              placeholder="Mínimo 6 caracteres"
              :disabled="loading"
              required
            />
            <button
              type="button"
              class="btn btn-light border"
              title="Mostrar u ocultar contraseña"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash text-muted' : 'fas fa-eye text-muted'"></i>
            </button>
            <div v-if="fieldErrors.newPassword" class="invalid-feedback d-block">
              {{ fieldErrors.newPassword }}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="new-pass-confirm" class="form-label fw-bold small text-dark mb-1">
            Confirmar Nueva Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-check-circle"></i>
            </span>
            <input
              id="new-pass-confirm"
              v-model="newPasswordConfirm"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': !!fieldErrors.newPasswordConfirm }"
              placeholder="Repita la nueva contraseña"
              :disabled="loading"
              required
            />
            <div v-if="fieldErrors.newPasswordConfirm" class="invalid-feedback d-block">
              {{ fieldErrors.newPasswordConfirm }}
            </div>
          </div>
        </div>

        <BaseButton
          type="submit"
          variant="success"
          class="w-100 py-2 mt-3"
          :loading="loading"
          icon="fas fa-check"
        >
          Guardar Nueva Contraseña
        </BaseButton>

        <button
          type="button"
          class="btn btn-link text-muted small w-100 mt-2 text-decoration-none"
          @click="step = 'request'"
        >
          <i class="fas fa-arrow-left me-1"></i> Cambiar correo ingresado
        </button>
      </form>

      <!-- Enlace para volver a inicio de sesión -->
      <div class="text-center mt-4 pt-3 border-top">
        <router-link to="/login" class="fw-semibold text-primary text-decoration-none small">
          <i class="fas fa-chevron-left me-1"></i> Volver a Iniciar Sesión
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-icon-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
