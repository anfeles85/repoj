import { useNotificationStore } from '@/stores/notificationStore'

export function useNotification() {
  const store = useNotificationStore()

  const notifySuccess = (message: string, title: string = 'Éxito', timeout = 4000) => {
    store.addNotification(message, 'success', title, timeout)
  }

  const notifyError = (message: string, title: string = 'Error', timeout = 6000) => {
    store.addNotification(message, 'danger', title, timeout)
  }

  const notifyWarning = (message: string, title: string = 'Advertencia', timeout = 5000) => {
    store.addNotification(message, 'warning', title, timeout)
  }

  const notifyInfo = (message: string, title: string = 'Información', timeout = 4000) => {
    store.addNotification(message, 'info', title, timeout)
  }

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo
  }
}
