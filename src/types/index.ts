export type AlertVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ToastNotification {
  id: string
  title?: string
  message: string
  variant: AlertVariant
  timeout?: number
}
