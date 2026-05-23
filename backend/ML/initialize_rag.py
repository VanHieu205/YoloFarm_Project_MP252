"""
Script để khởi tạo vector store với dữ liệu bệnh cây trồng
"""

import os
from pathlib import Path
from ML.rag_engine import RAGEngine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Dữ liệu bệnh cây trồng - chuẩn bị sẵn
CROP_DISEASES = [
    {
        "name": "Bệnh lùn xoắn lá",
        "crop": "Lúa",
        "symptoms": """
        - Các lá non bị xoắn, cong vòng
        - Cây bị lùn, tăng trưởng chậm
        - Lá có màu vàng nhạt
        - Rễ bị tổn thương
        """,
        "treatment": """
        - Sử dụng thuốc trừ côn trùng để tiêu diệt rệp maka gây bệnh
        - Phun imidacloprid 0.5 ml/lít nước
        - Phun 2-3 lần cách nhau 7-10 ngày
        - Dùng phân bón lá để tăng cường sức đề kháng
        """,
        "prevention": """
        - Chọn giống lúa có khả năng chịu bệnh
        - Diệt cỏ dại là nơi trú ngụ của rệp maka
        - Cách ly các cây bị bệnh
        - Khử trùng dụng cụ làm vườn
        """
    },
    {
        "name": "Bệnh thối quả",
        "crop": "Dưa chuột",
        "symptoms": """
        - Xuất hiện đốm nước thâm trên quả
        - Quả mềm, thối từ từ
        - Bề mặt quả bị lõm vào
        - Quả rơi trước khi chín
        """,
        "treatment": """
        - Cắt bỏ quả bị bệnh
        - Phun Ridomil Gold 0.3% (0.3g/1 lít nước)
        - Phun lặp lại mỗi 7-10 ngày
        - Cải thiện thông thoáng bằng tỉa cành
        - Giảm độ ẩm trong vườn
        """,
        "prevention": """
        - Luân canh vụ với cây khác 2-3 năm
        - Tránh tưới nước vào lá
        - Tăng cường thông thoáng
        - Chọn giống chịu bệnh
        - Vệ sinh vườn định kỳ
        """
    },
    {
        "name": "Bệnh sương mai",
        "crop": "Cà chua",
        "symptoms": """
        - Lá bị phủ một lớp mốc trắng xám trên mặt dưới
        - Lá bị xoăn, cong vàng
        - Mặt trên lá có những đốm vàng nơi phần mốc trắng
        - Cây bị suy yếu, sinh trưởng chậm
        """,
        "treatment": """
        - Phun Sulfur 0.5% hoặc Calcium polysulfide
        - Phun Topsin M 0.1% (1g/1 lít nước)
        - Phun lặp lại 7-10 ngày/lần
        - Loại bỏ lá nhiễm bệnh
        - Đốt lá bị bệnh tại chỗ
        """,
        "prevention": """
        - Chọn giống có khả năng chịu bệnh cao
        - Bảo vệ vườn khỏi gió lạnh, sương muối
        - Tránh độ ẩm cao trong vườn
        - Tăng cường thông thoáng
        - Vệ sinh công cụ làm vườn
        """
    },
    {
        "name": "Bệnh héo xoắn",
        "crop": "Ớt",
        "symptoms": """
        - Cây bị héo, mềm nhũn
        - Lá bị xoắn lại, đổi màu sang vàng
        - Thân và rễ bị mềm, thối
        - Bệnh xuất hiện từ gốc cây
        """,
        "treatment": """
        - Cạo bỏ phần bệnh trên thân, mủ vàng
        - Phun Ridomil Gold hoặc Captaf 0.3%
        - Tưới gốc Pseudomonas 10^9 CFU/ml
        - Cắt bỏ cây bị bệnh nặng
        - Xử lý đất bằng nước nóng 82°C
        """,
        "prevention": """
        - Chọn khu vực có thoát nước tốt
        - Luân canh 3-4 năm
        - Tiêu diệt cỏ dại
        - Sử dụng hạt giống từ cây khỏe
        - Khử trùng dụng cụ trước khi dùng
        """
    },
    {
        "name": "Bệnh lá cháy",
        "crop": "Khoai tây",
        "symptoms": """
        - Lá xuất hiện đốm nước thâm tro ở mặt dưới
        - Lá bị vàng và rơi
        - Thân bị mềm, thối
        - Bệnh lan nhanh trong điều kiện ẩm
        """,
        "treatment": """
        - Phun Ridomil Gold 0.3% ngay khi phát hiện bệnh
        - Phun 7-10 ngày/lần
        - Loại bỏ lá bị bệnh
        - Cải thiện thông thoáng bằng tỉa cành
        - Giảm tưới nước, tránh ẩm độ cao
        """,
        "prevention": """
        - Chọn giống chịu bệnh
        - Luân canh 2-3 năm
        - Tránh tưới nước vào lá
        - Vệ sinh vườn định kỳ
        - Tránh tập trung cây quá dày
        """
    },
    {
        "name": "Bệnh thán thư",
        "crop": "Lúa",
        "symptoms": """
        - Lá xuất hiện các đốm hình tròn màu nâu, giữa có phần xám trắng
        - Khi bệnh nặng, lá bị khô và rơi
        - Bụi bệnh màu nâu phát triển trên lá
        - Bệnh lan nhanh trong thời tiết mưa ẩm
        """,
        "treatment": """
        - Phun Ridomil Gold 0.3%
        - Phun Tilt 0.1% (1ml/1 lít nước)
        - Lặp lại 7-10 ngày/lần
        - Loại bỏ và đốt lá bị bệnh
        - Tăng cường thông thoáng
        """,
        "prevention": """
        - Chọn giống kháng bệnh
        - Không rưới quá nhiều nước
        - Tăng cường thông thoáng
        - Bón phân cân bằng
        - Vệ sinh vườn định kỳ
        """
    },
    {
        "name": "Bệnh vàng lá do thiếu dinh dưỡng",
        "crop": "Cây trồng chung",
        "symptoms": """
        - Lá mở rộng, vàng nhạt
        - Lá cũ vàng trước, rồi lan sang lá non
        - Gân lá còn xanh (thiếu N)
        - Hoặc toàn bộ lá vàng nhạt (thiếu Fe, Mg)
        """,
        "treatment": """
        - Thiếu N: Bón urê 20-30 kg/ha hoặc phun 2-3%
        - Thiếu P: Bón phân lân 15-20 kg/ha
        - Thiếu K: Bón kali 15-20 kg/ha
        - Thiếu Mg: Phun Epsom salt 1%
        - Thiếu Fe: Phun chelated iron 0.1%
        - Bón phân tổng hợp 3-4 lần/vụ
        """,
        "prevention": """
        - Xác định nhu cầu dinh dưỡng của cây
        - Bón phân cân bằng theo khuyến cáo
        - Kiểm tra pH đất phù hợp với cây trồng
        - Sử dụng phân bón lá hỗ trợ
        - Luân canh cây legume để tăng N
        """
    },
    {
        "name": "Bệnh héo Fusarium",
        "crop": "Dưa hấu",
        "symptoms": """
        - Cây bị héo đột ngột
        - Gân lá bị đỏ, xoắn
        - Thời gian sáng héo, tối hồi phục
        - Cuối cùng cây chết
        """,
        "treatment": """
        - Cắt bỏ cây bị bệnh hoàn toàn
        - Tưới gốc Benomyl 0.1% hoặc Carbendazim 0.05%
        - Xử lý đất bằng nước nóng
        - Cải thiện thoát nước
        """,
        "prevention": """
        - Chọn giống chịu bệnh
        - Luân canh 4-5 năm
        - Tránh tưới nước quá nhiều
        - Khử trùng dụng cụ khi chuyển từ cây này sang cây khác
        - Vệ sinh vườn, loại bỏ dây leo còn lại
        """
    }
]

def initialize_rag_engine(force_reinit=False):
    """
    Khởi tạo RAG Engine với dữ liệu bệnh cây
    
    Args:
        force_reinit: Nếu True, sẽ xóa vector store cũ và tạo mới
    """
    chroma_path = "./chroma_data"
    api_key = os.getenv("gemini_api_key")
    
    # Kiểm tra xem vector store đã tồn tại chưa
    if force_reinit and os.path.exists(chroma_path):
        import shutil
        shutil.rmtree(chroma_path)
        print("✓ Đã xóa vector store cũ")
    
    # Khởi tạo RAG Engine
    print("Khởi tạo RAG Engine...")
    rag = RAGEngine(chroma_path=chroma_path, api_key=api_key)
    
    # Kiểm tra xem có dữ liệu trong store không
    stats = rag.get_collection_stats()
    
    if stats['total_documents'] == 0 or force_reinit:
        print(f"Thêm dữ liệu bệnh cây vào vector store...")
        rag.add_disease_data(CROP_DISEASES)
        rag.save()
        print(f"✓ Vector store đã sẵn sàng với {len(CROP_DISEASES)} bệnh cây")
    else:
        print(f"✓ Vector store đã tồn tại với {stats['total_documents']} documents")
    
    return rag

if __name__ == "__main__":
    # Khởi tạo khi chạy script trực tiếp
    rag = initialize_rag_engine(force_reinit=False)
    
    # Test RAG
    print("\n--- Test RAG Engine ---")
    test_query = "Cây lúa bị lùn xoắn lá phải làm sao?"
    result = rag.chat(test_query)
    print(f"Câu hỏi: {test_query}")
    print(f"Phản hồi:\n{result['response']}")
    print(f"Số context sử dụng: {len(result['context_used'])}")
