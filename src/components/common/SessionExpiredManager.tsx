import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SessionExpiredManager() {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = () => {
      setShow(true);
      setCountdown(5);
    };

    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  useEffect(() => {
    if (!show) return;
    if (countdown <= 0) {
      setShow(false);
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [show, countdown, navigate]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <div className="w-8 h-8 rounded-full border-4 border-red-200 border-t-red-500 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 font-headline-md">Session Expired</h3>
        <p className="text-sm text-slate-500 mb-6 font-sans">
          Your session has expired. Please log in again to continue learning. You will be redirected in <span className="font-bold text-red-500">{countdown}s</span>...
        </p>
        <button
          onClick={() => {
            setShow(false);
            navigate("/login");
          }}
          className="w-full py-2 bg-[#1000a3] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Log In Now
        </button>
      </div>
    </div>
  );
}
