<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import type { ApiError } from '@/interfaces/ApiResponse'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

const validateForm = (): boolean => {
  fieldErrors.value = {}
  let isValid = true

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    fieldErrors.value.email = 'El correo electrónico es requerido.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    fieldErrors.value.email = 'Ingrese un correo electrónico válido.'
    isValid = false
  }

  if (!password.value) {
    fieldErrors.value.password = 'La contraseña es requerida.'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  errorMessage.value = ''
  if (!validateForm()) return

  loading.value = true
  try {
    const user = await authStore.login({
      email: email.value.trim(),
      password: password.value
    })

    notificationStore.addNotification(
      `Bienvenido(a), ${user.fullname}.`,
      'success',
      'Acceso Concedido'
    )
    router.push('/')
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'Error al iniciar sesión. Por favor intente de nuevo.'
    if (apiError?.fieldErrors?.email?.[0]) {
      fieldErrors.value.email = apiError.fieldErrors.email[0]
    }
    if (apiError?.fieldErrors?.password?.[0]) {
      fieldErrors.value.password = apiError.fieldErrors.password[0]
    }
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
        <div class="auth-icon-circle bg-primary-subtle text-primary mx-auto mb-3">
          <i class="fas fa-lock fa-lg"></i>
        </div>
        <h2 class="h4 fw-bold text-dark mb-1">Iniciar Sesión</h2>
        <p class="text-muted small mb-0">
          Ingrese sus credenciales para acceder a la plataforma REPOJ
        </p>
      </div>

      <!-- Alerta de error -->
      <AlertMessage
        v-if="errorMessage"
        variant="danger"
        :message="errorMessage"
        dismissible
        @dismiss="errorMessage = ''"
      />

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" novalidate>
        <BaseInput
          id="login-correo"
          v-model="email"
          label="Correo Electrónico"
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

        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <label for="login-password" class="form-label fw-bold small text-dark mb-0">
              Contraseña <span class="text-danger">*</span>
            </label>
            <router-link
              to="/recuperar-contrasena"
              class="small text-primary text-decoration-none fw-semibold"
              tabindex="-1"
            >
              ¿Olvidó su contraseña?
            </router-link>
          </div>

          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-key"></i>
            </span>
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': !!fieldErrors.password }"
              placeholder="••••••••"
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
            <div v-if="fieldErrors.password" class="invalid-feedback d-block">
              {{ fieldErrors.password }}
            </div>
          </div>
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          class="w-100 py-2 mt-2"
          :loading="loading"
          icon="fas fa-sign-in-alt"
        >
          Ingresar al Sistema
        </BaseButton>
      </form>

      <!-- Pie del formulario con enlace a registro -->
      <div class="text-center mt-4 pt-3 border-top">
        <p class="text-muted small mb-0">
          ¿Es instructor y aún no tiene cuenta?
          <router-link to="/registro" class="fw-bold text-primary text-decoration-none ms-1">
            Regístrese aquí
          </router-link>
        </p>
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
