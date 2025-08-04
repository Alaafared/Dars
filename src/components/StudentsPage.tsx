import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Users, Trash2, Download, UserPlus, Loader2 } from 'lucide-react';
import { Student } from '../App';

interface StudentsPageProps {
  students: Student[];
  loading: boolean;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentsPage: React.FC<StudentsPageProps> = ({ students, loading, onAddStudent, onDeleteStudent }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    type: '',
    lessonFee: '',
    dateAdded: new Date().toISOString().split('T')[0]
  });

  // Bulk add form states
  const [bulkData, setBulkData] = useState({
    grade: '',
    type: '',
    lessonFee: '',
    students: ''
  });

  const grades = ['الأول', 'الثاني', 'الثالث'];
  const types = ['جدارات عام', 'تعليم مزدوج', 'معهد فني صناعي'];

  const filteredStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = !selectedGrade || student.grade === selectedGrade;
      const matchesType = !selectedType || student.type === selectedType;
      return matchesSearch && matchesGrade && matchesType;
    });

    // Sort students
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'dateAdded':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'grade':
          return a.grade.localeCompare(b.grade, 'ar');
        case 'type':
          return a.type.localeCompare(b.type, 'ar');
        default:
          return 0;
      }
    });

    return filtered;
  }, [students, searchQuery, selectedGrade, selectedType, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const result = await onAddStudent({
      name: formData.name,
      grade: formData.grade,
      type: formData.type,
      lessonFee: parseFloat(formData.lessonFee),
      dateAdded: formData.dateAdded
    });
    
    if (result?.success !== false) {
      setFormData({
        name: '',
        grade: '',
        type: '',
        lessonFee: '',
        dateAdded: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    }
    
    setSubmitting(false);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const studentNames = bulkData.students.split('\n').filter(name => name.trim());
    
    for (const name of studentNames) {
      await onAddStudent({
        name: name.trim(),
        grade: bulkData.grade,
        type: bulkData.type,
        lessonFee: parseFloat(bulkData.lessonFee),
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    setBulkData({
      grade: '',
      type: '',
      lessonFee: '',
      students: ''
    });
    setShowBulkAdd(false);
    setSubmitting(false);
  };

  const exportStudents = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الاسم,الصف,النوعية,قيمة الدرس,تاريخ الإضافة\n" +
      filteredStudents.map(student => 
        `${student.name},${student.grade},${student.type},${student.lessonFee},${student.dateAdded}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">إجمالي الطلاب</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        
        {grades.map(grade => (
          <div key={grade} className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">الصف {grade}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {students.filter(s => s.grade === grade).length}
                </p>
              </div>
            </div>
          </div>
        ))}
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">ترتيب حسب الاسم</option>
                <option value="dateAdded">ترتيب حسب التاريخ</option>
                <option value="grade">ترتيب حسب الصف</option>
                <option value="type">ترتيب حسب النوعية</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={exportStudents}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              تصدير
            </button>
            <button
              onClick={() => setShowBulkAdd(true)}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              إضافة جماعية
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              إضافة طالب
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600 ml-2" />
            <span className="text-sm sm:text-base text-gray-600">جاري تحميل الطلاب...</span>
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
                  قيمة الدرس
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {student.grade}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {student.type}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {student.lessonFee} ج.م
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {new Date(student.dateAdded).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
                          onDeleteStudent(student.id);
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

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة طالب جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="اسم الطالب"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر الصف</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر النوعية</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="قيمة دفع الدرس"
                value={formData.lessonFee}
                onChange={(e) => setFormData({...formData, lessonFee: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="date"
                value={formData.dateAdded}
                onChange={(e) => setFormData({...formData, dateAdded: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
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

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة طلاب جماعية</h3>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <select
                value={bulkData.grade}
                onChange={(e) => setBulkData({...bulkData, grade: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر الصف</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              <select
                value={bulkData.type}
                onChange={(e) => setBulkData({...bulkData, type: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر النوعية</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="قيمة دفع الدرس"
                value={bulkData.lessonFee}
                onChange={(e) => setBulkData({...bulkData, lessonFee: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="أسماء الطلاب (كل اسم في سطر منفصل)"
                value={bulkData.students}
                onChange={(e) => setBulkData({...bulkData, students: e.target.value})}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                required
              />
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
                    'إضافة الطلاب'
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowBulkAdd(false)}
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

export default StudentsPage;