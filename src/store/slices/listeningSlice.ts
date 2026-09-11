/**
 * Listening Practice (UC-15) — trạng thái phiên luyện nghe
 * Design: docs/frontend/uc-15-listening/component-design.md §Trạng thái nội bộ (store slice)
 * Flow/state machine nằm ở src/hooks/useListeningSession.ts — slice chỉ giữ dữ liệu.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ListeningAnswerRecord,
  ListeningQuestionFeedback,
  ListeningSessionQuestion,
  ListeningSessionStatus,
  ListeningSubmitResponse,
} from "../../types/listening";

interface ListeningState {
  questions: ListeningSessionQuestion[];
  currentIndex: number;
  answers: Record<string, ListeningAnswerRecord>;
  submitted: Record<string, ListeningQuestionFeedback>;
  sessionStatus: ListeningSessionStatus;
  /** Audio src (URL/data URI) theo questionId — replay không gọi lại server (API-02) */
  audioCache: Record<string, string>;
  result: ListeningSubmitResponse | null;
}

const initialState: ListeningState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  submitted: {},
  sessionStatus: "idle",
  audioCache: {},
  result: null,
};

const listeningSlice = createSlice({
  name: "listening",
  initialState,
  reducers: {
    /** Về trạng thái ban đầu khi nạp phiên mới — giữ audioCache vì câu có thể lặp lại pool */
    resetSession(state) {
      state.questions = [];
      state.currentIndex = 0;
      state.answers = {};
      state.submitted = {};
      state.sessionStatus = "idle";
      state.result = null;
    },
    loadStarted(state) {
      state.sessionStatus = "loading";
      state.questions = [];
      state.currentIndex = 0;
      state.answers = {};
      state.submitted = {};
      state.result = null;
    },
    loadSucceeded(state, action: PayloadAction<ListeningSessionQuestion[]>) {
      state.questions = action.payload;
      state.sessionStatus = "ready";
    },
    /** AF-02: pool rỗng (ERR_NO_QUESTIONS_AVAILABLE hoặc questions rỗng) */
    loadEmpty(state) {
      state.sessionStatus = "empty";
    },
    /** AF-01: tải đề thất bại */
    loadFailed(state) {
      state.sessionStatus = "error";
    },
    submitAnswer(
      state,
      action: PayloadAction<{
        questionId: string;
        record: ListeningAnswerRecord;
        feedback: ListeningQuestionFeedback;
      }>,
    ) {
      const { questionId, record, feedback } = action.payload;
      state.answers[questionId] = record;
      state.submitted[questionId] = feedback;
    },
    setCurrentIndex(state, action: PayloadAction<number>) {
      state.currentIndex = action.payload;
    },
    finishStarted(state) {
      state.sessionStatus = "finishing";
    },
    finishSucceeded(state, action: PayloadAction<ListeningSubmitResponse>) {
      state.result = action.payload;
      state.sessionStatus = "finished";
    },
    /** AF-07: gửi kết quả thất bại — giữ nguyên dữ liệu phiên để gửi lại */
    finishFailed(state) {
      state.sessionStatus = "submit_error";
    },
    cacheAudio(state, action: PayloadAction<{ questionId: string; src: string }>) {
      state.audioCache[action.payload.questionId] = action.payload.src;
    },
  },
});

export const {
  resetSession,
  loadStarted,
  loadSucceeded,
  loadEmpty,
  loadFailed,
  submitAnswer,
  setCurrentIndex,
  finishStarted,
  finishSucceeded,
  finishFailed,
  cacheAudio,
} = listeningSlice.actions;

export type { ListeningState };
export default listeningSlice.reducer;
