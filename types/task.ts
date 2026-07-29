export interface Task {
  id: string
  title: string
  completed: boolean
  order: number
  createdAt: Date
  completedAt?: Date
  pomodoros?: number
}
