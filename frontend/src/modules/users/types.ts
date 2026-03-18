export type ApiUser = {
  id: number
  username: string
  position?: string | null
  is_admin?: boolean
  is_active?: boolean
}

export type CreateUserForm = {
  username: string
  password: string
  confirmPassword: string
  position: string
}

export type EditUserForm = {
  username: string
  password: string
  confirmPassword: string
  showPassword: boolean
  showPasswordConfirm: boolean
}

export type StatusMessage = {
  kind: 'ok' | 'err'
  msg: string
}
