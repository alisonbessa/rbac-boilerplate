import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouterProvider } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const container = document.getElementById('root')!;
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});
createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <AppRouterProvider />
  </QueryClientProvider>,
);
