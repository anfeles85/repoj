<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'
import authService from '@/services/authService'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import type { ApiError } from '@/interfaces/ApiResponse'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const token = ref<string>('')
const isCheckingToken = ref(true)
const tokenStatus = ref<'valid' | 'expired' | 'used' | 'invalid'>('valid')
const tokenErrorMessage = ref('')
const verifiedEmail = ref('')

const newPassword = ref('')
const newPasswordConfirm = ref('')
const showPassword = ref(false)

const loading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const passwordChangedSuccess = ref(false)

onMounted(async () => {
  const queryToken = route.query.token
  if (!queryToken || typeof queryToken !== 'string' || !queryToken.trim()) {
    isCheckingToken.value = false
    tokenStatus.value = 'invalid'
    tokenErrorMessage.value = 'No se proporcionó un token de recuperación válido en el enlace.'
    return
  }

  token.value = queryToken.trim()

  try {
    const result = await authService.validateResetToken(token.value)
    if (result.valid && result.tokenRecord) {
      tokenStatus.value = 'valid'
      verifiedEmail.value = result.tokenRecord.email
    } else {
      if (result.errorType === 'EXPIRED') {
        tokenStatus.value = 'expired'
        tokenErrorMessage.value =
          result.message ||
          'Este enlace de recuperación ha expirado. Por seguridad, los enlaces tienen una validez de 1 hora.'
      } else if (result.errorType === 'USED') {
        tokenStatus.value = 'used'
        tokenErrorMessage.value =
          result.message || 'Este enlace de recuperación ya ha sido utilizado previamente.'
      } else {
        tokenStatus.value = 'invalid'
        tokenErrorMessage.value =
          result.message || 'El enlace de recuperación es inválido o no existe en el sistema.'
      }
    }
  } catch (err: unknown) {
    tokenStatus.value = 'invalid'
    tokenErrorMessage.value = 'Error al validar el enlace de recuperación. Intente nuevamente.'
  } finally {
    isCheckingToken.value = false
  }
})

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
    const response = await authService.resetPassword({
      email: verifiedEmail.value,
      token: token.value,
      password: newPassword.value,
      password_confirmation: newPasswordConfirm.value
    })

    passwordChangedSuccess.value = true
    notificationStore.addNotification(
      response.message || 'Su contraseña ha sido actualizada con éxito.',
      'success',
      'Contraseña Restablecida'
    )
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'Error al restablecer la contraseña. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goToForgotPassword = () => {
  router.push('/recuperar-contrasena')
}
</script>

<template>
  <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
    <div class="card-body p-4 p-sm-5">
      <!-- Encabezado de la tarjeta -->
      <div class="text-center mb-4">
        <div class="mb-3">
          <img src="/logo_repoj.png" alt="Logo REPOJ" class="auth-card-logo" />
        </div>
        <h2 class="h4 fw-bold text-dark mb-1">Restablecer Contraseña</h2>
        <p class="text-muted small mb-0">
          {{
            isCheckingToken
              ? 'Validando su enlace de recuperación...'
              : passwordChangedSuccess
              ? 'Su contraseña ha sido modificada con éxito'
              : tokenStatus === 'valid'
              ? 'Ingrese su nueva contraseña de acceso para continuar'
              : 'Verificación del enlace de recuperación'
          }}
        </p>
      </div>

      <!-- Estado: Verificando Token -->
      <div v-if="isCheckingToken" class="text-center py-4">
        <div class="spinner-border text-primary-sena mb-3" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted small">Verificando la validez del enlace de recuperación...</p>
      </div>

      <!-- Estado: Contraseña Modificada con Éxito -->
      <div v-else-if="passwordChangedSuccess" class="text-center py-3">
        <div class="mb-3 text-success">
          <i class="fas fa-check-circle fa-4x text-primary-sena"></i>
        </div>
        <h3 class="h5 fw-bold text-dark mb-2">¡Contraseña Actualizada!</h3>
        <p class="text-muted small mb-3">
          Su contraseña ha sido modificada correctamente. Le hemos enviado un correo de confirmación a <strong>{{ verifiedEmail }}</strong>.
        </p>
        <p class="text-muted extra-small mb-4">
          Ya puede iniciar sesión con su nueva clave de acceso en la plataforma REPOJ.
        </p>
        <BaseButton
          type="button"
          variant="primary"
          class="w-100 py-2"
          icon="fas fa-sign-in-alt"
          @click="goToLogin"
        >
          Iniciar Sesión Ahora
        </BaseButton>
      </div>

      <!-- Estado: Token Expirado (> 1 hora) -->
      <div v-else-if="tokenStatus === 'expired'" class="py-2">
        <div class="text-center mb-3 text-warning">
          <i class="fas fa-clock fa-3x"></i>
        </div>
        <div class="alert alert-warning border-0 rounded-3 text-start small mb-4">
          <div class="fw-bold mb-1">
            <i class="fas fa-exclamation-triangle me-1"></i> Enlace Expirado
          </div>
          {{ tokenErrorMessage }}
        </div>
        <p class="text-muted small text-center mb-4">
          Por motivos de seguridad, los enlaces para cambiar contraseña tienen una vigencia máxima de 1 hora. Por favor solicite un nuevo enlace de recuperación.
        </p>
        <BaseButton
          type="button"
          variant="primary"
          class="w-100 py-2 mb-2"
          icon="fas fa-redo"
          @click="goToForgotPassword"
        >
          Solicitar Nuevo Enlace
        </BaseButton>
        <div class="text-center mt-3">
          <router-link to="/login" class="text-muted small text-decoration-none">
            <i class="fas fa-arrow-left me-1"></i> Volver a Iniciar Sesión
          </router-link>
        </div>
      </div>

      <!-- Estado: Token Ya Utilizado -->
      <div v-else-if="tokenStatus === 'used'" class="py-2">
        <div class="text-center mb-3 text-info">
          <i class="fas fa-history fa-3x text-secondary"></i>
        </div>
        <div class="alert alert-secondary border-0 rounded-3 text-start small mb-4">
          <div class="fw-bold mb-1">
            <i class="fas fa-info-circle me-1"></i> Enlace Ya Utilizado
          </div>
          {{ tokenErrorMessage }}
        </div>
        <p class="text-muted small text-center mb-4">
          Este enlace ya fue empleado para cambiar la contraseña y no puede ser reutilizado por motivos de seguridad.
        </p>
        <BaseButton
          type="button"
          variant="primary"
          class="w-100 py-2 mb-2"
          icon="fas fa-sign-in-alt"
          @click="goToLogin"
        >
          Ir a Iniciar Sesión
        </BaseButton>
        <div class="text-center mt-2">
          <button
            type="button"
            class="btn btn-link text-primary-sena small text-decoration-none"
            @click="goToForgotPassword"
          >
            ¿Necesita solicitar otro enlace? Clic aquí
          </button>
        </div>
      </div>

      <!-- Estado: Token Inválido o No Encontrado -->
      <div v-else-if="tokenStatus === 'invalid'" class="py-2">
        <div class="text-center mb-3 text-danger">
          <i class="fas fa-times-circle fa-3x"></i>
        </div>
        <div class="alert alert-danger border-0 rounded-3 text-start small mb-4">
          <div class="fw-bold mb-1">
            <i class="fas fa-ban me-1"></i> Enlace Inválido
          </div>
          {{ tokenErrorMessage }}
        </div>
        <p class="text-muted small text-center mb-4">
          El enlace de recuperación ingresado no es válido o está incompleto. Por favor intente solicitar uno nuevo.
        </p>
        <BaseButton
          type="button"
          variant="primary"
          class="w-100 py-2 mb-2"
          icon="fas fa-redo"
          @click="goToForgotPassword"
        >
          Solicitar Enlace de Recuperación
        </BaseButton>
        <div class="text-center mt-3">
          <router-link to="/login" class="text-muted small text-decoration-none">
            <i class="fas fa-arrow-left me-1"></i> Volver a Iniciar Sesión
          </router-link>
        </div>
      </div>

      <!-- Estado: Token Válido (Formulario de Nueva Contraseña) -->
      <form v-else @submit.prevent="handleResetPassword" novalidate>
        <!-- Mensajes de Alerta -->
        <AlertMessage
          v-if="errorMessage"
          variant="danger"
          :message="errorMessage"
          dismissible
          @dismiss="errorMessage = ''"
        />

        <div class="mb-3">
          <label class="form-label fw-bold small text-dark mb-1">
            Correo Electrónico Verificado
          </label>
          <div class="input-group">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-envelope"></i>
            </span>
            <input
              type="text"
              class="form-control bg-light"
              :value="verifiedEmail"
              disabled
            />
          </div>
        </div>

        <div class="mb-3">
          <label for="reset-new-pass" class="form-label fw-bold small text-dark mb-1">
            Nueva Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-lock"></i>
            </span>
            <input
              id="reset-new-pass"
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
          <label for="reset-new-pass-confirm" class="form-label fw-bold small text-dark mb-1">
            Confirmar Nueva Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-check-circle"></i>
            </span>
            <input
              id="reset-new-pass-confirm"
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
          variant="primary"
          class="w-100 py-2 mt-3"
          :loading="loading"
          icon="fas fa-save"
        >
          Guardar Nueva Contraseña
        </BaseButton>

        <!-- Enlace para volver a inicio de sesión -->
        <div class="text-center mt-4 pt-3 border-top">
          <router-link to="/login" class="fw-semibold text-primary text-decoration-none small">
            <i class="fas fa-chevron-left me-1"></i> Cancelar y Volver al Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.text-primary-sena {
  color: #39A900;
}
.auth-card-logo {
  height: 80px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  transition: transform 0.25s ease;
  filter: drop-shadow(0 4px 10px rgba(57, 169, 0, 0.2));
}

.auth-card-logo:hover {
  transform: scale(1.05);
}
</style>
