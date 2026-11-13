import type { DesktopAPI } from '../shared/records'

declare global {
  interface Window {
    api: DesktopAPI
  }
}

export {}
