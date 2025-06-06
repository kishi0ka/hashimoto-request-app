'use client';

import { useState, useEffect } from 'react';
import { RequestItem, TaskType } from '@/types';
import { getRequests, getTaskTypes } from '@/lib/firestore';
import { formatDateSafe } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  calculateMonthlyStats, 
  calculateRequesterStats, 
  calculateRequestTypeStats,
  formatMinutesToHoursAndMinutes 
} from '@/lib/analytics';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientDate from '@/components/ClientDate';

export default function Analytics() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

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

  const toggleMonthExpansion = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const getMonthlyDetails = (month: string) => {
    const monthRequests = requests.filter(req => {
      if (req.status !== 'completed') return false;
      const completedDate = new Date(req.updatedAt);
      const monthKey = format(completedDate, 'yyyy-MM', { locale: ja });
      return monthKey === month;
    });

    // タスクタイプ別集計
    const taskTypeBreakdown = monthRequests.reduce((acc, req) => {
      const taskType = taskTypes.find(type => type.id === req.taskTypeId);
      const taskTypeName = taskType?.name || 'タスクタイプ不明';
      
      if (!acc[taskTypeName]) {
        acc[taskTypeName] = { count: 0, totalMinutes: 0 };
      }
      acc[taskTypeName].count += 1;
      acc[taskTypeName].totalMinutes += req.estimatedMinutes;
      return acc;
    }, {} as Record<string, { count: number; totalMinutes: number }>);

    // 依頼者別集計
    const requesterBreakdown = monthRequests.reduce((acc, req) => {
      if (!acc[req.requesterName]) {
        acc[req.requesterName] = { count: 0, totalMinutes: 0 };
      }
      acc[req.requesterName].count += 1;
      acc[req.requesterName].totalMinutes += req.estimatedMinutes;
      return acc;
    }, {} as Record<string, { count: number; totalMinutes: number }>);

    return {
      requests: monthRequests,
      taskTypeBreakdown,
      requesterBreakdown
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const monthlyStats = calculateMonthlyStats(requests);
  const requesterStats = calculateRequesterStats(requests);
  const requestTypeStats = calculateRequestTypeStats(requests);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 月別統計 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">月別完了統計</h2>
          <div className="space-y-4">
            {monthlyStats.length > 0 ? (
              monthlyStats.map((stat) => {
                const isExpanded = expandedMonths.has(stat.month);
                const monthDetails = getMonthlyDetails(stat.month);
                
                return (
                  <div key={stat.month} className="border border-gray-200 rounded-lg">
                    <div 
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleMonthExpansion(stat.month)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          ▶
                        </span>
                                                 <div>
                           <p className="font-medium text-gray-900">
                             {format(new Date(stat.month + '-01'), 'yyyy年M月', { locale: ja })}
                           </p>
                           <p className="text-sm text-gray-500">{stat.completedCount}件完了</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {formatMinutesToHoursAndMinutes(stat.totalMinutes)}
                        </p>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                        {/* タスクタイプ別内訳 */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">📝 タスクタイプ別</h4>
                                                     <div className="space-y-1">
                             {Object.entries(monthDetails.taskTypeBreakdown).map(([taskType, data]) => {
                               return (
                                 <div key={taskType} className="flex justify-between text-sm bg-blue-50 px-3 py-1 rounded">
                                   <span>{taskType}: {data.count}件</span>
                                   <span className="text-blue-600 font-medium">
                                     {formatMinutesToHoursAndMinutes(data.totalMinutes)}
                                   </span>
                                 </div>
                               );
                             })}
                           </div>
                        </div>

                        {/* 依頼者別内訳 */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">👤 依頼者別</h4>
                                                     <div className="space-y-1">
                             {Object.entries(monthDetails.requesterBreakdown).map(([requester, data]) => {
                               return (
                                 <div key={requester} className="flex justify-between text-sm bg-green-50 px-3 py-1 rounded">
                                   <span>{requester}さん: {data.count}件</span>
                                   <span className="text-green-600 font-medium">
                                     {formatMinutesToHoursAndMinutes(data.totalMinutes)}
                                   </span>
                                 </div>
                               );
                             })}
                           </div>
                        </div>

                        {/* 完了したタスク一覧 */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">✅ 完了タスク一覧</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {monthDetails.requests.map((req) => {
                              const taskType = taskTypes.find(type => type.id === req.taskTypeId);
                              return (
                                <div key={req.id} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                                  <div>
                                    <span className="font-medium">{req.requesterName}</span>
                                    <span className="mx-2 text-gray-400">→</span>
                                    <span>{taskType?.name || 'タスクタイプ不明'}</span>
                                    <span className="text-gray-500 ml-2">({req.quantity}{taskType?.unit || '個'})</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-600">
                                      {formatMinutesToHoursAndMinutes(req.estimatedMinutes)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      <ClientDate date={req.updatedAt} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">完了した依頼がありません</p>
            )}
          </div>
        </div>

        {/* 依頼者別統計 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">依頼者別統計</h2>
          <div className="space-y-4">
            {requesterStats.length > 0 ? (
              requesterStats.map((stat) => (
                <div key={stat.requesterName} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{stat.requesterName}</p>
                    <p className="text-sm text-gray-500">
                      総数: {stat.totalRequests}件 / 完了: {stat.completedRequests}件
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatMinutesToHoursAndMinutes(stat.totalMinutes)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stat.totalRequests > 0 ? Math.round((stat.completedRequests / stat.totalRequests) * 100) : 0}% 完了
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">依頼データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* 依頼内容別統計 */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">依頼内容別統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestTypeStats.length > 0 ? (
              requestTypeStats.map((stat) => {
                const taskType = taskTypes.find(type => type.id === stat.requestType);
                const taskTypeName = taskType?.name || 'タスクタイプ不明';
                
                return (
                  <div key={stat.requestType} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{taskTypeName}</p>
                      <p className="text-sm text-gray-500">{stat.count}件</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">
                        {formatMinutesToHoursAndMinutes(stat.totalMinutes)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4 col-span-2">依頼データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* 詳細データ出力ボタン */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            const csvData = [
              ['お願いした人', 'お仕事内容', '個数', 'いつまでに', '想定時間（分）', '状況', '作成日', '更新日', 'メモ'],
              ...requests.map(req => {
                const taskType = taskTypes.find(type => type.id === req.taskTypeId);
                return [
                  req.requesterName,
                  taskType?.name || 'タスクタイプ不明',
                  req.quantity,
                  formatDateSafe(req.dueDate),
                  req.estimatedMinutes,
                  req.status === 'pending' ? '作業中' : '完了',
                  formatDateSafe(req.createdAt),
                  formatDateSafe(req.updatedAt),
                  req.notes || '',
                ];
              })
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `ハシモトさんのお仕事記録_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
          }}
          className="bg-gradient-to-r from-green-400 to-blue-400 text-white px-8 py-4 rounded-xl font-medium hover:from-green-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 transition-all shadow-sm"
        >
          📊 お仕事記録をダウンロード
        </button>
        <p className="text-sm text-gray-500 mt-3">みんなのがんばりを記録に残しましょう</p>
      </div>
    </div>
  );
} 