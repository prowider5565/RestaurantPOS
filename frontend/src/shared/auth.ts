import { API_URL } from '../config/env'

const ACCESS_TOKEN_KEY = 'access_token'

export type CurrentUser = {
  id: number
  username: string
  position?: string | null
  is_admin: boolean
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  notifyAuthChanged()
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  notifyAuthChanged()
}

export function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event('auth:changed'))
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API_URL}/users/me`, { headers: getAuthHeaders() })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("Joriy foydalanuvchini olishda xatolik:", error)
    return null
  }
}

export async function logout() {
  clearAccessToken()
  await fetch(`${API_URL}/users/logout`, { method: 'POST' })
}
