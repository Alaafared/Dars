import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Student } from '../App'

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (error) throw error

      const formattedStudents: Student[] = data.map(student => ({
        id: student.id.toString(),
        name: student.name,
        grade: student.grade,
        type: student.type,
        lessonFee: student.lesson_fee,
        dateAdded: student.date_added,
      }))

      setStudents(formattedStudents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الطلاب')
    } finally {
      setLoading(false)
    }
  }

  const addStudent = async (student: Omit<Student, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: student.name,
          grade: student.grade,
          type: student.type,
          lesson_fee: student.lessonFee,
          date_added: student.dateAdded,
        })
        .select()
        .single()

      if (error) throw error

      const newStudent: Student = {
        id: data.id.toString(),
        name: data.name,
        grade: data.grade,
        type: data.type,
        lessonFee: data.lesson_fee,
        dateAdded: data.date_added,
      }

      setStudents(prev => [...prev, newStudent])
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إضافة الطالب'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', parseInt(id))

      if (error) throw error

      setStudents(prev => prev.filter(student => student.id !== id))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف الطالب'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return {
    students,
    loading,
    error,
    addStudent,
    deleteStudent,
    refetch: fetchStudents,
  }
}