# Hệ thống Nông nghiệp Thông minh

![Bản quyền](https://img.shields.io/badge/Bản_quyền-Trường_Đại_học_Bách_Khoa_ĐHQG_TPHCM-blue)
![Ngôn ngữ](https://img.shields.io/badge/Ngôn_ngữ-Python_|_C++_|_JS-green)

Dự án Hệ thống Nông nghiệp Thông minh (Smart Farm OS) tích hợp bảng điều khiển (Dashboard) theo dõi thời tiết, hệ thống nhúng IoT quản lý cảm biến và trợ lý ảo (Chatbot) AI hỗ trợ nhận diện, tư vấn sâu bệnh trên cây trồng.

---

## Sinh viên thực hiện

- **Giảng viên hướng dẫn:** Thi Khắc Quân
- **Thành viên nhóm thực hiện:**
  - Trần Gia Bảo Anh - 2310148
  - Nguyễn Văn Hiếu - 2310967
  - Sẻ Thế Hưng - 2053079
  - Trần Quốc Nam - 2312197
  - Nguyễn Chí Tân - 2313053
  - Nguyễn Vạn Xuân - 2314019

---

## Hướng dẫn Cài đặt & Khởi chạy

Dự án được chia thành 3 phân hệ chính: **Frontend (Dashboard)**, **Backend (API & Chatbot)**, và **Embedded (IoT)**. Vui lòng thực hiện theo các bước dưới đây để thiết lập môi trường cho từng phân hệ.

### 1. Frontend (Dashboard)

**Cài đặt thư viện và khởi chạy:**
Mở terminal, di chuyển vào thư mục chứa code Frontend và chạy các lệnh sau:
```bash
npm install
npm run dev
```

**Cấu hình biến môi trường (.env):**
Tạo một file `.env` ở thư mục gốc của phần Frontend và thêm API Key của OpenWeather:
```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
```
> **Lưu ý:** API key này lấy ở OpenWeather. Bạn cần đăng ký tài khoản, đăng nhập và truy cập mục **Account > My API keys** để lấy.

---

### 2. Backend (FastAPI, Chatbot & Vision AI)

**Cài đặt thư viện Python:**
Mở terminal tại thư mục Backend và cài đặt các thư viện (Lưu ý tải đầy đủ thư viện phục vụ AI và Speech-to-Text):
```bash
pip install fastapi uvicorn pydub
```

**Cài đặt FFmpeg (Bắt buộc cho Pydub xử lý âm thanh):**
Mở PowerShell dưới quyền **Administrator** và chạy lệnh sau:
```powershell
winget install Gyan.FFmpeg
```

**Cấu hình biến môi trường (.env):**
Tạo file `.env` tại thư mục gốc của Backend với nội dung sau:
```env
gemini_api_key=your_gemini_api_key_here
path_to_ffmpeg=C:\path\to\your\ffmpeg.exe
```
> **Lưu ý:** Để lấy địa chỉ cứng của FFmpeg, mở PowerShell và gõ lệnh `(Get-Command ffmpeg).Source`. Copy đường dẫn xuất hiện và dán vào biến `path_to_ffmpeg`. Việc này đề phòng trường hợp pydub không tự tìm thấy FFmpeg.

**Khởi chạy Server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 3. Embedded / IoT (Cấu hình Vi điều khiển)

Phần cứng IoT được lập trình và quản lý bộ thư viện thông qua **PlatformIO**.

**Cài đặt PlatformIO:**
1. Tải và cài đặt [Visual Studio Code](https://code.visualstudio.com/).
2. Truy cập tab **Extensions**, tìm kiếm và cài đặt **PlatformIO IDE** (hoặc truy cập [PlatformIO Install](https://platformio.org/install)).

**Biên dịch (Build) Project:**
Mở **PlatformIO Core CLI** và chạy lệnh:
```bash
pio run -t upload
```

---
*Dự án được thực hiện nhằm mục đích học thuật và nghiên cứu ứng dụng AI/IoT vào Nông nghiệp.*
