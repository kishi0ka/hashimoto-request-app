'use client';

import { useState, useEffect } from 'react';
import { formatDateSafe } from '@/lib/dateUtils';

interface ClientDateProps {
  date: Date;
  className?: string;
  format?: string;
}

export default function ClientDate({ date, className = '', format }: ClientDateProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // サーバーサイドでは何も表示しない（Hydrationエラーを防ぐ）
    return <span className={className}>loading...</span>;
  }

  return (
    <span className={className}>
      {formatDateSafe(date, format)}
    </span>
  );
} 