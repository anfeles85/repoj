import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastNotification, AlertVariant } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<ToastNotification[]>([])

  const addNotification = (
    message: string,
    variant: AlertVariant = 'info',
    title?: string,
    timeout: number = 4000
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const toast: ToastNotification = { id, message, variant, title, timeout }
    notifications.value.push(toast)

    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, timeout)
    }
  }

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }
})
