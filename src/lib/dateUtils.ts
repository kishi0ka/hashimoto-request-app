import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Hydrationエラーを避けるための安全な日付フォーマット関数
 */
export const formatDateSafe = (date: Date, formatString = 'yyyy/MM/dd'): string => {
  try {
    return format(date, formatString, { locale: ja });
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toISOString().split('T')[0]; // フォールバック
  }
};

/**
 * 日本語での日付表示用
 */
export const formatDateJa = (date: Date): string => {
  return formatDateSafe(date, 'yyyy年MM月dd日');
};

/**
 * 短縮形式の日付表示用
 */
export const formatDateShort = (date: Date): string => {
  return formatDateSafe(date, 'MM/dd');
};

/**
 * ISO形式での日付表示（input[type="date"]用）
 */
export const formatDateForInput = (date: Date): string => {
  return formatDateSafe(date, 'yyyy-MM-dd');
}; 