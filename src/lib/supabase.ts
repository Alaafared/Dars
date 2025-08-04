import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number
          name: string
          grade: string
          type: string
          lesson_fee: number
          date_added: string
          created_at: string
        }
        Insert: {
          name: string
          grade: string
          type: string
          lesson_fee: number
          date_added: string
        }
        Update: {
          name?: string
          grade?: string
          type?: string
          lesson_fee?: number
          date_added?: string
        }
      }
      payments: {
        Row: {
          id: number
          student_id: number
          payment_date: string
          amount: number
          receiver: string
          created_at: string
        }
        Insert: {
          student_id: number
          payment_date: string
          amount: number
          receiver: string
        }
        Update: {
          student_id?: number
          payment_date?: string
          amount?: number
          receiver?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'teacher'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'teacher'
        }
        Update: {
          email?: string
          full_name?: string | null
          role?: 'admin' | 'teacher'
        }
      }
    }
  }
}