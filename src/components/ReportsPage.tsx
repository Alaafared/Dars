import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, Calendar, User, GraduationCap, Building, Filter } from 'lucide-react';
import { Student, Payment } from '../App';

interface ReportsPageProps {
  students: Student[];
  payments: Payment[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ students, payments }) => {
  const [reportType, setReportType] = useState('student');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const grades = ['الأول', 'الثاني', 'الثالث'];
  const types = ['جدارات عام', 'تعليم مزدوج', 'معهد فني صناعي'];
  const recipients = ['أ.علاء', 'أ.إبراهيم'];

  const reportData = useMemo(() => {
    let filteredPayments = [...payments];
    let title = '';
    let summary: any = {};

    switch (reportType) {
      case 'student':
        if (selectedStudent) {
          filteredPayments = payments.filter(p => p.studentId === selectedStudent);
          const student = students.find(s => s.id === selectedStudent);
          title = `تقرير الطالب: ${student?.name || ''}`;
          summary = {
            totalPayments: filteredPayments.length,
            totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
            averagePayment: filteredPayments.length > 0 ? filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length : 0
          };
        }
        break;

      case 'grade':
        if (selectedGrade) {
          filteredPayments = payments.filter(p => p.grade === selectedGrade);
          title = `تقرير الصف ${selectedGrade}`;
          const gradeStudents = students.filter(s => s.grade === selectedGrade);
          summary = {
            totalStudents: gradeStudents.length,
            studentsWithPayments: new Set(filteredPayments.map(p => p.studentId)).size,
            totalPayments: filteredPayments.length,
            totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0)
          };
        }
        break;

      case 'type':
        if (selectedType) {
          filteredPayments = payments.filter(p => p.type === selectedType);
          title = `تقرير ${selectedType}`;
          const typeStudents = students.filter(s => s.type === selectedType);
          summary = {
            totalStudents: typeStudents.length,
            studentsWithPayments: new Set(filteredPayments.map(p => p.studentId)).size,
            totalPayments: filteredPayments.length,
            totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0)
          };
        }
        break;

      case 'recipient':
        if (selectedRecipient) {
          filteredPayments = payments.filter(p => p.recipient === selectedRecipient);
          title = `تقرير ${selectedRecipient}`;
          summary = {
            totalPayments: filteredPayments.length,
            totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
            uniqueStudents: new Set(filteredPayments.map(p => p.studentId)).size
          };
        }
        break;

      case 'date':
        if (startDate && endDate) {
          filteredPayments = payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
          });
          title = `تقرير الفترة من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`;
          summary = {
            totalPayments: filteredPayments.length,
            totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
            uniqueStudents: new Set(filteredPayments.map(p => p.studentId)).size,
            alaaPayments: filteredPayments.filter(p => p.recipient === 'أ.علاء').reduce((sum, p) => sum + p.amount, 0),
            ibrahimPayments: filteredPayments.filter(p => p.recipient === 'أ.إبراهيم').reduce((sum, p) => sum + p.amount, 0)
          };
        }
        break;
    }

    return { filteredPayments, title, summary };
  }, [reportType, selectedStudent, selectedGrade, selectedType, selectedRecipient, startDate, endDate, payments, students]);

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>${reportData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-item { display: inline-block; margin: 10px 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            th { background-color: #e9ecef; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.title}</h1>
            <p>نظام إدارة الدروس - أ.علاء وأ.إبراهيم</p>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          
          <div class="summary">
            <h3>ملخص التقرير</h3>
            ${Object.entries(reportData.summary).map(([key, value]) => {
              const labels: { [key: string]: string } = {
                totalPayments: 'إجمالي المدفوعات',
                totalAmount: 'إجمالي المبلغ',
                totalStudents: 'إجمالي الطلاب',
                studentsWithPayments: 'الطلاب الذين دفعوا',
                uniqueStudents: 'عدد الطلاب',
                averagePayment: 'متوسط الدفعة',
                alaaPayments: 'مدفوعات أ.علاء',
                ibrahimPayments: 'مدفوعات أ.إبراهيم'
              };
              return `<div class="summary-item"><strong>${labels[key]}:</strong> ${typeof value === 'number' && key.includes('Amount') || key.includes('Payments') && key !== 'totalPayments' ? value + ' ج.م' : value}</div>`;
            }).join('')}
          </div>

          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>الصف</th>
                <th>النوعية</th>
                <th>المبلغ</th>
                <th>تاريخ الدفع</th>
                <th>المستلم</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.filteredPayments.map(payment => `
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
          
          <div class="footer">
            <p>هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة الدروس</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      `${reportData.title}\n` +
      `تاريخ التقرير,${new Date().toLocaleDateString('ar-EG')}\n\n` +
      "اسم الطالب,الصف,النوعية,المبلغ,تاريخ الدفع,المستلم\n" +
      reportData.filteredPayments.map(payment => 
        `${payment.studentName},${payment.grade},${payment.type},${payment.amount},${payment.date},${payment.recipient}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerateReport = () => {
    switch (reportType) {
      case 'student':
        return !!selectedStudent;
      case 'grade':
        return !!selectedGrade;
      case 'type':
        return !!selectedType;
      case 'recipient':
        return !!selectedRecipient;
      case 'date':
        return !!startDate && !!endDate;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">نوع التقرير</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <button
            onClick={() => {
              setReportType('student');
              setShowFilters(true);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
              reportType === 'student' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-0 sm:ml-2" />
            تقرير الطالب
          </button>
          
          <button
            onClick={() => {
              setReportType('grade');
              setShowFilters(true);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
              reportType === 'grade' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-0 sm:ml-2" />
            تقرير الصف
          </button>
          
          <button
            onClick={() => {
              setReportType('type');
              setShowFilters(true);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
              reportType === 'type' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Building className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-0 sm:ml-2" />
            تقرير النوعية
          </button>
          
          <button
            onClick={() => {
              setReportType('recipient');
              setShowFilters(true);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
              reportType === 'recipient' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-0 sm:ml-2" />
            تقرير المستلم
          </button>
          
          <button
            onClick={() => {
              setReportType('date');
              setShowFilters(true);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
              reportType === 'date' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-0 sm:ml-2" />
            تقرير التاريخ
          </button>
        </div>
      </div>

      {/* Report Parameters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">معايير التقرير</h3>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center px-3 py-1 bg-gray-100 rounded-lg text-sm"
          >
            <Filter className="h-4 w-4 ml-1" />
            {showFilters ? 'إخفاء' : 'عرض'}
          </button>
        </div>
        
        <div className={`${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {reportType === 'student' && (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر الطالب</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.grade} - {student.type}
                  </option>
                ))}
              </select>
            )}

            {reportType === 'grade' && (
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر الصف</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            )}

            {reportType === 'type' && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر النوعية</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            {reportType === 'recipient' && (
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر المستلم</option>
                {recipients.map(recipient => (
                  <option key={recipient} value={recipient}>{recipient}</option>
                ))}
              </select>
            )}

            {reportType === 'date' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="من تاريخ"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="إلى تاريخ"
                />
              </>
            )}
          </div>

          {canGenerateReport() && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center justify-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="h-4 w-4 ml-1" />
                طباعة PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center justify-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 ml-1" />
                تصدير Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Display */}
      {canGenerateReport() && reportData.filteredPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-0">{reportData.title}</h3>
            <span className="text-xs sm:text-sm text-gray-500">
              تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}
            </span>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">ملخص التقرير</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {Object.entries(reportData.summary).map(([key, value]) => {
                const labels: { [key: string]: string } = {
                  totalPayments: 'إجمالي المدفوعات',
                  totalAmount: 'إجمالي المبلغ',
                  totalStudents: 'إجمالي الطلاب',
                  studentsWithPayments: 'الطلاب الذين دفعوا',
                  uniqueStudents: 'عدد الطلاب',
                  averagePayment: 'متوسط الدفعة',
                  alaaPayments: 'مدفوعات أ.علاء',
                  ibrahimPayments: 'مدفوعات أ.إبراهيم'
                };
                return (
                  <div key={key} className="text-center p-1 sm:p-2">
                    <p className="text-xs sm:text-sm text-gray-600">{labels[key]}</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      {typeof value === 'number' && (key.includes('Amount') || key.includes('Payments') && key !== 'totalPayments') 
                        ? `${value} ج.م` 
                        : value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الصف
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوعية
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الدفع
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستلم
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.filteredPayments.map((payment) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canGenerateReport() && reportData.filteredPayments.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">لا توجد بيانات للعرض</h3>
          <p className="text-xs sm:text-sm text-gray-500">لا توجد مدفوعات تطابق المعايير المحددة</p>
        </div>
      )}

      {!canGenerateReport() && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">اختر معايير التقرير</h3>
          <p className="text-xs sm:text-sm text-gray-500">يرجى اختيار نوع التقرير وتحديد المعايير المطلوبة</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;