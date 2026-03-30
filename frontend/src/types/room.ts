export interface ConfirmedRoom {
  id: string
  title: string
  accessPin: string
  adminToken: string
}

export interface EmailSentResponse {
  emailSent: true
  email: string
}