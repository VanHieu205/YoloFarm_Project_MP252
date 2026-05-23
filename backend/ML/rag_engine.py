"""
RAG Engine cho hệ thống chatbot nông nghiệp thông minh
Sử dụng Chroma vector store + Gemini LLM
"""

import os
import json
import chromadb
import google.generativeai as genai
from typing import Optional, List, Dict, Tuple
from datetime import datetime
import time
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, chroma_path: str = "./chroma_data", api_key: str = None):
        """
        Khởi tạo RAG Engine
        
        Args:
            chroma_path: Đường dẫn lưu trữ Chroma vector store
            api_key: Google Gemini API key (lấy từ .env nếu None)
        """
        self.chroma_path = chroma_path
        self.max_retries = 3
        self.retry_delay = 1  # giây
        
        # Nếu không có API key, lấy từ .env (giống weather_routes.py)
        if not api_key:
            api_key = os.getenv("gemini_api_key")
        
        # Thiết lập Google Gemini
        if not api_key:
            raise ValueError(
                "❌ Gemini API key không được cấu hình!\n"
                "Vui lòng:\n"
                "1. Lấy API key từ https://ai.google.dev/\n"
                "2. Tạo/kiểm tra file .env trong thư mục backend\n"
                "3. Thêm dòng: gemini_api_key=<your_key_here>\n"
                "4. Đảm bảo file .env ở đúng vị trí backend/.env"
            )
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("✓ Gemini API được cấu hình thành công")
        except Exception as e:
            raise ValueError(f"❌ Lỗi cấu hình Gemini API: {str(e)}")
        
        # Khởi tạo Chroma client (dùng PersistentClient cho version mới)
        os.makedirs(chroma_path, exist_ok=True)
        self.client = chromadb.PersistentClient(path=chroma_path)
        
        # Tên collection mặc định
        self.collection_name = "crop_diseases"
        self._init_collection()
    
    def _init_collection(self):
        """Khởi tạo hoặc lấy collection từ Chroma"""
        try:
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"✓ Collection '{self.collection_name}' đã được khởi tạo")
        except Exception as e:
            logger.error(f"Lỗi khởi tạo collection: {e}")
            raise
    
    def add_disease_data(self, disease_list: List[Dict]):
        """
        Thêm dữ liệu bệnh cây trồng vào vector store
        
        Args:
            disease_list: Danh sách các bệnh với structure:
                {
                    "name": "Tên bệnh",
                    "crop": "Loại cây",
                    "symptoms": "Triệu chứng",
                    "treatment": "Phương pháp điều trị",
                    "prevention": "Phòng chống"
                }
        """
        documents = []
        metadatas = []
        ids = []
        
        for i, disease in enumerate(disease_list):
            # Tạo document từ thông tin bệnh
            doc_text = f"""
            Bệnh: {disease.get('name', '')}
            Loại cây: {disease.get('crop', '')}
            
            Triệu chứng:
            {disease.get('symptoms', '')}
            
            Phương pháp điều trị:
            {disease.get('treatment', '')}
            
            Phòng chống:
            {disease.get('prevention', '')}
            """
            
            documents.append(doc_text)
            metadatas.append({
                "disease_name": disease.get('name', ''),
                "crop": disease.get('crop', ''),
                "type": "disease_treatment"
            })
            ids.append(f"disease_{i}")
        
        # Thêm vào Chroma
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f"✓ Đã thêm {len(disease_list)} bệnh vào vector store")
    
    def retrieve_context(self, query: str, n_results: int = 3) -> List[Dict]:
        """
        Tìm kiếm tài liệu liên quan dựa trên query
        
        Args:
            query: Câu hỏi của người dùng
            n_results: Số kết quả trả về
            
        Returns:
            Danh sách các tài liệu liên quan
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )
        
        context_list = []
        if results['documents'] and results['documents'][0]:
            for doc, metadata, distance in zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            ):
                context_list.append({
                    "document": doc,
                    "metadata": metadata,
                    "relevance": 1 - distance  # Chuyển đổi distance thành relevance score
                })
        
        return context_list
    
    def generate_response(
        self, 
        user_query: str, 
        context: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Tạo phản hồi từ Gemini LLM dựa trên context
        
        Args:
            user_query: Câu hỏi của người dùng
            context: Context từ vector store
            system_prompt: Custom system prompt
            
        Returns:
            {
                "response": "Phản hồi",
                "context_used": context_list,
                "timestamp": "timestamp"
            }
        """
        if system_prompt is None:
            system_prompt = """
            Bạn là một chuyên gia nông nghiệp thông minh. 
            Hãy trả lời các câu hỏi về bệnh cây, phương pháp điều trị, và phòng chống bệnh.
            Hãy trả lời bằng tiếng Việt và cung cấp lời khuyên cụ thể, dễ thực hiện.
            """
        
        # Xây dựng context string
        context_str = ""
        if context:
            context_str = "\n\n".join([
                f"**Thông tin liên quan ({item['metadata'].get('disease_name', 'N/A')})**:\n{item['document']}"
                for item in context
            ])
        
        # Tạo prompt
        full_prompt = f"""
        {system_prompt}
        
        {'Thông tin nền tảng từ cơ sở dữ liệu:' + context_str if context_str else ''}
        
        Câu hỏi của người dùng: {user_query}
        
        Vui lòng cung cấp một câu trả lời chi tiết, hữu ích và dễ hiểu.
        """
        
        # Gọi Gemini API với retry logic
        for attempt in range(self.max_retries):
            try:
                response = self.model.generate_content(full_prompt)
                return {
                    "response": response.text,
                    "context_used": context if context else [],
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Lỗi Gemini API (lần {attempt + 1}/{self.max_retries}): {error_msg}")
                
                if "API key" in error_msg or "authentication" in error_msg.lower():
                    raise Exception(
                        "❌ Lỗi xác thực Gemini API!\n"
                        "Vui lòng kiểm tra:\n"
                        "1. API key trong file .env có đúng không?\n"
                        "2. API key có hết hạn không?\n"
                        "3. Tài khoản Google có được kích hoạt không?"
                    )
                
                # Nếu chưa phải lần cuối, chờ rồi thử lại
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.info(f"Chờ {wait_time}s trước khi thử lại...")
                    time.sleep(wait_time)
                else:
                    # Lần cuối cùng, raise exception
                    raise Exception(f"❌ Lỗi Gemini API sau {self.max_retries} lần thử: {error_msg}")
                    "2. API key có đủ quota không?\n"
                    "3. Kết nối internet có bình thường không?"
                
            else:
                raise Exception(f"❌ Lỗi Gemini API: {error_msg}")
    
    def chat(self, user_query: str, system_prompt: Optional[str] = None) -> Dict:
        """
        Hàm chính để chat - kết hợp retrieval + generation
        
        Args:
            user_query: Câu hỏi của người dùng
            system_prompt: Custom system prompt
            
        Returns:
            Phản hồi từ chatbot
        """
        # Bước 1: Retrieve context từ vector store
        context = self.retrieve_context(user_query, n_results=3)
        
        # Bước 2: Generate response từ LLM
        response = self.generate_response(user_query, context, system_prompt)
        
        return response
    
    def save(self):
        """
        Lưu collection vào disk
        (PersistentClient tự động persist dữ liệu, method này chỉ để compatible)
        """
        logger.info("✓ Vector store đã được tự động lưu bởi PersistentClient")
    
    def get_collection_stats(self) -> Dict:
        """Lấy thông tin thống kê về collection"""
        stats = self.collection.count()
        return {
            "collection_name": self.collection_name,
            "total_documents": stats,
            "storage_path": self.chroma_path
        }
