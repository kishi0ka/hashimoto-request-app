'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTaskType } from '@/lib/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateTaskType() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    estimatedTimeSeconds: 30, // デフォルト30秒
    unit: '個',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.estimatedTimeSeconds <= 0) {
      alert('必須項目を入力してください。');
      return;
    }

    setLoading(true);
    try {
      await createTaskType({
        name: formData.name.trim(),
        estimatedTimePerUnit: formData.estimatedTimeSeconds / 60, // 秒を分に変換
        unit: formData.unit,
        isActive: true,
      });
      
      alert('新しいお仕事を登録しました！');
      router.push('/task-types');
    } catch (error) {
      console.error('お仕事の登録に失敗しました:', error);
      alert('お仕事の登録に失敗しました。もう一度お試しください。');
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

  // 単位の選択肢
  const unitOptions = ['個', '枚', '本', '台', 'セット', '回', '件'];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <span className="text-4xl mb-2 block">🔧</span>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">新しいお仕事を登録</h1>
        <p className="text-gray-600">ハシモトさんにお願いできる新しいお仕事の種類を追加しましょう</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* お仕事の名前 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              📝 お仕事の名前 <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              placeholder="例：商品の検品、パッケージング作業など"
              required
            />
          </div>

          {/* 1個あたりの時間 */}
          <div>
            <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-2">
              ⏰ 1つあたりの時間（秒） <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              id="estimatedTime"
              value={formData.estimatedTimeSeconds}
              onChange={(e) => handleInputChange('estimatedTimeSeconds', parseInt(e.target.value) || 0)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              min="1"
              max="3600"
              placeholder="例：30"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              1つの作業にかかる時間を秒単位で入力してください（1〜3600秒）
            </p>
          </div>

          {/* 単位 */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              📊 単位 <span className="text-pink-500">*</span>
            </label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              required
            >
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              作業の数え方（例：「10個」「5枚」「3本」など）
            </p>
          </div>

          {/* プレビュー */}
          {formData.name && (
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">👀</span>
                <h3 className="text-sm font-medium text-pink-800">プレビュー</h3>
              </div>
              <p className="text-lg font-bold text-pink-900 mb-2">
                {formData.name}
              </p>
              <p className="text-sm text-pink-600">
                1{formData.unit}あたり{formData.estimatedTimeSeconds}秒
              </p>
              <div className="mt-3 text-sm text-pink-700">
                <p>📌 例：10{formData.unit}の場合 → 約{formData.estimatedTimeSeconds * 10}秒（{Math.round(formData.estimatedTimeSeconds * 10 / 60)}分）</p>
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white py-3 px-6 rounded-xl font-medium hover:from-orange-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? '🔧 登録中...' : '✨ お仕事を登録する'}
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

      {/* ヒント */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">💡</span>
          <h3 className="text-sm font-medium text-blue-800">お仕事登録のコツ</h3>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 分かりやすい名前をつけましょう（例：「商品Aの検品」）</li>
          <li>• 時間は実際の作業時間に合わせて設定しましょう</li>
          <li>• 単位は数えやすいものを選びましょう</li>
          <li>• 後から修正することもできます</li>
        </ul>
      </div>
    </div>
  );
} 