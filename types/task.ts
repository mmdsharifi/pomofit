export interface Task {
  id: string
  title: string
  completed: boolean
  order: number
  createdAt: Date
  pomodoros?: number
}
