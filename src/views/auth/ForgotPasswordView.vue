<script setup lang="ts">
import { ref } from 'vue'
import authService from '@/services/authService'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import type { ApiError } from '@/interfaces/ApiResponse'

const email = ref('')
const emailSent = ref(false)
const sentToEmail = ref('')
const loading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

const handleRequestReset = async () => {
  fieldErrors.value = {}
  errorMessage.value = ''

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
    await authService.forgotPassword({ email: trimmedEmail })
    sentToEmail.value = trimmedEmail
    emailSent.value = true
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'No se pudo procesar la solicitud para el correo ingresado.'
  } finally {
    loading.value = false
  }
}

const handleRetry = () => {
  emailSent.value = false
  errorMessage.value = ''
  fieldErrors.value = {}
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
        <h2 class="h4 fw-bold text-dark mb-1">Recuperar Contraseña</h2>
        <p class="text-muted small mb-0">
          {{
            !emailSent
              ? 'Ingrese su correo electrónico institucional para enviarle el enlace de restablecimiento'
              : 'Verifique su bandeja de entrada para continuar con el cambio de clave'
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

      <!-- Formulario de Solicitud de Correo -->
      <form v-if="!emailSent" @submit.prevent="handleRequestReset" novalidate>
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
          Enviar Enlace de Recuperación
        </BaseButton>
      </form>

      <!-- Mensaje de éxito tras enviar el correo -->
      <div v-else class="text-center py-2">
        <div class="mb-3 text-success">
          <i class="fas fa-envelope-circle-check fa-4x text-primary-sena"></i>
        </div>
        <h3 class="h5 fw-bold text-dark mb-2">¡Correo Enviado!</h3>
        <p class="text-muted small mb-3">
          Hemos enviado un correo electrónico a <strong>{{ sentToEmail }}</strong> con un botón y un enlace para que pueda crear su nueva contraseña.
        </p>

        <div class="alert alert-warning py-2 px-3 text-start small mb-4 rounded-3 border-0 bg-opacity-75">
          <i class="fas fa-clock text-warning me-1"></i>
          <strong>Importante:</strong> El enlace generado es para <strong>uso único</strong> y expirará en <strong>1 hora</strong> por motivos de seguridad.
        </div>

        <p class="text-muted extra-small mb-3" style="font-size: 11.5px;">
          ¿No recibió el correo? Revise su carpeta de <em>Spam</em> o Correo no deseado, o puede solicitar un nuevo enlace.
        </p>

        <button
          type="button"
          class="btn btn-outline-secondary btn-sm w-100 mb-2"
          @click="handleRetry"
        >
          <i class="fas fa-redo me-1"></i> Intentar con otro correo
        </button>
      </div>

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

<style scoped>
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
