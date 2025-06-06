'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TaskType } from '@/types';
import { getTaskTypes, updateTaskType } from '@/lib/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientDate from '@/components/ClientDate';

export default function TaskTypesList() {
  const router = useRouter();
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    estimatedTimeSeconds: number;
    unit: string;
  }>({
    name: '',
    estimatedTimeSeconds: 30,
    unit: '個',
  });

  useEffect(() => {
    loadTaskTypes();
  }, []);

  const loadTaskTypes = async () => {
    try {
      console.log('🔄 タスクタイプを読み込み中...');
      const data = await getTaskTypes();
      console.log('📋 取得したタスクタイプ:', data);
      setTaskTypes(data);
    } catch (error) {
      console.error('❌ お仕事データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (taskType: TaskType) => {
    setEditingId(taskType.id);
    setEditForm({
      name: taskType.name,
      estimatedTimeSeconds: Math.round(taskType.estimatedTimePerUnit * 60),
      unit: taskType.unit,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      await updateTaskType(editingId, {
        name: editForm.name.trim(),
        estimatedTimePerUnit: editForm.estimatedTimeSeconds / 60, // 秒を分に変換
        unit: editForm.unit,
      });
      
      setEditingId(null);
      setEditForm({ name: '', estimatedTimeSeconds: 30, unit: '個' });
      await loadTaskTypes(); // データを再読み込み
    } catch (error) {
      console.error('タスクタイプの更新に失敗しました:', error);
      alert('更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', estimatedTimeSeconds: 30, unit: '個' });
  };

  // 単位の選択肢
  const unitOptions = ['個', '枚', '本', '台', 'セット', '回', '件'];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🔧</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">お仕事の種類一覧</h1>
          <p className="text-gray-600">登録されているお仕事の種類を確認できます</p>
        </div>

        {/* 新規登録ボタン */}
        <div className="text-center mb-6">
          <Link
            href="/task-types/create"
            className="inline-flex items-center bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition-all shadow-sm"
          >
            <span className="mr-2">✨</span>
            新しいお仕事を登録
          </Link>
        </div>


      </div>

      {/* お仕事一覧 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {taskTypes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-gradient-to-r from-orange-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">📝 お仕事の名前</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">⏰ 時間/1つ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">📊 単位</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">📅 登録日</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">🎯 例（10個の場合）</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">✏️ 編集</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taskTypes.map((taskType) => {
                  const isEditing = editingId === taskType.id;
                  
                  return (
                    <tr key={taskType.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">🔧</span>
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="お仕事の名前"
                              />
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-900">{taskType.name}</p>
                                <p className="text-xs text-gray-500">ID: {taskType.id.substring(0, 8)}...</p>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editForm.estimatedTimeSeconds}
                              onChange={(e) => setEditForm({...editForm, estimatedTimeSeconds: parseInt(e.target.value) || 0})}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                              min="1"
                              max="3600"
                            />
                            <span className="text-xs text-gray-500">秒</span>
                          </div>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {Math.round(taskType.estimatedTimePerUnit * 60)}秒
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <select
                            value={editForm.unit}
                            onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {unitOptions.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                            {taskType.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <ClientDate date={taskType.createdAt} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              約{editForm.estimatedTimeSeconds * 10}秒
                            </span>
                            <span className="text-xs text-gray-500">
                              （{Math.round(editForm.estimatedTimeSeconds * 10 / 60)}分）
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              約{Math.round(taskType.estimatedTimePerUnit * 10 * 60)}秒
                            </span>
                            <span className="text-xs text-gray-500">
                              （{Math.round(taskType.estimatedTimePerUnit * 10)}分）
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                            >
                              💾 保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              ❌ やめる
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(taskType)}
                            className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                          >
                            ✏️ 編集
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔧</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">まだお仕事が登録されていません</h3>
            <p className="text-gray-500 mb-6">最初のお仕事を登録してみましょう！</p>
            <Link
              href="/task-types/create"
              className="inline-flex items-center bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition-all shadow-sm"
            >
              <span className="mr-2">✨</span>
              お仕事を登録する
            </Link>
          </div>
        )}
      </div>

      {/* 戻るボタン */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all"
        >
          ⬅️ お仕事リストに戻る
        </button>
      </div>
    </div>
  );
} 