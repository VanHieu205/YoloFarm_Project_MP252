npm install 
npm run dev

Đối với phần dasboard ta cần thêm 1 file .env với nội dung gồm
OPENWEATHER_API_KEY=API_key_cua_moi_nguoi
API key này lấy ở open weather
mọi người đăng ký tài khoản rồi đang nhập ở mục account của mọi người có My api key mọi người láy ở đó


###################
Đối với backend chạy lệnh:
uvicorn main:app --reload --host 0.0.0.0 --port 8000                    


Đối với chatbox mọi người tải thêm các thư viện cần thiết nha tại mình có sẵn hết nên không biết mọi người sẽ thiếu gì.
Tải cả thư viện speech to text nha mn.
tải pydup 
tải ffmpeg
Ở env thêm api của gemini
thêm địa chỉ cứng vào env bằng lệnh (Get-Command ffmpeg).Source
path_to_ffmpeg=địa chỉ của bn
Cái này đề phòng trường hợp pydup ko tìm thấy địa chỉ
gemini_api_key=Apikey_cua_mn





