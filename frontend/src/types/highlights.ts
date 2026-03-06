export interface Highlight {
  id: number
  userId: string | null
  roomId: string
  page: number
  content: string | null
  coords: {
    top: number
    left: number
    width: number
    height: number
    pageIndex: number
  }
  type: string
  createdAt: string
}