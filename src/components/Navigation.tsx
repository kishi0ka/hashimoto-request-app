'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '仕事リスト', icon: '📝' },
    { href: '/create', label: '新規依頼', icon: '✨' },
    { href: '/task-types', label: '仕事管理', icon: '🔧' },
    { href: '/analytics', label: '過去の仕事一覧', icon: '🌸' },
  ];

  return (
    <nav className="bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏠</span>
            <h1 className="text-xl font-bold">ハシモトさんちのお仕事箱</h1>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-white bg-opacity-30 text-orange-900 shadow-md font-semibold'
                    : 'text-orange-100 hover:bg-white hover:bg-opacity-20 hover:text-orange-800'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
} 