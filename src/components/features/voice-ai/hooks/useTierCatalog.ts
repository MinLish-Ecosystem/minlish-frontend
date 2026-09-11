/**
 * UC-13 Voice AI — Hook fetch catalog + systemPrompt (FR-100 / CAP-01, API-01).
 * GET /voice-ai/models — public cho user đã đăng nhập, apiClient gắn Bearer tự động.
 */
import { useCallback, useEffect, useState } from 'react';
import api from '../../../../lib/api';
import type { CatalogResponse, ModelStatus, VoiceAITierDto } from '../types';

interface CatalogState {
  tiers: VoiceAITierDto[];
  systemPrompt: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTierCatalog = (): CatalogState => {
  const [tiers, setTiers] = useState<VoiceAITierDto[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: CatalogResponse }>('/api/v1/voice-ai/models', {
        params: { status: 'available' as ModelStatus },
      });
      setTiers(response.data.data.tiers ?? []);
      setSystemPrompt(response.data.data.systemPrompt ?? '');
    } catch {
      setError('Không thể kết nối server. Kiểm tra mạng và thử lại.');
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { tiers, systemPrompt, loading, error, refetch };
};
