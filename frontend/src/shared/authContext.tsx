import { createContext, useContext } from 'react'

export type Me = {
  id: number
  username: string
  position: string | null
  is_admin: boolean | 0 | 1
}

type AuthContextValue = {
  me: Me | null
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  value,
  children,
}: {
  value: AuthContextValue
  children: React.ReactNode
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlatilishi kerak")
  return ctx
}
