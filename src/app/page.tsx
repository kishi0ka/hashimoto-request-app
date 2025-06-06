'use client';

import { useState, useEffect } from 'react';
import { RequestItem, TaskType } from '@/types';
import { getRequests, updateRequestStatus, updateRequest, getTaskTypes } from '@/lib/firestore';
import { calculateCurrentWorkload, formatMinutesToHoursAndMinutes } from '@/lib/analytics';
import { isBefore } from 'date-fns';
import { formatDateSafe, formatDateForInput } from '@/lib/dateUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientDate from '@/components/ClientDate';

export default function Home() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RequestItem>>({});

  useEffect(() => {
    loadRequests();
    loadTaskTypes();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(data);
    } catch (error) {
      console.error('依頼データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskTypes = async () => {
    try {
      const data = await getTaskTypes();
      setTaskTypes(data);
    } catch (error) {
      console.error('タスクタイプデータの読み込みに失敗しました:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateRequestStatus(id, 'completed');
      await loadRequests();
    } catch (error) {
      console.error('タスク完了の更新に失敗しました:', error);
    }
  };

  const handleEdit = (request: RequestItem) => {
    setEditingId(request.id);
    setEditForm({
      quantity: request.quantity,
      dueDate: request.dueDate,
      notes: request.notes,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      await updateRequest(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      await loadRequests();
    } catch (error) {
      console.error('依頼の更新に失敗しました:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 対応中の仕事のみを表示
  const pendingRequests = requests.filter(request => request.status === 'pending');
  const workload = calculateCurrentWorkload(requests);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        {/* 現在の作業負荷表示 */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <span className="text-lg mr-1">📝</span>
              <span className="text-orange-600">対応中: </span>
              <span className="font-semibold">{workload.pendingCount}件</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-1">⏰</span>
              <span className="text-orange-600">予想時間: </span>
              <span className="font-semibold">{formatMinutesToHoursAndMinutes(workload.totalEstimatedMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* お仕事テーブル */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-orange-100">
          <thead className="bg-gradient-to-r from-orange-50 to-pink-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">👤 お願いした人</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">📝 お仕事内容</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">🔢 個数</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">📅 いつまでに</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">⏰ 時間</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">💭 メモ</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">✅ 完了</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-orange-800 tracking-wider">✏️ 編集</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingRequests.map((request) => {
              const isOverdue = isBefore(request.dueDate, new Date());
              const isEditing = editingId === request.id;
              const taskType = taskTypes.find(type => type.id === request.taskTypeId);
              const taskTypeName = taskType?.name || 'タスクタイプ不明';

              return (
                <tr key={request.id} className={isOverdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requesterName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {taskTypeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quantity || ''}
                        onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                        className="w-20 border border-gray-300 rounded px-2 py-1"
                        min="1"
                      />
                    ) : (
                      `${request.quantity}${taskType?.unit || '個'}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dueDate ? formatDateForInput(editForm.dueDate) : ''}
                        onChange={(e) => setEditForm({...editForm, dueDate: new Date(e.target.value)})}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <ClientDate 
                        date={request.dueDate}
                        className={isOverdue ? 'text-red-600 font-semibold' : ''}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMinutesToHoursAndMinutes(request.estimatedMinutes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {isEditing ? (
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        rows={2}
                      />
                    ) : (
                      request.notes
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!isEditing && (
                      <button
                        onClick={() => handleComplete(request.id)}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-full hover:bg-green-200 transition-colors font-medium"
                      >
                        ✅ 完了
                      </button>
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
                        onClick={() => handleEdit(request)}
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
        
        {pendingRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            🎉 お疲れ様です！現在対応中のお仕事はありません。
          </div>
        )}
      </div>
    </div>
  );
}
