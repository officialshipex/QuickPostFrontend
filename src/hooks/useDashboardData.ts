import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData, type DashboardData } from '../services/dashboardApi';

export function useDashboardData() {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
