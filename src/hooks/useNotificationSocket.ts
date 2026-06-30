import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../store";
import { addReceivedNotification } from "../store/slices/notificationSlice";
import { toast } from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useNotificationSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Chỉ kết nối socket nếu user đã đăng nhập và có token hợp lệ
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Khởi tạo connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Connected to Notification Socket.IO server!");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Notification Socket connection error:", error.message);
    });

    // Lắng nghe thông báo thời gian thực dành cho User / Admin
    socket.on("new_notification", (notification: any) => {
      console.log("🔔 Real-time notification received:", notification);
      
      // Đẩy vào Redux Store ngay lập tức
      dispatch(addReceivedNotification(notification));

      // Hiển thị một Toast popup đẹp đẽ lên màn hình
      toast(
        React.createElement("div", { className: "flex flex-col gap-1" },
          React.createElement("span", { className: "font-bold text-xs text-slate-800" }, notification.title),
          React.createElement("span", { className: "text-[11px] text-slate-500 leading-snug" }, notification.message)
        ),
        {
          duration: 6000,
          position: "top-right",
          icon: notification.type === "report" ? "📋" : "🤖",
          style: {
            borderRadius: "16px",
            background: "#fff",
            color: "#333",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0",
            padding: "12px",
          },
        }
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, dispatch]);

  return socketRef.current;
};
