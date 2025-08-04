import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Payment, Student } from '../App'

export function usePayments(students: Student[]) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students (
            name,
            grade,
            type
          )
        `)
        .order('payment_date', { ascending: false })

      if (error) throw error

      const formattedPayments: Payment[] = data.map(payment => ({
        id: payment.id.toString(),
        studentId: payment.student_id.toString(),
        studentName: payment.students.name,
        amount: payment.amount,
        date: payment.payment_date,
        recipient: payment.receiver,
        grade: payment.students.grade,
        type: payment.students.type,
      }))

      setPayments(formattedPayments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المدفوعات')
    } finally {
      setLoading(false)
    }
  }

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          student_id: parseInt(payment.studentId),
          payment_date: payment.date,
          amount: payment.amount,
          receiver: payment.recipient,
        })
        .select(`
          *,
          students (
            name,
            grade,
            type
          )
        `)
        .single()

      if (error) throw error

      const newPayment: Payment = {
        id: data.id.toString(),
        studentId: data.student_id.toString(),
        studentName: data.students.name,
        amount: data.amount,
        date: data.payment_date,
        recipient: data.receiver,
        grade: data.students.grade,
        type: data.students.type,
      }

      setPayments(prev => [newPayment, ...prev])
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إضافة المدفوعة'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', parseInt(id))

      if (error) throw error

      setPayments(prev => prev.filter(payment => payment.id !== id))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف المدفوعة'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    if (students.length > 0) {
      fetchPayments()
    }
  }, [students])

  return {
    payments,
    loading,
    error,
    addPayment,
    deletePayment,
    refetch: fetchPayments,
  }
}