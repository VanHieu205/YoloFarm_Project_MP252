"""
API routes cho hệ thống RAG chatbot
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
from datetime import datetime
import os
import logging
import re
import tempfile
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import subprocess

# Load environment variables
load_dotenv()

from ML.rag_engine import RAGEngine
from ML.initialize_rag import initialize_rag_engine
from core.database import get_connection, close_connection
from mqtt_publisher import mqtt_publisher


# Cấu hình logging
logger = logging.getLogger(__name__)

# Import speech_recognition cho xử lý âm thanh
try:
    import speech_recognition as sr
except ImportError:
    sr = None
    logger.warning("⚠️ SpeechRecognition không được cài đặt. Voice chat sẽ không hoạt động.")

# Import audio processing
try:
    from pydub import AudioSegment
    import shutil
    # Thử tìm FFmpeg từ PATH hoặc hardcode common paths
    ffmpeg_path = shutil.which("ffmpeg") or os.getenv("path_to_ffmpeg")
    if not ffmpeg_path:
        # Hardcode common Windows locations (including WinGet)
        common_paths = [
            r"C:\Users\ACER\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe",
            r"C:\Program Files\FFmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\FFmpeg\bin\ffmpeg.exe",
            r"C:\ffmpeg\bin\ffmpeg.exe",
        ]
        for path in common_paths:
            if os.path.exists(path):
                ffmpeg_path = path
                break
    
    if ffmpeg_path:
        AudioSegment.converter = ffmpeg_path
        logger.info(f"✓ FFmpeg found: {ffmpeg_path}")
    else:
        logger.warning("⚠️ FFmpeg binary không tìm thấy - voice chat sẽ dùng fallback")
        
except ImportError:
    AudioSegment = None
    logger.warning("⚠️ PyDub không được cài đặt. Audio conversion sẽ không hoạt động.")

router = APIRouter()

# ==================== WEB SEARCH & LOADER TOOLS ====================

class WebSearchTool:
    """Tool để tìm kiếm thông tin về bệnh cây trên web"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.timeout = 10
    
    def search(self, query: str, max_results: int = 3) -> List[Dict]:
        """
        Tìm kiếm thông tin về bệnh cây
        
        Args:
            query: Từ khóa tìm kiếm
            max_results: Số kết quả tối đa
            
        Returns:
            Danh sách kết quả tìm kiếm
        """
        results = []
        try:
            # Ví dụ: Có thể integrate với Google Search API, Bing API trong tương lai
            # Hiện tại trả về empty hoặc kết quả mock
            logger.info(f"🔍 Tìm kiếm: {query} (max {max_results} kết quả)")
            # TODO: Integrate real search API here
        except Exception as e:
            logger.error(f"Lỗi khi tìm kiếm: {e}")
        
        return results

class WebLoaderTool:
    """Tool để tải nội dung từ web"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.timeout = 10
        self.max_content_length = 5000  # Giới hạn 5000 ký tự
    
    def load_from_url(self, url: str) -> Optional[Dict]:
        """
        Tải nội dung từ một URL
        
        Args:
            url: URL cần tải
            
        Returns:
            Dict chứa {url, title, content} hoặc None nếu thất bại
        """
        try:
            logger.info(f"⬇️ Tải nội dung từ: {url}")
            
            response = requests.get(
                url, 
                headers=self.headers, 
                timeout=self.timeout,
                verify=False  # Bỏ qua SSL verification (cho dev)
            )
            response.encoding = 'utf-8'
            
            if response.status_code != 200:
                logger.warning(f"⚠️ HTTP {response.status_code} từ {url}")
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Lấy tiêu đề
            title = soup.find('title')
            title_text = title.string if title else url
            
            # Xóa script và style
            for element in soup(["script", "style", "nav", "footer"]):
                element.decompose()
            
            # Lấy text content
            text = soup.get_text(separator='\n', strip=True)
            
            # Giới hạn kích thước
            if len(text) > self.max_content_length:
                text = text[:self.max_content_length] + "..."
            
            logger.info(f"✓ Đã tải: {title_text} ({len(text)} ký tự)")
            
            return {
                'url': url,
                'title': title_text,
                'content': text,
                'content_length': len(text)
            }
        
        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Timeout khi tải {url}")
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 Lỗi kết nối: {e}")
        except Exception as e:
            logger.error(f"❌ Lỗi tải URL {url}: {e}")
        
        return None
    
    def load_from_urls(self, urls: List[str]) -> List[Dict]:
        """
        Tải nội dung từ nhiều URL
        
        Args:
            urls: Danh sách URL
            
        Returns:
            Danh sách nội dung được tải thành công
        """
        results = []
        for url in urls:
            result = self.load_from_url(url)
            if result:
                results.append(result)
        return results

# ==================== DANH SÁCH LỆNH ĐIỀU KHIỂN ====================

DEVICE_COMMANDS = {
    # Bơm nước
    r"bật.*bơm|bật.*máy bơm|chạy.*bơm|khởi động.*bơm|mở.*van.*nước|tưới.*nước": ("pump", "on"),
    r"tắt.*bơm|dừng.*bơm|đóng.*van.*nước|cắt.*bơm|dừng.*tưới": ("pump", "off"),
    
    # Đèn
    r"bật.*đèn|bật.*ánh sáng|khởi động.*đèn|mở.*đèn": ("light", "on"),
    r"tắt.*đèn|tắt.*ánh sáng|đóng.*đèn|tắt.*sáng": ("light", "off"),
    
    # Quạt
    r"bật.*quạt|chạy.*quạt|khởi động.*quạt|tăng.*gió|mở.*quạt": ("fan", "on"),
    r"tắt.*quạt|dừng.*quạt|giảm.*gió|đóng.*quạt": ("fan", "off"),
}

# ==================== HỖ TRỢ LỆNH AUTOMATION ====================

AUTOMATION_COMMANDS = {
    r"bật.*tự động|kích hoạt.*automation|khởi động.*automation": "activate",
    r"tắt.*tự động|dừng.*automation|tắt.*automation": "deactivate",
    r"xem.*automation|hiển thị.*automation|danh sách.*automation": "list",
}

# ==================== HÀM HỖ TRỢ ====================

def parse_device_command(message: str) -> Optional[tuple]:
    """
    Phân tích tin nhắn để phát hiện lệnh điều khiển thiết bị
    
    Args:
        message: Tin nhắn từ người dùng
        
    Returns:
        Tuple (device_type, action) hoặc None nếu không phải lệnh thiết bị
    """
    message_lower = message.lower()
    
    for pattern, (device, action) in DEVICE_COMMANDS.items():
        if re.search(pattern, message_lower):
            return (device, action)
    
    return None

def parse_automation_command(message: str) -> Optional[str]:
    """
    Phân tích tin nhắn để phát hiện lệnh automation
    """
    message_lower = message.lower()
    
    for pattern, action in AUTOMATION_COMMANDS.items():
        if re.search(pattern, message_lower):
            return action
    
    return None

def execute_device_command(device_type: str, action: str, user_id: str) -> str:
    """
    Thực hiện lệnh điều khiển thiết bị
    Tái sử dụng logic từ device_routes
    
    Args:
        device_type: Loại thiết bị (pump, light, fan)
        action: Hành động (on/off)
        user_id: ID người dùng
        
    Returns:
        Tin nhắn phản hồi
    """
    try:
        connect = get_connection()
        cursor = connect.cursor(dictionary=True)
        
        # Tìm thiết bị theo loại
        query = """
        SELECT device_id, name, type FROM devices 
        WHERE user_id = %s AND type = %s LIMIT 1
        """
        cursor.execute(query, (user_id, device_type))
        device = cursor.fetchone()
        close_connection(connect, cursor)
        
        if not device:
            return f"❌ Không tìm thấy thiết bị loại '{device_type}'. Vui lòng thêm thiết bị trước."
        
        device_id = device['device_id']
        is_on = action.lower() == "on"
        
        # Cập nhật trạng thái trong database (giống device_routes)
        connect = get_connection()
        cursor = connect.cursor()
        
        if is_on:
            query = "UPDATE devices SET is_on = TRUE, last_updated = NOW() WHERE device_id = %s"
            success = mqtt_publisher.turn_on_device(device_id)
            action_text = "bật"
        else:
            query = "UPDATE devices SET is_on = FALSE, last_updated = NOW() WHERE device_id = %s"
            success = mqtt_publisher.turn_off_device(device_id)
            action_text = "tắt"
        
        cursor.execute(query, (device_id,))
        connect.commit()
        close_connection(connect, cursor)
        
        if success:
            return f"✓ Đã {action_text} {device['name']} thành công!"
        else:
            return f"⚠️ Lệnh {action_text} {device['name']} đã được gửi nhưng có thể không nhận được."
        
    except Exception as e:
        logger.error(f"Lỗi khi điều khiển thiết bị: {e}")
        return f"❌ Lỗi: {str(e)}"

def execute_automation_command(action: str, user_id: str) -> str:
    """
    Thực hiện lệnh automation
    Tái sử dụng logic từ automation_routes
    """
    try:
        connect = get_connection()
        cursor = connect.cursor(dictionary=True)
        
        if action == "list":
            # Lấy danh sách automation (từ automation_routes.get_all_automations)
            query = """
            SELECT
                tc.config_id,
                tr.rule_id,
                d.name as target_device_name,
                tr.sensor_type,
                tr.operator,
                tr.threshold_value,
                tr.action,
                tc.is_active,
                tc.created_at
            FROM threshold_config tc
            JOIN threshold_rules tr ON tc.config_id = tr.config_id
            LEFT JOIN devices d ON tr.target_device_id = d.device_id
            JOIN devices owner_device ON tc.device_id = owner_device.device_id
            WHERE owner_device.user_id = %s
            ORDER BY tc.created_at DESC
            """
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            close_connection(connect, cursor)
            
            if not rows:
                return "📋 Bạn chưa có automation nào."
            
            response = f"📋 Danh sách {len(rows)} automation của bạn:\n\n"
            for i, row in enumerate(rows, 1):
                status = "✓ Bật" if row['is_active'] else "✗ Tắt"
                response += f"{i}. {status} - Rule #{row['rule_id']}\n"
            
            return response
        
        else:
            return "⚠️ Lệnh automation này chưa được hỗ trợ. Hãy dùng web hoặc app để quản lý."
        
    except Exception as e:
        logger.error(f"Lỗi khi xử lý automation: {e}")
        return f"❌ Lỗi: {str(e)}"

# ==================== HỖ TRỢ XỬ LÝ ÂM THANH ====================

def convert_audio_to_wav(audio_path: str, output_format: str = "wav") -> str:
    """
    Convert audio file về định dạng WAV cho SpeechRecognition
    Hỗ trợ: WebM, MP3, OGG, Opus, FLAC, etc.
    
    Thử 2 cách:
    1. PyDub (nếu FFmpeg có sẵn)
    2. Subprocess call FFmpeg direct (fallback)
    
    Args:
        audio_path: Đường dẫn file audio gốc
        output_format: Format đầu ra (mặc định: wav)
        
    Returns:
        Đường dẫn file WAV được convert
        
    Raises:
        Exception nếu không thể convert
    """
    output_path = audio_path.rsplit('.', 1)[0] + '.wav'
    
    try:
        logger.info(f"🔄 Chuyển đổi audio: {audio_path} → {output_path}")
        
        file_ext = os.path.splitext(audio_path)[1].lower().strip('.')
        logger.info(f"📋 Format gốc: {file_ext}")
        
        # CÁCH 1: Thử PyDub
        if AudioSegment is not None:
            try:
                logger.info("🔹 Cách 1: Thử PyDub...")
                if file_ext in ['webm', 'mp3', 'ogg', 'opus', 'm4a', 'aac', 'flac']:
                    audio = AudioSegment.from_file(audio_path, format=file_ext)
                else:
                    audio = AudioSegment.from_file(audio_path)
                
                audio.export(output_path, format='wav')
                logger.info(f"✓ PyDub thành công: {output_path} ({os.path.getsize(output_path)} bytes)")
                return output_path
            except Exception as e:
                logger.warning(f"⚠️ PyDub thất bại: {e}")
        
        # CÁCH 2: Thử subprocess call FFmpeg trực tiếp
        logger.info("🔹 Cách 2: Thử FFmpeg subprocess...")
        
        ffmpeg_paths = [
            # WinGet installation path
            r"C:\Users\ACER\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe",
            # Common paths
            r"C:\Program Files\FFmpeg\bin\ffmpeg.exe",
            r"C:\Program Files (x86)\FFmpeg\bin\ffmpeg.exe",
            r"C:\ffmpeg\bin\ffmpeg.exe",
            "ffmpeg"  # Hoặc từ PATH
        ]
        
        ffmpeg_exe = None
        for path in ffmpeg_paths:
            try:
                result = subprocess.run([path, "-version"], capture_output=True, timeout=2)
                if result.returncode == 0:
                    ffmpeg_exe = path
                    logger.info(f"   ✓ FFmpeg found: {path}")
                    break
            except:
                continue
        
        if not ffmpeg_exe:
            raise Exception("FFmpeg executable không tìm thấy")
        
        # Call FFmpeg để convert
        cmd = [
            ffmpeg_exe,
            "-i", audio_path,
            "-acodec", "pcm_s16le",  # WAV codec
            "-ar", "16000",  # 16kHz sample rate (tối ưu cho speech recognition)
            "-ac", "1",  # Mono
            "-y",  # Overwrite output file
            output_path
        ]
        
        logger.info(f"   📡 Chạy: {' '.join(cmd[:3])}... → {output_path}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            logger.error(f"   ❌ FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        if not os.path.exists(output_path):
            raise Exception("Output file không được tạo")
        
        file_size = os.path.getsize(output_path)
        logger.info(f"✓ FFmpeg thành công: {output_path} ({file_size} bytes)")
        return output_path
        
    except Exception as e:
        logger.error(f"❌ Lỗi convert audio: {type(e).__name__}: {e}")
        raise Exception(f"Không thể convert audio: {str(e)}")

def get_audio_format(audio_path: str) -> str:
    """
    Phát hiện định dạng audio từ magic bytes hoặc extension
    
    Args:
        audio_path: Đường dẫn file audio
        
    Returns:
        Tên format (webm, mp3, wav, etc.)
    """
    # Đầu tiên kiểm tra extension
    ext = os.path.splitext(audio_path)[1].lower().strip('.')
    if ext in ['webm', 'mp3', 'wav', 'ogg', 'opus', 'm4a', 'aac', 'flac']:
        return ext
    
    # Nếu không rõ, kiểm tra magic bytes (file signature)
    try:
        with open(audio_path, 'rb') as f:
            header = f.read(12)
            
            # WebM/Matroska
            if header.startswith(b'\x1a\x45\xdf\xa3'):
                return 'webm'
            # WAV
            if header.startswith(b'RIFF') and header[8:12] == b'WAVE':
                return 'wav'
            # MP3
            if header[:2] == b'\xff\xfb' or header[:2] == b'\xff\xfa':
                return 'mp3'
            # OGG
            if header.startswith(b'OggS'):
                return 'ogg'
            # Opus (thường là OGG Opus)
            if header.startswith(b'OggS'):
                return 'opus'
            # FLAC
            if header.startswith(b'fLaC'):
                return 'flac'
            # AAC (ADTS)
            if header[:2] == b'\xff\xf1' or header[:2] == b'\xff\xf9':
                return 'aac'
            
            logger.warning(f"⚠️ Không thể xác định format từ magic bytes: {header[:4].hex()}")
            return 'unknown'
    except Exception as e:
        logger.warning(f"⚠️ Lỗi khi phát hiện format: {e}")
        return 'unknown'

# ==================== KHỞI TẠO RAG ENGINE ====================

def get_rag_engine():
    """Lấy RAG Engine instance (lazy initialization)"""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = initialize_rag_engine(force_reinit=False)
    return _rag_engine

def get_web_search_tool():
    """Lấy WebSearchTool instance"""
    global _web_search_tool
    if _web_search_tool is None:
        _web_search_tool = WebSearchTool()
    return _web_search_tool

def get_web_loader_tool():
    """Lấy WebLoaderTool instance"""
    global _web_loader_tool
    if _web_loader_tool is None:
        _web_loader_tool = WebLoaderTool()
    return _web_loader_tool

# Khởi tạo global instances
_rag_engine = None
_web_search_tool = None
_web_loader_tool = None

class ChatRequest(BaseModel):
    user_id: str
    message: str
    system_prompt: Optional[str] = None

class ChatHistoryResponse(BaseModel):
    chat_id: str
    user_id: str
    user_message: str
    bot_response: str
    timestamp: str
    context_used: Optional[List[dict]] = None

@router.post("/chat")
def chat_endpoint(req: ChatRequest):
    """
    Endpoint chính để chat với RAG chatbot
    
    Args:
        user_id: ID của người dùng
        message: Câu hỏi/thông điệp của người dùng
        system_prompt: Custom system prompt (tùy chọn)
    
    Returns:
        {
            "success": True,
            "chat_id": "...",
            "response": "Phản hồi từ chatbot",
            "context_used": [...],
            "timestamp": "..."
        }
    """
    try:
        chat_id = str(uuid.uuid4())
        
        # BƯỚC 1: Kiểm tra lệnh automation
        automation_cmd = parse_automation_command(req.message)
        if automation_cmd:
            response_msg = execute_automation_command(automation_cmd, req.user_id)
            logger.info(f"Lệnh automation: {automation_cmd} -> Phản hồi gửi")
            
            return {
                "success": True,
                "chat_id": chat_id,
                "response": response_msg,
                "context_used": [],
                "timestamp": datetime.now().isoformat(),
                "type": "automation_query"
            }
        
        # BƯỚC 2: Kiểm tra xem có phải lệnh điều khiển thiết bị không
        device_command = parse_device_command(req.message)
        if device_command:
            device_type, action = device_command
            response_msg = execute_device_command(device_type, action, req.user_id)
            logger.info(f"Lệnh thiết bị: {device_type} {action} -> {response_msg}")
            
            return {
                "success": True,
                "chat_id": chat_id,
                "response": response_msg,
                "context_used": [],
                "timestamp": datetime.now().isoformat(),
                "type": "device_control"
            }
        
        # BƯỚC 3: Nếu không phải lệnh thiết bị, gọi RAG chatbot
        try:
            rag_engine = get_rag_engine()
        except ValueError as e:
            # Lỗi khởi tạo RAG Engine (thường là API key)
            logger.error(f"Lỗi khởi tạo RAG Engine: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        
        # Gọi RAG để tạo phản hồi
        try:
            result = rag_engine.chat(req.message, req.system_prompt)
        except Exception as e:
            error_detail = str(e)
            logger.error(f"Lỗi khi gọi RAG chat: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Lưu lịch sử chat vào database
        connect = get_connection()
        cursor = connect.cursor()
        
        try:
            # Tạo bảng nếu chưa tồn tại
            create_table = """
                CREATE TABLE IF NOT EXISTS chatbot_history (
                    chat_id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_message TEXT NOT NULL,
                    bot_response LONGTEXT NOT NULL,
                    context_count INT DEFAULT 0,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    INDEX idx_chatbot_user (user_id, timestamp)
                )
            """
            cursor.execute(create_table)
            connect.commit()
            
            # Lưu chat
            insert_query = """
                INSERT INTO chatbot_history (
                    chat_id, user_id, user_message, bot_response, 
                    context_count, timestamp
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                chat_id,
                req.user_id,
                req.message,
                result['response'],
                len(result['context_used']),
                datetime.now()
            ))
            connect.commit()
        except Exception as e:
            logger.error(f"Lỗi khi lưu chat history: {e}")
        finally:
            close_connection(connect, cursor)
        
        # Trả về phản hồi
        return {
            "success": True,
            "chat_id": chat_id,
            "response": result['response'],
            "context_used": [
                {
                    "disease": ctx['metadata'].get('disease_name', 'N/A'),
                    "crop": ctx['metadata'].get('crop', 'N/A'),
                    "relevance": f"{ctx['relevance']:.2%}"
                }
                for ctx in result['context_used']
            ],
            "timestamp": result['timestamp'],
            "type": "rag_response"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/voice")
async def chat_voice_endpoint(
    user_id: str = Form(...),
    audio_file: UploadFile = File(...),
    system_prompt: Optional[str] = Form(None)
):
    """
    Endpoint để chat bằng giọng nói
    Hỗ trợ: WAV, MP3, WebM, OGG, FLAC, AAC, Opus, etc.
    
    Args:
        user_id: ID của người dùng
        audio_file: File âm thanh
        system_prompt: Custom system prompt (tùy chọn)
    
    Returns:
        Giống như /chat endpoint nhưng nhận input là âm thanh
    """
    if sr is None:
        logger.error("❌ Speech recognition không được cài đặt")
        raise HTTPException(
            status_code=500,
            detail="Speech recognition không được cài đặt. Cài đặt: pip install SpeechRecognition"
        )
    
    temp_path = None
    converted_path = None
    try:
        # Lưu file tạm thời (cross-platform)
        logger.info(f"🎤 Nhận audio file: {audio_file.filename} ({audio_file.size} bytes)")
        
        # Tạo temp file
        fd, temp_path = tempfile.mkstemp(suffix='')  # Không specify extension chưa
        os.close(fd)
        
        # Ghi dữ liệu audio
        content = await audio_file.read()
        logger.info(f"📊 Kích thước file audio: {len(content)} bytes, lưu vào: {temp_path}")
        
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Phát hiện format audio
        detected_format = get_audio_format(temp_path)
        logger.info(f"📋 Format audio phát hiện: {detected_format}")
        
        # Nếu không phải WAV, convert sang WAV
        wav_path = temp_path
        if detected_format != 'wav' and detected_format != 'unknown':
            logger.info(f"🔄 Chuyển đổi {detected_format.upper()} → WAV...")
            try:
                converted_path = convert_audio_to_wav(temp_path)
                wav_path = converted_path
            except Exception as e:
                logger.warning(f"⚠️ Không thể convert: {e}. Thử đọc ngay với SR...")
                # Vẫn thử đọc file gốc
                wav_path = temp_path
        
        # Kiểm tra file tồn tại
        if not os.path.exists(wav_path):
            logger.error(f"❌ Không thể tạo/tìm file audio tại: {wav_path}")
            raise Exception("Không thể tạo file tạm thời")
        
        logger.info(f"✓ File audio sẵn sàng: {wav_path} ({os.path.getsize(wav_path)} bytes)")
        
        # Chuyển âm thanh thành text
        logger.info("🎤 Bắt đầu nhận diện giọng nói...")
        recognizer = sr.Recognizer()
        
        try:
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                logger.info(f"✓ Đã tải audio ({len(audio_data.frame_data)} frames), bắt đầu nhận diện...")
        except Exception as e:
            logger.error(f"❌ Lỗi khi đọc file audio: {type(e).__name__}: {e}")
            raise Exception(f"Lỗi khi đọc file audio. Format có thể không hỗ trợ: {str(e)}")
        
        try:
            logger.info("🌐 Gửi tới Google Speech Recognition API...")
            transcribed_text = recognizer.recognize_google(audio_data, language='vi-VN')
            logger.info(f"✓ Nhận diện thành công: '{transcribed_text}'")
        except sr.UnknownValueError as e:
            logger.warning(f"⚠️ Không thể nhận diện giọng nói (âm thanh không rõ ràng)")
            raise HTTPException(
                status_code=400,
                detail="Không thể nhận diện giọng nói. Vui lòng nói rõ ràng hơn và thử lại."
            )
        except sr.RequestError as e:
            logger.error(f"🌐 Lỗi dịch vụ Google Speech Recognition: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Lỗi dịch vụ nhận diện giọng nói: {str(e)}"
            )
        
        # Gọi chat endpoint với text đã chuyển đổi
        chat_req = ChatRequest(
            user_id=user_id,
            message=transcribed_text,
            system_prompt=system_prompt
        )
        
        result = chat_endpoint(chat_req)
        logger.info(f"✓ Chat hoàn thành cho user {user_id}")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Lỗi trong endpoint voice chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")
    finally:
        # Xóa file tạm
        for file_path in [temp_path, converted_path]:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.debug(f"🗑️ Đã xóa file temp: {file_path}")
                except Exception as e:
                    logger.warning(f"⚠️ Không thể xóa file temp {file_path}: {e}")

@router.get("/chat/history/{user_id}")
def get_chat_history(user_id: str, limit: int = 20):
    """
    Lấy lịch sử chat của người dùng
    
    Args:
        user_id: ID của người dùng
        limit: Số chat tối đa cần lấy
    
    Returns:
        Danh sách chat history
    """
    connect = get_connection()
    cursor = connect.cursor(dictionary=True)
    
    try:
        # Kiểm tra bảng có tồn tại không
        check_table = """
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'yolofarm' 
            AND table_name = 'chatbot_history'
        """
        cursor.execute(check_table)
        table_exists = cursor.fetchone()['count'] > 0
        
        if not table_exists:
            # Tạo bảng nếu chưa tồn tại
            create_table = """
                CREATE TABLE IF NOT EXISTS chatbot_history (
                    chat_id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_message TEXT NOT NULL,
                    bot_response LONGTEXT NOT NULL,
                    context_count INT DEFAULT 0,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    INDEX idx_chatbot_user (user_id, timestamp)
                )
            """
            cursor.execute(create_table)
            connect.commit()
            print("✓ Đã tạo bảng chatbot_history")
        
        query = """
            SELECT chat_id, user_id, user_message, bot_response, timestamp, context_count
            FROM chatbot_history
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, limit))
        results = cursor.fetchall()
        
        # Chuyển datetime objects thành string
        formatted_results = []
        for row in results:
            if row.get('timestamp'):
                row['timestamp'] = row['timestamp'].isoformat() if hasattr(row['timestamp'], 'isoformat') else str(row['timestamp'])
            formatted_results.append(row)
        
        return {
            "success": True,
            "user_id": user_id,
            "total": len(formatted_results),
            "history": formatted_results
        }
    
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")
    finally:
        close_connection(connect, cursor)

@router.delete("/chat/history/{chat_id}")
def delete_chat(chat_id: str):
    """
    Xóa một chat history
    
    Args:
        chat_id: ID của chat cần xóa
    """
    connect = get_connection()
    cursor = connect.cursor()
    
    try:
        query = "DELETE FROM chatbot_history WHERE chat_id = %s"
        cursor.execute(query, (chat_id,))
        connect.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Chat không tồn tại")
        
        return {
            "success": True,
            "message": "Chat đã được xóa"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connect, cursor)

@router.get("/chat/stats")
def get_chatbot_stats():
    """
    Lấy thống kê về chatbot
    
    Returns:
        {
            "total_chats": số chat tổng cộng,
            "unique_users": số user duy nhất,
            "rag_stats": thống kê vector store
        }
    """
    try:
        rag_engine = get_rag_engine()
        rag_stats = rag_engine.get_collection_stats()
        
        connect = get_connection()
        cursor = connect.cursor(dictionary=True)
        
        # Thống kê từ database
        cursor.execute("SELECT COUNT(*) as total_chats FROM chatbot_history")
        total_chats = cursor.fetchone()['total_chats']
        
        cursor.execute("SELECT COUNT(DISTINCT user_id) as unique_users FROM chatbot_history")
        unique_users = cursor.fetchone()['unique_users']
        
        close_connection(connect, cursor)
        
        return {
            "success": True,
            "total_chats": total_chats,
            "unique_users": unique_users,
            "rag_engine": rag_stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/reinitialize")
def reinitialize_rag():
    """
    Reinitialize RAG Engine (xóa và tạo lại vector store)
    - Chỉ dùng cho testing/maintenance
    """
    global _rag_engine
    try:
        _rag_engine = initialize_rag_engine(force_reinit=True)
        return {
            "success": True,
            "message": "RAG Engine đã được khởi tạo lại"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== WEB LOADER ENDPOINTS ====================

@router.post("/chat/load-url")
def load_url_endpoint(url: str):
    """
    Tải nội dung từ URL
    
    Args:
        url: URL cần tải
        
    Returns:
        Nội dung từ URL
    """
    try:
        loader = get_web_loader_tool()
        result = loader.load_from_url(url)
        
        if not result:
            raise HTTPException(status_code=400, detail=f"Không thể tải từ URL: {url}")
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi load URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/load-urls")
def load_urls_endpoint(urls: List[str]):
    """
    Tải nội dung từ nhiều URL
    
    Args:
        urls: Danh sách URL
        
    Returns:
        Danh sách nội dung
    """
    try:
        loader = get_web_loader_tool()
        results = loader.load_from_urls(urls)
        
        if not results:
            raise HTTPException(status_code=400, detail="Không thể tải từ bất kỳ URL nào")
        
        return {
            "success": True,
            "total": len(results),
            "data": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi load URLs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools/status")
def tools_status():
    """
    Kiểm tra trạng thái của các tools
    
    Returns:
        Trạng thái của RAG Engine, WebSearch, WebLoader, SpeechRecognition
    """
    try:
        # Kiểm tra RAG Engine
        rag_status = "⚠️ Not initialized"
        try:
            rag = get_rag_engine()
            stats = rag.get_collection_stats()
            rag_status = f"✓ Ready ({stats['total_documents']} documents)"
        except Exception as e:
            rag_status = f"❌ Error: {str(e)[:50]}"
        
        # Kiểm tra Speech Recognition
        sr_status = "✓ Available" if sr else "❌ Not installed"
        
        return {
            "success": True,
            "status": {
                "rag_engine": rag_status,
                "web_loader": "✓ Available",
                "web_search": "✓ Available (mock)",
                "speech_recognition": sr_status
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
