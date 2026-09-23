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

const fullname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

const validateForm = (): boolean => {
  fieldErrors.value = {}
  let isValid = true

  const trimmedName = fullname.value.trim()
  if (!trimmedName) {
    fieldErrors.value.fullname = 'El nombre completo es requerido.'
    isValid = false
  } else if (trimmedName.length < 3) {
    fieldErrors.value.fullname = 'El nombre debe tener al menos 3 caracteres.'
    isValid = false
  }

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
  } else if (password.value.length < 6) {
    fieldErrors.value.password = 'La contraseña debe tener al menos 6 caracteres.'
    isValid = false
  }

  if (!passwordConfirmation.value) {
    fieldErrors.value.passwordConfirmation = 'Confirme su contraseña.'
    isValid = false
  } else if (password.value !== passwordConfirmation.value) {
    fieldErrors.value.passwordConfirmation = 'Las contraseñas no coinciden.'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  errorMessage.value = ''
  if (!validateForm()) return

  loading.value = true
  try {
    const newUser = await authStore.registerInstructor({
      fullname: fullname.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value
    })

    notificationStore.addNotification(
      `Registro exitoso. ¡Bienvenido a REPOJ, ${newUser.fullname}!`,
      'success',
      'Cuenta de Instructor Creada'
    )
    router.push('/')
  } catch (err: unknown) {
    const apiError = err as ApiError
    errorMessage.value =
      apiError?.message || 'Error al completar el registro. Por favor verifique los datos.'
    if (apiError?.fieldErrors?.email?.[0]) {
      fieldErrors.value.email = apiError.fieldErrors.email[0]
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
        <div class="mb-3">
          <img src="/logo_repoj.png" alt="Logo REPOJ" class="auth-card-logo" />
        </div>
        <h2 class="h4 fw-bold text-dark mb-1">Registro de Instructor</h2>
        <p class="text-muted small mb-2">
          Cree su cuenta para gestionar grupos, archivos e informes de fichas
        </p>
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1">
          <i class="fas fa-info-circle me-1"></i> Rol asignado: Instructor
        </span>
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
      <form @submit.prevent="handleRegister" novalidate>
        <BaseInput
          id="reg-nombre"
          v-model="fullname"
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez"
          :error="fieldErrors.fullname"
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
          id="reg-correo"
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
          <label for="reg-password" class="form-label fw-bold small text-dark mb-1">
            Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-key"></i>
            </span>
            <input
              id="reg-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': !!fieldErrors.password }"
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
            <div v-if="fieldErrors.password" class="invalid-feedback d-block">
              {{ fieldErrors.password }}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="reg-password-confirm" class="form-label fw-bold small text-dark mb-1">
            Confirmar Contraseña <span class="text-danger">*</span>
          </label>
          <div class="input-group has-validation">
            <span class="input-group-text bg-light text-muted">
              <i class="fas fa-check-circle"></i>
            </span>
            <input
              id="reg-password-confirm"
              v-model="passwordConfirmation"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': !!fieldErrors.passwordConfirmation }"
              placeholder="Repita su contraseña"
              :disabled="loading"
              required
            />
            <div v-if="fieldErrors.passwordConfirmation" class="invalid-feedback d-block">
              {{ fieldErrors.passwordConfirmation }}
            </div>
          </div>
        </div>

        <BaseButton
          type="submit"
          variant="success"
          class="w-100 py-2 mt-2"
          :loading="loading"
          icon="fas fa-user-plus"
        >
          Crear Cuenta de Instructor
        </BaseButton>
      </form>

      <!-- Enlace para volver a inicio de sesión -->
      <div class="text-center mt-4 pt-3 border-top">
        <p class="text-muted small mb-0">
          ¿Ya tiene una cuenta registrada?
          <router-link to="/login" class="fw-bold text-primary text-decoration-none ms-1">
            Iniciar Sesión
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

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
