import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from '@/api/client';
import { ExtractedOrder } from '@/types/oms';

const REFRESH_INTERVAL_MS = 15000;

/** Live-updating list of all ingested emails. */
export function useEmails() {
  const query = useQuery({
    queryKey: ['emails'],
    queryFn: api.fetchEmails,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  return {
    emails: query.data ?? null,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    refresh: async () => {
      await query.refetch();
    },
  };
}

/** Single email + its extraction, live-updating. */
export function useEmail(id: string | undefined) {
  const query = useQuery({
    queryKey: ['emails', id],
    queryFn: () => api.fetchEmail(id as string),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });

  return {
    // undefined = still loading, null = confirmed not found (matches Phase 2 contract).
    email: !id ? undefined : query.isPending ? undefined : (query.data ?? null),
    loading: !!id && query.isPending,
  };
}

/** The correction log — training data for the active-learning loop (Feature 3). */
export function useAuditLog() {
  const query = useQuery({
    queryKey: ['audit'],
    queryFn: api.fetchAuditLog,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  return { entries: query.data ?? null, loading: query.isPending };
}

function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['emails'] });
    queryClient.invalidateQueries({ queryKey: ['audit'] });
  };
}

export function useApproveOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, extraction }: { id: string; extraction: ExtractedOrder }) =>
      api.approveOrder(id, extraction),
    onSuccess: invalidate,
  });
}

export function useRejectOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => api.setStatus(id, 'rejected'),
    onSuccess: invalidate,
  });
}
