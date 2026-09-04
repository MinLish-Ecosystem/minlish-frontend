/**
 * UC-13 Voice AI — Frontend types (FR-100..FR-105).
 * Khớp BE contract: docs/backend/uc-13-voice-ai/api-spec.md v1.2.0.
 * Phiên chat ephemeral: chat + điểm chỉ trong React state, KHÔNG Redux/localStorage (CAP-09).
 */

// ── Catalog DTOs (khớp BE api-spec §1) ─────────────────────
export type DifficultyLevel = 'light' | 'medium' | 'high' | 'ultra' | 'extreme';
export type ModelStatus = 'available' | 'deprecated' | 'updating';
export type ModelFormat = 'gguf' | 'onnx';

export interface ComponentDto {
  name: string;
  sizeMB: number;
}

export interface VoiceAITierDto {
  _id: string;
  name: string;
  difficultyLevel: DifficultyLevel;
  requirements: { minRamGB: number; minCpuCores: number; gpuRequired: boolean };
  components: { stt: ComponentDto; llm: ComponentDto; tts: ComponentDto };
  totalSizeMB: number;
  status: ModelStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogResponse {
  tiers: VoiceAITierDto[];
  systemPrompt: string;
}

export type ComponentFileRole = 'model' | 'encoder' | 'decoder' | 'config' | 'tokenizer';

export interface ComponentFileDownload {
  role: ComponentFileRole;
  fileName: string;
  url: string;
  sizeMB: number;
}

export interface ComponentDownload {
  url: string; // legacy: file chính — back-compat
  format: ModelFormat;
  files: ComponentFileDownload[]; // đầy đủ: ONNX encoder/decoder 2 file, GGUF 1 file
}

export interface DownloadResponse {
  downloads: { stt: ComponentDownload; llm: ComponentDownload; tts: ComponentDownload };
  totalSizeMB: number;
}

// ── Device & eligibility ────────────────────────────────────
export interface DeviceSpec {
  availableRamGB: number | null;
  cpuCores: number | null;
  gpuVramGB: number | null;
}

export interface StorageQuota {
  freeMB: number | null;
}

export type TierEligibility = 'eligible' | 'blocked' | 'blocked-storage';

// ── UI state ────────────────────────────────────────────────
export type MicState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'blocked-download'
  | 'blocked-permission'
  | 'disabled';

export type DownloadState = 'idle' | 'fetching-links' | 'downloading' | 'loading-runtime' | 'error';

export type PipelinePhase = 'idle' | 'stt' | 'llm' | 'tts';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'hidden';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  /** Lượt user đang chờ LLM suy luận — bubble hiện animation thay vì text '…' chết. */
  pending?: boolean;
  score?: number;
  feedback?: string;
  scoringFailed?: boolean;
  scoreBreakdown?: { keyword: number; grammar: number; vocab?: number; matchedDue?: string[]; matchedNew?: string[] };
}

export interface DownloadProgress {
  component: 'stt' | 'llm' | 'tts';
  percent: number;
  sizeMB: number;
}

export interface ScoreResult {
  score: number;
  feedback: string;
  breakdown?: { keyword: number; grammar: number; vocab?: number; matchedDue?: string[]; matchedNew?: string[] };
}

/** Danh sách từ vựng của user để tính bonus điểm nói — lấy từ GET /learning/queue lúc vào phiên. */
export interface VocabBonusLists {
  /** Từ tới hạn ôn (reviewCards) — bonus cao */
  due: string[];
  /** Từ mới (newCards) — bonus nhẹ */
  fresh: string[];
}
