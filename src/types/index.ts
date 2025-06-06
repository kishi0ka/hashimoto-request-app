export interface RequestItem {
  id: string;
  taskTypeId: string;
  requesterName: string;
  quantity: number;
  dueDate: Date;
  notes?: string;
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  estimatedMinutes: number;
}

export interface TaskType {
  id: string;
  name: string;
  estimatedTimePerUnit: number; // 分単位
  unit: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// デフォルトのタスクタイプ（初期データ用）
export const DEFAULT_TASK_TYPES: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '鉄製のれん掛けの検品',
    estimatedTimePerUnit: 0.5, // 30秒 = 0.5分
    unit: '個',
    isActive: true,
  },
  {
    name: 'Pバナーアタッチメントパイプの検品',
    estimatedTimePerUnit: 0.17, // 10秒 ≈ 0.17分
    unit: '個',
    isActive: true,
  },
];

export interface MonthlyStats {
  month: string;
  completedCount: number;
  totalMinutes: number;
}

export interface RequesterStats {
  requesterName: string;
  totalRequests: number;
  completedRequests: number;
  totalMinutes: number;
}

export interface RequestTypeStats {
  requestType: string;
  count: number;
  totalMinutes: number;
}

export interface User {
  id: string;
  name: string;
  department: string;
  employeeId: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
} 