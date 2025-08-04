/*
  # إنشاء نظام إدارة تحصيل دفعات الدروس

  1. الجداول الجديدة
    - `students` - جدول الطلاب
      - `id` (bigint, primary key)
      - `name` (text) - اسم الطالب
      - `grade` (text) - الصف
      - `type` (text) - النوعية
      - `lesson_fee` (numeric) - قيمة الدرس
      - `date_added` (date) - تاريخ الإضافة
      - `created_at` (timestamptz) - تاريخ الإنشاء

    - `payments` - جدول المدفوعات
      - `id` (bigint, primary key)
      - `student_id` (bigint, foreign key) - معرف الطالب
      - `payment_date` (date) - تاريخ الدفع
      - `amount` (numeric) - المبلغ
      - `receiver` (text) - المستلم
      - `created_at` (timestamptz) - تاريخ الإنشاء

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات للمستخدمين المصرح لهم
*/

-- إنشاء جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  grade text NOT NULL,
  type text NOT NULL,
  lesson_fee numeric NOT NULL,
  date_added date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id bigserial PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount numeric NOT NULL,
  receiver text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للطلاب
CREATE POLICY "Authenticated users can view students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- سياسات الأمان للمدفوعات
CREATE POLICY "Authenticated users can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_type ON students(type);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_receiver ON payments(receiver);