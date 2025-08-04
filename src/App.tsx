import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useStudents } from './hooks/useStudents';
import { usePayments } from './hooks/usePayments';
import LoginPage from './components/LoginPage';
import StudentsPage from './components/StudentsPage';
import PaymentsPage from './components/PaymentsPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';

export interface Student {
  id: string;
  name: string;
  grade: string;
  type: string;
  lessonFee: number;
  dateAdded: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  recipient: string;
  grade: string;
  type: string;
}

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('students');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { students, loading: studentsLoading, addStudent, deleteStudent } = useStudents();
  const { payments, loading: paymentsLoading, addPayment, deletePayment } = usePayments(students);

  const handleLogout = () => {
    signOut();
    setCurrentPage('students');
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'students', name: 'إدارة الطلاب', icon: Users },
    { id: 'payments', name: 'تسجيل المدفوعات', icon: CreditCard },
    { id: 'reports', name: 'التقارير', icon: FileText },
    { id: 'settings', name: 'الإعدادات', icon: Settings },
  ];

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'students':
        return (
          <StudentsPage 
            students={students} 
            loading={studentsLoading}
            onAddStudent={(student) => addStudent(student)}
            onDeleteStudent={deleteStudent}
          />
        );
      case 'payments':
        return (
          <PaymentsPage 
            students={students}
            payments={payments}
            loading={paymentsLoading}
            onAddPayment={(payment) => addPayment(payment)}
            onDeletePayment={deletePayment}
          />
        );
      case 'reports':
        return <ReportsPage students={students} payments={payments} />;
      case 'settings':
        return (
          <SettingsPage 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">نظام إدارة الدروس</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 mt-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="ml-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-3">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="ml-3 h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="mr-4 text-2xl font-bold text-gray-800">
                {menuItems.find(item => item.id === currentPage)?.name}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              أ.علاء وأ.إبراهيم - إدارة الدروس
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;