# ✨ Cute Warrior Schedule & Money Tracker 🎀

![Version](https://img.shields.io/badge/version-2.0-pink?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web-brightgreen?style=for-the-badge)

> Một ứng dụng quản lý lịch trình cá nhân kết hợp theo dõi tài chính với giao diện **Neon Dark Cute** dành riêng cho các chiến thần chạy ship và làm việc tự do.

---

## 🌟 Tính năng nổi bật

* 🐱 **Mèo Tiên Tri (Smart Predictor):** Tự động tính toán giờ làm thực tế và dự đoán thu nhập dựa trên tiến độ công việc.
* 💰 **Quản lý thu nhập:** Ghi chép "lúa về" nhanh chóng qua Popup tiện lợi.
* 💔 **Nhật ký chi tiêu:** Theo dõi các khoản "bay màu", tự động lọc và xóa dữ liệu cũ sau 3 ngày để bảo mật và nhẹ máy.
* 🐖 **Quỹ Heo Đất:** Theo dõi tiến độ mục tiêu tài chính (10.000.000đ) với thanh Progress bar cực mượt.
* ☁️ **Đồng bộ Cloud:** Kết nối Firebase để dữ liệu luôn an toàn dù bạn đổi thiết bị.
* 🔔 **Thông báo Telegram:** Báo cáo ngay lập tức mỗi khi hoàn thành việc hoặc có biến động số dư.

---

## 🚀 Giao diện ứng dụng

| Chế độ Lịch trình | Nhật ký chi tiêu | Quỹ heo đất |
| :---: | :---: | :---: |
| ![Schedule](https://via.placeholder.com/200x400?text=Schedule+UI) | ![Expense](https://via.placeholder.com/200x400?text=Expense+UI) | ![Piggy](https://via.placeholder.com/200x400?text=Piggy+Bank) |

---

## 🛠 Cài đặt & Sử dụng

### 1. Yêu cầu
Bạn chỉ cần một trình duyệt web hiện đại (Chrome, Safari, Edge).

### 2. Cấu hình cá nhân (Quan trọng)
Để bảo mật, các thông tin API đã được ẩn. Bạn cần tạo file `config.js` hoặc cấu hình trong mã nguồn:
- **Firebase API:** Lưu trữ data.
- **Telegram Bot:** Nhận thông báo.

### 3. Triển khai lên GitHub Pages
1. Push code lên Repository của bạn.
2. Vào **Settings** > **Pages**.
3. Chọn nhánh `main` và bấm **Save**.

---

## 🛡 Bảo mật dữ liệu
Ứng dụng sử dụng **LocalStorage** làm bộ nhớ tạm và đồng bộ hóa qua **Firestore API**. Mọi thông tin nhạy cảm đều được cấu hình qua biến môi trường, không lưu trực tiếp trong mã nguồn công khai.

---

## 🎀 Đóng góp
Nếu bạn có ý tưởng giúp bé Mèo thông minh hơn, hãy thoải mái Fork và gửi Pull Request nhé!

---
Developed with ❤️ by [dth206]
