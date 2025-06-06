'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskType, User } from '@/types';
import { createRequest, getTaskTypes, getUsers } from '@/lib/firestore';
import { formatMinutesToHoursAndMinutes } from '@/lib/analytics';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateRequest() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    requesterName: '',
    taskTypeId: '',
    quantity: 1,
    dueDate: '',
    notes: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [taskTypesLoading, setTaskTypesLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadTaskTypes();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Firebase設定確認:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      // Firebaseからデータを取得
      const userData = await getUsers();
      console.log('取得したユーザーデータ:', userData);
      
      // データが取得できない場合はテストデータを使用
      if (userData.length === 0) {
        console.log('Firebaseからデータを取得できないため、テストデータを使用します');
        const testUsers: User[] = [
          {
            id: 'test1',
            name: '岸本 奈々恵',
            department: '製造部',
            employeeId: '85',
            isAdmin: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'test2',
            name: 'テスト太郎',
            department: '開発部',
            employeeId: '01',
            isAdmin: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
        setUsers(testUsers);
      } else {
        setUsers(userData);
      }
    } catch (error) {
      console.error('ユーザーデータの読み込みに失敗しました:', error);
      console.log('エラーのため、テストデータを使用します');
      
      // エラーの場合もテストデータを使用
      const testUsers: User[] = [
        {
          id: 'test1',
          name: '岸本 奈々恵',
          department: '製造部',
          employeeId: '85',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      setUsers(testUsers);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTaskTypes = async () => {
    try {
      console.log('タスクタイプを取得中...');
      const taskTypeData = await getTaskTypes();
      console.log('取得したタスクタイプ:', taskTypeData);
      setTaskTypes(taskTypeData);
    } catch (error) {
      console.error('タスクタイプの読み込みに失敗しました:', error);
    } finally {
      setTaskTypesLoading(false);
    }
  };

  const selectedTaskType = taskTypes.find(type => type.id === formData.taskTypeId);
  const estimatedMinutes = selectedTaskType ? selectedTaskType.estimatedTimePerUnit * formData.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requesterName || !formData.taskTypeId || !formData.dueDate) {
      alert('必須項目を入力してください。');
      return;
    }

    setLoading(true);
    try {
      await createRequest({
        requesterName: formData.requesterName,
        taskTypeId: formData.taskTypeId,
        quantity: formData.quantity,
        dueDate: new Date(formData.dueDate),
        notes: formData.notes,
        status: 'pending',
      });
      
      alert('依頼を作成しました。');
      router.push('/');
    } catch (error) {
      console.error('依頼作成に失敗しました:', error);
      alert('依頼作成に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (usersLoading || taskTypesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <span className="text-4xl mb-2 block">✨</span>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ハシモトさんにお仕事お願い</h1>
        <p className="text-gray-600">いつもありがとうございます！新しいお仕事をお願いしましょう</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 依頼者名 */}
          <div>
            <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-2">
              👤 お名前 <span className="text-pink-500">*</span>
            </label>
            <select
              id="requesterName"
              value={formData.requesterName}
              onChange={(e) => handleInputChange('requesterName', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              required
            >
              <option value="">どなたからのお願いですか？</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>
                  {user.name} ({user.department})
                </option>
              ))}
            </select>
          </div>

          {/* 依頼内容 */}
          <div>
            <label htmlFor="taskTypeId" className="block text-sm font-medium text-gray-700 mb-2">
              📝 お仕事の内容 <span className="text-pink-500">*</span>
            </label>
            <select
              id="taskTypeId"
              value={formData.taskTypeId}
              onChange={(e) => handleInputChange('taskTypeId', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              required
            >
              <option value="">どんなお仕事をお願いしますか？</option>
              {taskTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} （{Math.round(type.estimatedTimePerUnit * 60)}秒/{type.unit}）
                </option>
              ))}
            </select>
          </div>

          {/* 数量 */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              🔢 個数 <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              min="1"
              placeholder="何個お願いしますか？"
              required
            />
          </div>

          {/* 期日 */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              📅 いつまでに <span className="text-pink-500">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* 備考 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              💭 ひとこと（任意）
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              rows={4}
              placeholder="何か特別なお願いがあれば教えてください"
            />
          </div>

          {/* 想定時間表示 */}
          {estimatedMinutes > 0 && (
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">⏰</span>
                <h3 className="text-sm font-medium text-pink-800">だいたいの時間</h3>
              </div>
              <p className="text-2xl font-bold text-pink-900 mb-2">
                {formatMinutesToHoursAndMinutes(estimatedMinutes)}
              </p>
              <p className="text-sm text-pink-600">
                {formData.quantity}{selectedTaskType?.unit || '個'} × {Math.round((selectedTaskType?.estimatedTimePerUnit || 0) * 60)}秒/{selectedTaskType?.unit || '個'} = {Math.round(estimatedMinutes * 60)}秒
              </p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white py-3 px-6 rounded-xl font-medium hover:from-orange-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? '📤 お願い中...' : '✨ お仕事をお願いする'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 bg-gray-100 text-gray-600 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all"
            >
              ⬅️ もどる
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 