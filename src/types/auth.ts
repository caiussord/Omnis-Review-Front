export type Mode = 'login' | 'register'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  userName: string
  birth_Date: string
  password: string
}
