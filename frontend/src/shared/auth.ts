import { API_URL } from '../config/env'

export type CurrentUser = {
  id: number
  username: string
  position?: string | null
  is_admin: boolean
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event('auth:changed'))
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

export async function logout() {
  await fetch(`${API_URL}/users/logout`, { method: 'POST', credentials: 'include' })
  notifyAuthChanged()
}

