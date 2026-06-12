# MinLish Frontend 🚀

> 🔗 **Đường dẫn truy cập bản Demo trực tiếp (Live Demo):** [https://minlish-frontend.vercel.app/](https://minlish-frontend.vercel.app/) \
> **Lần truy cập đầu tiên sẽ mất khoảng 1 phut do Server Backend (Render) thuc hien Cold Restart - Vẫn ổn cho môi trường phát triển, sẽ triển khai dịch vụ khác khi demo chuẩn production**

MinLish là nền tảng học từ vựng Tiếng Anh hiện đại, được xây dựng với mục tiêu mang lại trải nghiệm học tập tối ưu, giao diện đẹp mắt và tốc độ phản hồi nhanh chóng. 

Phần mã nguồn này quản lý toàn bộ giao diện (Frontend) của ứng dụng, được xây dựng dựa trên **React**, **Vite** và **TypeScript**.

---

## 📁 Cấu trúc thư mục dự án (Folder Structure)

Thư mục nguồn `src` được thiết kế theo cấu trúc mô-đun hóa rõ ràng, dễ bảo trì và mở rộng:

```text
minlish-frontend/
├── src/
│   ├── api/          # Các định nghĩa gọi API cụ thể cho từng tài nguyên (vocab, user, progress...)
│   ├── components/   # Các UI Component dùng chung (Button, Card, Input, Modal, Layout...)
│   ├── hooks/        # Custom React Hooks tự định nghĩa (useAuth, useFetch...)
│   ├── lib/          # Khởi tạo thư viện dùng chung (cấu hình Axios instance, interceptors...)
│   │   ├── api.ts          # Axios client chính, tự động xử lý đính kèm Token và Auto-Refresh Token
│   │   ├── formErrors.ts   # Tiện ích quản lý và hiển thị lỗi form
│   │   └── utils.ts        # Các hàm tiện ích logic phụ trợ
│   ├── pages/        # Các trang màn hình chính (Màn hình Học, Dashboard, Từ vựng, Auth...)
│   ├── store/        # Quản lý State toàn cục của ứng dụng (Zustand / Redux...)
│   ├── types/        # Khai báo các Type/Interface TypeScript dùng chung trong toàn bộ app
│   ├── App.tsx       # Component gốc quản lý Routing và hiển thị layout chung
│   ├── index.css     # Định nghĩa thiết kế hệ thống CSS toàn cục và các biến Style
│   ├── main.tsx      # Điểm khởi đầu (Entry Point) của ứng dụng React
│   └── vite-env.d.ts # Khai báo kiểu dữ liệu cho các biến môi trường của Vite
├── index.html        # File template HTML gốc của ứng dụng
├── tsconfig.json     # Cấu hình biên dịch TypeScript của dự án
└── vite.config.ts    # Cấu hình công cụ đóng gói Vite
```

---

## ⚡ Các kế hoạch & Tính năng hạ tầng đã thực thi

Đến thời điểm hiện tại, dự án đã hoàn thành thiết lập các cấu hình môi trường và tối ưu hóa hạ tầng kết nối Production:

### 1. Cơ chế Đánh thức Backend thông minh (Cold Start Wake-up Ping)
*   **Vấn đề**: Backend của hệ thống deploy trên gói Free của Render sẽ tự "ngủ đông" sau 15 phút không có hoạt động. Khi người dùng truy cập web, việc chờ đợi máy chủ khởi động (cold start) thường mất 30–50 giây.
*   **Giải pháp**: Tích hợp đoạn mã gọi API ngầm siêu nhẹ dạng *fire-and-forget* ngay tại điểm khởi đầu của ứng dụng (`src/main.tsx`):
    ```typescript
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(API_URL).catch(() => {});
    ```
*   **Hiệu quả**: Ngay khi giao diện HTML vừa được tải và nạp mã JavaScript, trình duyệt sẽ lập tức bắn tín hiệu đánh thức backend trước, chạy song song với quá trình hiển thị UI, giúp giảm thiểu tối đa thời gian chờ đợi của người dùng khi bắt đầu thao tác đăng nhập.

### 2. Cấu hình bảo mật CORS & Khả năng phát triển linh hoạt
*   Phần kết nối API hỗ trợ CORS Whitelist động. Cho phép các cổng chạy local linh hoạt như `5173`, `5174` (port Vite mặc định và sơ phòng) và `3000` được phép giao tiếp thông suốt với Backend mà không bị lỗi trình duyệt chặn.
*   Hỗ trợ cơ chế kết nối từ các thiết bị không có Origin (như Mobile App sau này, Postman, tool test) thông qua kiểm tra logic ở Backend.

### 3. Quy trình CI/CD tự động hóa hoàn chỉnh (Continuous Integration & Deployment)
*   **Frontend**: Tự động Deploy lên **Vercel** mỗi khi lập trình viên thực hiện push code lên nhánh `main` của GitHub.
*   **Backend**: Tự động Deploy lên **Render** (đồng bộ qua Blueprint của `render.yaml`), quản lý tự động toàn bộ hạ tầng từ compile TypeScript cho tới khởi chạy Node.js.
*   **Bảo mật môi trường**: File `.gitignore` được cấu hình nghiêm ngặt để giữ các file chứa thông tin nhạy cảm của nhà phát triển (`.env.local`, `.env.production.local`) tách biệt khỏi GitHub, cấu hình biến môi trường an toàn trực tiếp trên Cloud Dashboard.

---

## 🛠️ Hướng dẫn phát triển dưới Local (Local Development)

### 1. Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

### 2. Cấu hình biến môi trường:
Tạo file `.env.local` ở thư mục gốc của frontend và cấu hình API URL trỏ về backend chạy local của bạn:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Chạy Server phát triển (Local Dev Server):
```bash
npm run dev
```
Mặc định ứng dụng sẽ khởi chạy tại: `http://localhost:5173` (hoặc tự động đổi sang `http://localhost:5174` nếu cổng 5173 đã bị chiếm dụng).

### 4. Đóng gói sản phẩm (Build Production):
```bash
npm run build
```
Code sau khi tối ưu và build xong sẽ nằm trong thư mục `dist`, sẵn sàng để deploy lên môi trường Hosting thực tế.
