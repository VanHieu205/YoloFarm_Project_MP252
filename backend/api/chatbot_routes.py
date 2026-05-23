"""
API routes cho hệ thống RAG chatbot
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
import os
import logging
import re
from dotenv import load_dotenv

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

router = APIRouter()

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

# ==================== KHỞI TẠO RAG ENGINE ====================

def get_rag_engine():
    """Lấy RAG Engine instance (lazy initialization)"""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = initialize_rag_engine(force_reinit=False)
    return _rag_engine

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
    
    Args:
        user_id: ID của người dùng
        audio_file: File âm thanh (WAV, MP3, etc.)
        system_prompt: Custom system prompt (tùy chọn)
    
    Returns:
        Giống như /chat endpoint nhưng nhận input là âm thanh
    """
    if sr is None:
        raise HTTPException(
            status_code=500,
            detail="Speech recognition không được cài đặt"
        )
    
    try:
        # Lưu file tạm thời
        temp_path = f"/tmp/audio_{uuid.uuid4()}.wav"
        with open(temp_path, "wb") as f:
            content = await audio_file.read()
            f.write(content)
        
        # Chuyển âm thanh thành text
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_path) as source:
            audio_data = recognizer.record(source)
        
        try:
            transcribed_text = recognizer.recognize_google(audio_data, language='vi-VN')
        except sr.UnknownValueError:
            raise HTTPException(
                status_code=400,
                detail="Không thể nhận diện giọng nói. Vui lòng thử lại."
            )
        except sr.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi dịch vụ nhận diện giọng nói: {e}"
            )
        finally:
            # Xóa file tạm
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        # Gọi chat endpoint với text đã chuyển đổi
        chat_req = ChatRequest(
            user_id=user_id,
            message=transcribed_text,
            system_prompt=system_prompt
        )
        
        return chat_endpoint(chat_req)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
