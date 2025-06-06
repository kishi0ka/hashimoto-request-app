import { RequestItem, MonthlyStats, RequesterStats, RequestTypeStats } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const calculateMonthlyStats = (requests: RequestItem[]): MonthlyStats[] => {
  const completedRequests = requests.filter(req => req.status === 'completed');
  const monthlyData: { [key: string]: { count: number; minutes: number } } = {};

  completedRequests.forEach(request => {
    const monthKey = format(request.updatedAt, 'yyyy-MM', { locale: ja });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, minutes: 0 };
    }
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].minutes += request.estimatedMinutes;
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      completedCount: data.count,
      totalMinutes: data.minutes,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
};

export const calculateRequesterStats = (requests: RequestItem[]): RequesterStats[] => {
  const requesterData: { [key: string]: RequesterStats } = {};

  requests.forEach(request => {
    const name = request.requesterName;
    if (!requesterData[name]) {
      requesterData[name] = {
        requesterName: name,
        totalRequests: 0,
        completedRequests: 0,
        totalMinutes: 0,
      };
    }
    
    requesterData[name].totalRequests += 1;
    if (request.status === 'completed') {
      requesterData[name].completedRequests += 1;
      requesterData[name].totalMinutes += request.estimatedMinutes;
    }
  });

  return Object.values(requesterData).sort((a, b) => b.totalRequests - a.totalRequests);
};

export const calculateRequestTypeStats = (requests: RequestItem[]): RequestTypeStats[] => {
  const typeData: { [key: string]: RequestTypeStats } = {};

  requests.forEach(request => {
    if (!typeData[request.taskTypeId]) {
      typeData[request.taskTypeId] = {
        requestType: request.taskTypeId,
        count: 0,
        totalMinutes: 0,
      };
    }
    
    typeData[request.taskTypeId].count += 1;
    if (request.status === 'completed') {
      typeData[request.taskTypeId].totalMinutes += request.estimatedMinutes;
    }
  });

  return Object.values(typeData).sort((a, b) => b.count - a.count);
};

export const calculateCurrentWorkload = (requests: RequestItem[]) => {
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const totalPendingMinutes = pendingRequests.reduce((sum, req) => sum + req.estimatedMinutes, 0);
  
  return {
    pendingCount: pendingRequests.length,
    totalEstimatedMinutes: totalPendingMinutes,
    totalEstimatedHours: totalPendingMinutes / 60,
  };
};

export const formatMinutesToHoursAndMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}分`;
  } else if (remainingMinutes === 0) {
    return `${hours}時間`;
  } else {
    return `${hours}時間${remainingMinutes}分`;
  }
}; 