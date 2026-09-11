/**
 * UC-13 Voice AI — Hook tải weights 3 components + progress (FR-102 / CAP-04, API-03).
 * Flow (OQ-05 hướng A): persist() → GET /voice-ai/model/download?tier= → stream 3 components
 * vào Cache Storage → mark cached. Lỗi → retry, KHÔNG đánh dấu đã tải (AF-04).
 */
import { useCallback, useState } from 'react';
import api from '../../../../lib/api';
import type { DownloadProgress, DownloadResponse, DownloadState, VoiceAITierDto } from '../types';
import { downloadTierWeights, isTierCached } from '../services/weightsCache';
import { requestPersistentStorage } from '../utils/deviceDetect';

interface WeightsDownloadState {
  downloadState: DownloadState;
  progress: DownloadProgress[];
  errorMessage: string | null;
  startDownload: (tier: VoiceAITierDto) => Promise<boolean>;
  retry: (tier: VoiceAITierDto) => Promise<boolean>;
  /** Đánh dấu runtime LLM đã sẵn sàng — thoát trạng thái 'loading-runtime' (trước đây kẹt mãi). */
  markReady: () => void;
}

const errorMessageFrom = (error: unknown, fallback: string): string => {
  const code = (error as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode;
  if (code === 'ERR_DOWNLOAD_RATE_LIMITED') {
    return 'Bạn đã vượt giới hạn tải (3 lần/giờ). Vui lòng thử lại sau.';
  }
  if (code === 'ERR_MODEL_UNAVAILABLE') {
    return 'Model tier này đang cập nhật, vui lòng chọn tier khác.';
  }
  if (code === 'ERR_MODEL_NOT_FOUND') {
    return 'Model bạn chọn không tồn tại hoặc đã bị gỡ.';
  }
  return fallback;
};

export const useWeightsDownload = (): WeightsDownloadState => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState<DownloadProgress[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startDownload = useCallback(async (tier: VoiceAITierDto): Promise<boolean> => {
    if (isTierCached(tier._id)) return true;
    setDownloadState('fetching-links');
    setErrorMessage(null);
    setProgress([]);
    try {
      // OQ-05: persist trước stream để browser không tự dọn weights
      await requestPersistentStorage();
      const response = await api.get<{ data: DownloadResponse }>('/api/v1/voice-ai/model/download', {
        params: { tier: tier._id },
      });
      setDownloadState('downloading');
      const { downloads } = response.data.data;
      const result = await downloadTierWeights(tier, downloads, setProgress);
      if (result.error) {
        setDownloadState('error');
        setErrorMessage(`Tải model thất bại (${result.error.component}). Kiểm tra mạng và thử lại.`);
        return false;
      }
      setDownloadState('loading-runtime');
      return true;
    } catch (error) {
      setDownloadState('error');
      setErrorMessage(errorMessageFrom(error, 'Tải model thất bại. Kiểm tra mạng và thử lại.'));
      return false;
    }
  }, []);

  const retry = useCallback(
    (tier: VoiceAITierDto) => {
      setDownloadState('idle');
      return startDownload(tier);
    },
    [startDownload],
  );

  const markReady = useCallback(() => {
    setDownloadState('idle');
  }, []);

  return { downloadState, progress, errorMessage, startDownload, retry, markReady };
};
