export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          completed: boolean
          order: number
          created_at: string
          user_id: string
          pomodoros: number | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          completed?: boolean
          order: number
          created_at?: string
          user_id: string
          pomodoros?: number | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          completed?: boolean
          order?: number
          created_at?: string
          user_id?: string
          pomodoros?: number | null
          completed_at?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          start_time: string
          duration: number
          mode: string
          note: string | null
          tags: string[] | null
          task_id: string | null
          task_title: string | null
          user_id: string
        }
        Insert: {
          id?: string
          start_time: string
          duration: number
          mode: string
          note?: string | null
          tags?: string[] | null
          task_id?: string | null
          task_title?: string | null
          user_id: string
        }
        Update: {
          id?: string
          start_time?: string
          duration?: number
          mode?: string
          note?: string | null
          tags?: string[] | null
          task_id?: string | null
          task_title?: string | null
          user_id?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          pomodoro_time: number
          short_break_time: number
          long_break_time: number
          pomodoro_goal: number
          workout_gifs: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pomodoro_time: number
          short_break_time: number
          long_break_time: number
          pomodoro_goal: number
          workout_gifs: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pomodoro_time?: number
          short_break_time?: number
          long_break_time?: number
          pomodoro_goal?: number
          workout_gifs?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
