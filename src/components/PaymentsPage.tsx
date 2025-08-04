import React, { useState, useMemo } from 'react';
import { Plus, Search, CreditCard, Trash2, Receipt, Download, Loader2, Filter } from 'lucide-react';
import { Student, Payment } from '../App';

interface PaymentsPageProps {
  students: Student[];
  payments: Payment[];
  loading: boolean;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ 
  students, 
  payments, 
  loading,
  onAddPayment, 
  onDeletePayment 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    grade: '',
    studentId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recipient: ''
  });

  const grades = ['الأول', 'الثاني', 'الثالث'];
  const types = ['جدارات عام', 'تعليم مزدوج', 'معهد فني صناعي'];
  const recipients = ['أ.علاء', 'أ.إبراهيم'];

  // Get students for selected grade
  const availableStudents = useMemo(() => {
    return students.filter(student => 
      !formData.grade || student.grade === formData.grade
    );
  }, [students, formData.grade]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = payment.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = !selectedGrade || payment.grade === selectedGrade;
      const matchesType = !selectedType || payment.type === selectedType;
      const matchesRecipient = !selectedRecipient || payment.recipient === selectedRecipient;
      const matchesDate = !dateFilter || payment.date === dateFilter;
      
      return matchesSearch && matchesGrade && matchesType && matchesRecipient && matchesDate;
    });
  }, [payments, searchQuery, selectedGrade, selectedType, selectedRecipient, dateFilter]);

  // Calculate statistics
  const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const alaaPayments = filteredPayments.filter(p => p.recipient === 'أ.علاء').reduce((sum, p) => sum + p.amount, 0);
  const ibrahimPayments = filteredPayments.filter(p => p.recipient === 'أ.إبراهيم').reduce((sum, p) => sum + p.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const selectedStudent = students.find(s => s.id === formData.studentId);
    if (!selectedStudent) {
      setSubmitting(false);
      return;
    }

    const result = await onAddPayment({
      studentId: formData.studentId,
      studentName: selectedStudent.name,
      amount: parseFloat(formData.amount),
      date: formData.date,
      recipient: formData.recipient,
      grade: selectedStudent.grade,
      type: selectedStudent.type
    });

    if (result?.success !== false) {
      setFormData({
        grade: '',
        studentId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        recipient: ''
      });
      setShowAddForm(false);
    }
    
    setSubmitting(false);
  };

  const printPayments = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>تقرير المدفوعات</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير المدفوعات</h1>
            <p>نظام إدارة الدروس - أ.علاء وأ.إبراهيم</p>
          </div>
          <div class="summary">
            <p><strong>إجمالي المدفوعات:</strong> ${totalPayments} ج.م</p>
            <p><strong>مدفوعات أ.علاء:</strong> ${alaaPayments} ج.م</p>
            <p><strong>مدفوعات أ.إبراهيم:</strong> ${ibrahimPayments} ج.م</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>الصف</th>
                <th>النوعية</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>المستلم</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(payment => `
                <tr>
                  <td>${payment.studentName}</td>
                  <td>${payment.grade}</td>
                  <td>${payment.type}</td>
                  <td>${payment.amount} ج.م</td>
                  <td>${new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                  <td>${payment.recipient}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const exportPayments = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "اسم الطالب,الصف,النوعية,المبلغ,التاريخ,المستلم\n" +
      filteredPayments.map(payment => 
        `${payment.studentName},${payment.grade},${payment.type},${payment.amount},${payment.date},${payment.recipient}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">إجمالي المدفوعات</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalPayments} ج.م</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">مدفوعات أ.علاء</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{alaaPayments} ج.م</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">مدفوعات أ.إبراهيم</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{ibrahimPayments} ج.م</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Search and Filter Button for Mobile */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center px-3 py-2 bg-gray-100 rounded-lg"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Filters - Hidden on mobile unless toggled */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الصفوف</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع النوعيات</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع المستلمين</option>
                {recipients.map(recipient => (
                  <option key={recipient} value={recipient}>{recipient}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={exportPayments}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              تصدير
            </button>
            <button
              onClick={printPayments}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              طباعة
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              إضافة دفعة
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600 ml-2" />
            <span className="text-sm sm:text-base text-gray-600">جاري تحميل المدفوعات...</span>
          </div>
        )}
        
        {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الطالب
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الصف
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوعية
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستلم
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {payment.studentName}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {payment.grade}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {payment.type}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                    {payment.amount} ج.م
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {payment.recipient}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
                          onDeletePayment(payment.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md mx-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة دفعة جديدة</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value, studentId: ''})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر الصف</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.grade}
              >
                <option value="">اختر الطالب</option>
                {availableStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.type}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="قيمة الدفعة"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <select
                value={formData.recipient}
                onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر المستلم</option>
                {recipients.map(recipient => (
                  <option key={recipient} value={recipient}>{recipient}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري الإضافة...
                    </>
                  ) : (
                    'إضافة'
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;