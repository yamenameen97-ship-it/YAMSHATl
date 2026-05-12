import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if ([400, 401, 403, 404, 422].includes(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: 'offlineFirst',
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
