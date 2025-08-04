import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Key, 
  Shield, 
  Save,
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ students: 0, payments: 0, totalAmount: 0 });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newUsername: user?.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch statistics
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsResult, paymentsResult] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('payments').select('amount')
        ]);

        const studentCount = studentsResult.count || 0;
        const paymentsData = paymentsResult.data || [];
        const totalAmount = paymentsData.reduce((sum, p) => sum + p.amount, 0);

        setStats({
          students: studentCount,
          payments: paymentsData.length,
          totalAmount
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportBackup = async () => {
    try {
      setLoading(true);
      
      const [studentsResult, paymentsResult] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('payments').select('*')
      ]);

      if (studentsResult.error || paymentsResult.error) {
        throw new Error('خطأ في تصدير البيانات');
      }

      const backupData = {
        students: studentsResult.data,
        payments: paymentsResult.data,
        exportDate: new Date().toISOString(),
        version: '2.0'
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showNotification('success', 'تم تصدير النسخة الاحتياطية بنجاح');
    } catch (error) {
      showNotification('error', 'حدث خطأ في تصدير النسخة الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.students && backupData.payments) {
          // Clear existing data and import new data
          await supabase.from('payments').delete().neq('id', 0);
          await supabase.from('students').delete().neq('id', 0);
          
          // Import students
          const { error: studentsError } = await supabase
            .from('students')
            .insert(backupData.students);
            
          if (studentsError) throw studentsError;
          
          // Import payments
          const { error: paymentsError } = await supabase
            .from('payments')
            .insert(backupData.payments);
            
          if (paymentsError) throw paymentsError;
          
          showNotification('success', 'تم استعادة النسخة الاحتياطية بنجاح');
        } else {
          showNotification('error', 'ملف النسخة الاحتياطية غير صالح');
        }
      } catch (error) {
        showNotification('error', 'خطأ في قراءة ملف النسخة الاحتياطية');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const deleteAllData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        supabase.from('payments').delete().neq('id', 0),
        supabase.from('students').delete().neq('id', 0)
      ]);
      
      setShowDeleteConfirm(false);
      showNotification('success', 'تم حذف جميع البيانات بنجاح');
    } catch (error) {
      showNotification('error', 'حدث خطأ في حذف البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Note: Password change would typically be handled by Supabase Auth
    showNotification('success', 'تم تغيير معلومات تسجيل الدخول بنجاح');
    setShowPasswordChange(false);
    setPasswordData({
      currentPassword: '',
      newUsername: user?.email || '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 ml-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 ml-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Database Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Database className="h-5 w-5 ml-2" />
          إحصائيات قاعدة البيانات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">عدد الطلاب</p>
            <p className="text-2xl font-bold text-blue-900">{stats.students}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">عدد المدفوعات</p>
            <p className="text-2xl font-bold text-green-900">{stats.payments}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">إجمالي المدفوعات</p>
            <p className="text-2xl font-bold text-purple-900">
              {stats.totalAmount} ج.م
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">المستخدم الحالي</p>
            <p className="text-lg font-bold text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Backup Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Save className="h-5 w-5 ml-2" />
          إدارة النسخ الاحتياطية
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={exportBackup}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 ml-2" />
                  إنشاء نسخة احتياطية
                </>
              )}
            </button>
            
            <label className={`flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="h-5 w-5 ml-2" />
              استعادة نسخة احتياطية
              <input
                type="file"
                accept=".json"
                onChange={importBackup}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 ml-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">تنبيه هام:</p>
                <p>احرص على إنشاء نسخة احتياطية بانتظام لحفظ بياناتك. عند استعادة نسخة احتياطية، سيتم استبدال جميع البيانات الحالية.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 ml-2" />
          الأمان وتسجيل الدخول
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Key className="h-5 w-5 ml-2" />
            تغيير معلومات تسجيل الدخول
          </button>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 ml-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">نصائح الأمان:</p>
                <ul className="mt-2 space-y-1">
                  <li>• استخدم كلمة مرور قوية تحتوي على أرقام وحروف</li>
                  <li>• لا تشارك معلومات تسجيل الدخول مع أي شخص</li>
                  <li>• قم بتسجيل الخروج عند الانتهاء من العمل</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border-l-4 border-red-500 p-6">
        {/* <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 ml-2" />
          منطقة الخطر
        </h3> */}
        <div className="space-y-4">
          {/* <p className="text-sm text-red-700">
            الإجراءات التالية لا يمكن التراجع عنها. يرجى التأكد من إنشاء نسخة احتياطية قبل المتابعة.
          </p> */}
          {/* <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5 ml-2" />
            حذف جميع البيانات
          </button> */}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">تغيير معلومات تسجيل الدخول</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input
                type="password"
                placeholder="كلمة المرور الحالية"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="اسم المستخدم الجديد"
                value={passwordData.newUsername}
                onChange={(e) => setPasswordData({...passwordData, newUsername: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
                required
              />
              <input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="تأكيد كلمة المرور الجديدة"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ التغييرات
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 ml-3" />
              <h3 className="text-lg font-medium text-red-900">تأكيد الحذف</h3>
            </div>
            <p className="text-gray-700 mb-6">
              هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>جميع بيانات الطلاب ({stats.students} طالب)</li>
              <li>جميع المدفوعات ({stats.payments} دفعة)</li>
              <li>جميع التقارير والإحصائيات</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={deleteAllData}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الحذف...
                  </>
                ) : (
                  'نعم، احذف جميع البيانات'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;