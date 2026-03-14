import { API_URL } from '../config/env'

export function notifyAuthChanged() {
  window.dispatchEvent(new Event('auth:changed'))
}

export async function logout() {
  await fetch(`${API_URL}/users/logout`, { method: 'POST', credentials: 'include' })
  notifyAuthChanged()
}

