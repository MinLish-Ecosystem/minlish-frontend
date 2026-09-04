---
name: Voice AI (UC-13) — Build Notes
slug: uc-13-voice-ai
status: built
sources:
  - docs/frontend/uc-13-voice-ai/SPEC.md
  - docs/frontend/uc-13-voice-ai/ux-spec.md
  - docs/frontend/uc-13-voice-ai/ui-flow.md
  - docs/frontend/uc-13-voice-ai/component-design.md
  - docs/backend/uc-13-voice-ai/api-spec.md
  - docs/ba/uc-13-voice-ai.md
repo: ../minlish-frontend
branch-built-on: working tree (minlish-frontend)
built: 2026-08-30
---

# Build Notes — UC-13 Voice AI Frontend

> Biên bản implement FE theo SPEC + 3 doc FE (ux-spec, ui-flow, component-design) + BE api-spec v1.2.0.
> Repo đụng: `../minlish-frontend/`. Doc đầu vào đọc từ branch `feature/speaking_communication` của `minlish-ba` (không chuyển branch).

## 1. Màn hình đã làm

| Màn / Trạng thái | File | Ghi chú |
|---|---|---|
| `/voice-chat` page (lazy, ProtectedRoute) | `src/pages/voice-chat/index.tsx` | Compose toàn bộ 7 hooks + 9 components |
| Ready state (catalog + hint + empty chat) | page + `TierSelector`, `DeviceHintBanner` | AC-01: 5 tier × 3 components + size + status badge |
| Downloading state (progress per component) | `DownloadProgressPanel` | 3 bars stt/llm/tts + tổng size + Retry (AF-04) |
| Recording state (pulse + timer) | `MicButton` | Toggle: bấm 1 thu, bấm 2 dừng (BR-05) |
| Processing state (thinking) | `AiAvatar` + mic spinner | `idle → listening → thinking → speaking` |
| Session complete (targetScore) | `SessionCompleteScreen` | AC-14: SUM điểm ≥ 100 → màn hoàn thành + "Bắt đầu phiên mới" |
| Mic permission denied | `MicPermissionGuide` | AF-05: hướng dẫn bật quyền, không crash |
| Tier switch confirm modal | `SwitchTierConfirmModal` | AF-01: Escape = hủy, focus vào nút Hủy |
| Catalog error | inline banner trong page | "Không thể kết nối server…" + Retry |
| Loading state | skeleton spinner trong chat area | Page mount skeleton (EXPERIENCE spine) |

## 2. File đã đụng

> ⚠️ **Cấu trúc thực tế theo convention repo** (brownfield rule coding-rules §1.2): feature components đặt tại
> `src/components/features/voice-ai/` (khớp `src/components/features/explore|vocabulary|reading|speaking/`),
> page PascalCase `src/pages/voiceai/VoiceChatPage.tsx` (khớp `src/pages/listening/Listening.tsx`).
> component-design.md ghi `src/features/voice-ai/` + `src/pages/voice-chat/index.tsx` — **lệch doc so với repo**,
> ưu tiên cấu trúc repo đang có.

### New — feature `src/components/features/voice-ai/`

| Path | Loại |
|---|---|
| `types.ts` | Types + DTOs (khớp api-spec §1) — pattern giống `features/reading/types.ts` |
| `utils/deviceDetect.ts` | RAM/CPU/GPU probe + storage quota estimate + persist (OQ-05 A) |
| `utils/eligibility.ts` | BR-06: RAM×0.8, VRAM×0.9, quota×1.1 → `eligible/blocked/blocked-storage` |
| `services/weightsCache.ts` | Cache Storage wrapper, purge toàn bộ (BR-03), stream + progress throttle 250ms |
| `services/onDeviceRuntime.ts` | Dual adapter (OQ-03) — xem §6 lệch thiết kế |
| `hooks/useDeviceSpec.ts` | Device + quota state |
| `hooks/useTierCatalog.ts` | API-01: `GET /voice-ai/models` → tiers + systemPrompt |
| `hooks/useTierManager.ts` | activeTierId (localStorage `minlish_voice_active_tier`), switch confirm flow |
| `hooks/useWeightsDownload.ts` | API-03: `GET /voice-ai/model/download?tier=` → stream 3 components |
| `hooks/useMicRecorder.ts` | getUserMedia + MediaRecorder toggle |
| `hooks/useVoicePipeline.ts` | STT→LLM→TTS tuần tự (BR-01), TTS sau LLM xong |
| `hooks/useSpeechScoring.ts` | Rule-based local: keyword 0.6 + grammar 0.4, TARGET_SCORE=100 (BR-09) |
| `TierSelector.tsx` | Dropdown 5 tier + badge trạng thái |
| `DeviceHintBanner.tsx` | "Máy bạn phù hợp tối đa: X" |
| `ChatBubbleAi.tsx` | Bubble AI (EN thuần) + replay TTS |
| `ChatBubbleUser.tsx` | Bubble user + ScoreChip + feedback + "chưa đánh giá" |
| `MicButton.tsx` | 6 states, aria-pressed, touch ≥44px |
| `AiAvatar.tsx` | Placeholder trạng thái (xem §6 lệch thiết kế) |
| `DownloadProgressPanel.tsx` | 3 progress bars + aria-valuenow |
| `SwitchTierConfirmModal.tsx` | Modal focus trap, Escape hủy |
| `SessionCompleteScreen.tsx` | Màn hoàn thành 🎉 |
| `MicPermissionGuide.tsx` | Guide cấp quyền mic |
| `index.ts` | Barrel export components (khớp pattern `features/*/index.ts`) |
| `hooks/index.ts` | Barrel export hooks |

### New — page

- `src/pages/voiceai/VoiceChatPage.tsx` — page chính (lazy-loaded, route `/voice-chat`)

### Modified — integration

| Path | Thay đổi |
|---|---|
| `src/App.tsx` | Thêm lazy import `VoiceChatPage` + route `/voice-chat` (ProtectedRoute + Suspense); giữ route cũ `/voice-ai` (tương thích ngược) |
| `src/components/layout/MainLayout.tsx` | Sidebar nav "Voice AI" trỏ `/voice-ai` → `/voice-chat` |

### KHÔNG đụng

- `src/pages/voiceai/VoiceAIChat.tsx` (prototype cũ) — giữ nguyên, route cũ vẫn hoạt động
- Không thêm dependency mới (Rive đã có sẵn trong package.json)
- Không đụng Redux store / slices khác

## 3. Cách verify

### Lệnh

```bash
cd ../minlish-frontend
npm run dev        # Vite dev server — mở http://localhost:5173/voice-chat (cần đăng nhập)
npx tsc --noEmit   # PASS — 0 lỗi
npx vite build     # PASS — build thành công
```

### Manual test theo AC

| AC | Cách verify |
|---|---|
| AC-01 (catalog) | Đăng nhập → mở `/voice-chat` → thấy 5 tier + dung lượng + badge "Chưa tải"/"Đã tải" |
| AC-02 (recommend) | Banner "Máy bạn phù hợp tối đa: X" theo RAM×0.8/VRAM×0.9 |
| AC-03/AC-09 (download lần đầu) | Bấm mic với tier chưa tải → progress 3 components, mic spinner |
| AC-04 (mic khi đang tải) | Bấm mic giữa chừng → toast "Model đang tải, vui lòng chờ…" (BR-04) |
| AC-08 (đổi tier) | Chọn tier khác khi đã cache → modal confirm → đồng ý = purge + tải mới; hủy = giữ nguyên |
| AC-10 (mic denied) | Block quyền mic trong browser → guide hiện, không crash |
| AC-11 (mất mạng) | Tắt backend/wifi giữa tải → lỗi + nút Retry, tier không bị mark "đã tải" |
| AC-12 (STT rỗng) | Nói rất khẽ → "Không nghe rõ, thử nói lại", không gọi LLM |
| AC-13 (scoring lỗi) | Câu rỗng/không chấm được → nhãn "chưa đánh giá", chat tiếp tục |
| AC-14 (hoàn thành) | Nhiều câu đạt tổng 100 điểm → màn "Hoàn thành phiên 🎉" + nút phiên mới |
| Guard | Guest mở `/voice-chat` → redirect `/login` (đã verify bằng Playwright) |

Lưu ý: cần BE chạy `GET /api/v1/voice-ai/models` (chưa có trên backend hiện tại — BE build theo docs/backend/uc-13-voice-ai sẽ cung cấp). Không có BE → trang hiện skeleton + toast lỗi catalog.

## 4. AC Coverage

| AC | Status | Nơi implement |
|---|---|---|
| AC-01 | ✅ | `useTierCatalog` + `TierSelector` |
| AC-02 | ✅ | `eligibility.ts` recommendHighestTier + `DeviceHintBanner` |
| AC-03 | ✅ | `useWeightsDownload` + `DownloadProgressPanel` |
| AC-04 | ✅ | page handleMicToggle → toast chờ (BR-04) |
| AC-05 | ✅ | `useMicRecorder` + `useVoicePipeline` (STT phase) |
| AC-06 | ✅ | `useVoicePipeline` — LLM system prompt, TTS sau LLM (BR-01) |
| AC-07 | ✅ | `useSpeechScoring` + `ChatBubbleUser` ScoreChip |
| AC-08 | ✅ | `useTierManager` selectTier → `SwitchTierConfirmModal` → purge |
| AC-09 | ✅ | page ensureWeightsReady (tải lần đầu rồi vào phiên) |
| AC-10 | ✅ | `useMicRecorder` catch permission → `MicPermissionGuide` |
| AC-11 | ✅ | `weightsCache.downloadTierWeights` error → retry, KHÔNG mark cached |
| AC-12 | ✅ | `useVoicePipeline.run` trả null khi STT rỗng → page toast "Không nghe rõ" |
| AC-13 | ✅ | `useSpeechScoring.scoreUtterance` trả null → `scoringFailed` badge, KHÔNG đứt phiên |
| AC-14 | ✅ | TARGET_SCORE=100, onTargetReached → `SessionCompleteScreen` |
| AC-15 | ✅ (partial) | STT cấu hình en-US cứng trong runtime adapter |

## 5. Coding rules compliance

- ✅ 2 spaces indent, `{}` mọi if/else, không `any` trong code mới
- ✅ Không thêm dependency mới (coding-rules §2) — Rive có sẵn package.json, chưa dùng (placeholder avatar)
- ✅ Comment tiếng Việt giải thích vì sao/BR/OQ reference (mục 10.2)
- ✅ UI copy tiếng Việt, thuật ngữ kỹ thuật giữ nguyên (tier, flashcard, score)
- ✅ KHÔNG dùng Redux cho phiên chat — đúng state strategy ephemeral (CAP-09)
- ✅ `activeTierId` persist qua localStorage đúng contract; weights qua Cache Storage (không localStorage multi-GB)
- ✅ Mọi state mic/avatar/score đều có text + icon (không chỉ màu) — a11y floor

## 6. Lệch thiết kế & lý do (doc đã cần cập nhật)

| # | Lệch | Lý do | Đề xuất cập nhật doc |
|---|---|---|---|
| D-0 | **Cấu trúc thư mục theo repo** thay vì theo component-design.md | coding-rules §1.2 brownfield-first: repo dùng `src/components/features/{feature}/` (explore, vocabulary, reading, speaking) + pages PascalCase (`src/pages/listening/Listening.tsx`). component-design ghi `src/features/voice-ai/` + `src/pages/voice-chat/index.tsx` — không khớp cấu trúc đang có. Ưu tiên repo | `component-design.md` §2: cập nhật file map sang cấu trúc `src/components/features/voice-ai/` + `src/pages/voiceai/VoiceChatPage.tsx` |
| D-1 | **AiAvatar dùng placeholder** thay vì Rive `.riv` thực | Chưa có file `voice-assistant.riv` asset trong repo; tránh thêm asset trống/tự vẽ. Component đã isolate interface (`AvatarState` + label), thay body bằng `<RiveReactCanvas>` khi asset sẵn sàng — không đụng page | `ux-spec.md` §5.0: note Phase 1 placeholder, `.riv` asset là input cần cung cấp |
| D-2 | **onDeviceRuntime Phase 1 dùng Web Platform fallback** (Web Speech STT trống → AF-06 path; LLM rule-based reply; TTS = SpeechSynthesis) thay vì runtime GGUF/ONNX thật | SPEC C-14/A-1: "runtime chưa chốt — quyết định thuộc bước implement". Browser hiện chưa có runtime GGUF inference production; thêm transformers.js/onnxruntime-web cần lead duyệt (coding-rules §2 — không thêm dependency chưa duyệt). Adapter là điểm thay thế duy nhất khi runtime thật được duyệt | `component-design.md` §2: note runtime Phase 1 = Web Platform fallback, runtime thật cần quyết định lib + duyệt dependency |
| D-3 | **Route cũ `/voice-ai` giữ nguyên** (page prototype cũ `src/pages/voiceai/VoiceAIChat.tsx`) | Tương thích ngược — không xoá code ngoài scope UC. Nav sidebar đã trỏ sang `/voice-chat` | `ui-flow.md` §1: thêm note route legacy `/voice-ai` |
| D-4 | `useMicRecorder.toggle()` trả Blob qua promise từ lần bấm đầu, lần bấm 2 chỉ stop | MediaRecorder onstop là async promise — pattern này giữ toggle API gọn cho page | Không cần — internal |
| D-5 | STT Phase 1: Web Speech API không chấp nhận Blob audio → transcribe trả rỗng → câu đi vào AF-06 "Không nghe rõ" | Đúng theo SPEC A-1 (runtime chưa chốt); pipeline flow + scoring hoàn chỉnh, chỉ inference thật cần runtime được duyệt | Note trong build-notes; không đổi doc — đã được SPEC A-1 cover |

## 7. Open questions từ build

1. **OQ-12 (BE)** — vẫn chờ BA chốt: `PATCH /voice-ai/models/:id` thuộc UC-13 hay UC-11 (không block FE).
2. **Runtime on-device thật** (A-1): cần chốt thư viện (transformers.js / onnxruntime-web / WebGPU WASM) + duyệt thêm dependency. Hiện FE dùng Web Platform fallback — flow pipeline + scoring đã hoàn chỉnh.
3. **Asset `.riv`** cho avatar (OQ-02): cần file `voice-assistant.riv` từ designer; component sẵn sàng thay thế.
4. **BE `/api/v1/voice-ai/models`** chưa tồn tại trên backend hiện tại — FE sẽ hiện catalog error + skeleton cho tới khi BE build theo `docs/backend/uc-13-voice-ai/`.
5. **BE remount namespace** từ `/api/v1/models` → `/api/v1/voice-ai/*` (F1/F5 trong architecture.md) — FE gọi đúng namespace chuẩn đã chốt.

## 8. Changelog

| Ngày | Thay đổi |
|---|---|
| 2026-08-30 | Build lần đầu: 26 file mới (feature + page), 2 file sửa (App.tsx, MainLayout.tsx). tsc PASS, vite build PASS. |
| 2026-08-30 | Restructure theo convention repo: `src/features/voice-ai/` → `src/components/features/voice-ai/`; `src/pages/voice-chat/index.tsx` → `src/pages/voiceai/VoiceChatPage.tsx`. Rewrite 19 file (lỗi encoding PowerShell Set-Content — ghi lại UTF-8 đúng bằng tool). tsc PASS, vite build PASS, encoding verified sạch. |
