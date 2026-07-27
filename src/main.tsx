import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── Đánh thức Backend từ sớm (Render Cold Start helper) ─────────────────────
// Gửi một request "fire-and-forget" siêu nhẹ đến root API '/' để đánh thức server
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
fetch(API_URL).catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
