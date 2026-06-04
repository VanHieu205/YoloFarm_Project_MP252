# disease_expert.py

DISEASE_KNOWLEDGE = {
    # ================= CÀ CHUA =================
    "Tomato_Late_blight": {
        "name_vn": "Bệnh Mốc Sương ở Cà chua",
        "danger_level": "Nghiêm trọng",
        "cause": "Do nấm Phytophthora infestans phát triển trong môi trường ẩm ướt, mưa nhiều.",
        "symptoms": "Vết bệnh sũng nước màu xanh tối trên lá. Quả bị thâm đen, cứng và sần sùi.",
        "treatment": ["Cắt bỏ và tiêu hủy ngay cây/lá bệnh.", "Phun thuốc gốc Đồng (Copper), Mancozeb hoặc Metalaxyl."],
        "prevention": ["Trồng thưa để tạo độ thông thoáng.", "Tưới nước vào gốc ban ngày, tránh làm ướt lá vào chiều tối."]
    },
    "Tomato_Early_blight": {
        "name_vn": "Bệnh Đốm Vòng trên lá Cà chua",
        "danger_level": "Trung bình",
        "cause": "Nấm Alternaria solani lây nhiễm qua đất và tàn dư cây trồng cũ.",
        "symptoms": "Đốm nâu có vòng tròn đồng tâm (như bia đỡ đạn) trên lá già, sau lan lên lá non.",
        "treatment": ["Tỉa bỏ lá già sát gốc.", "Sử dụng thuốc diệt nấm chứa Chlorothalonil hoặc Mancozeb."],
        "prevention": ["Luân canh cây trồng.", "Phủ rơm rạ dưới gốc để tránh đất văng lên lá khi mưa/tưới."]
    },
    "Tomato_Bacterial_spot": {
        "name_vn": "Bệnh Đốm Vi Khuẩn ở Cà chua",
        "danger_level": "Cao",
        "cause": "Vi khuẩn Xanthomonas lây lan qua giọt bắn nước và dụng cụ làm nông.",
        "symptoms": "Đốm nhỏ li ti màu đen/nâu trên lá, xung quanh có quầng vàng. Quả có đốm rộp.",
        "treatment": ["Rất khó trị khi đã nhiễm nặng. Cần nhổ bỏ cây bệnh.", "Phun kháng sinh thực vật (Kasugamycin) kết hợp gốc Đồng."],
        "prevention": ["Dùng hạt giống sạch bệnh.", "Khử trùng kéo, dao khi cắt tỉa cành."]
    },
    "Tomato_Leaf_Mold": {
        "name_vn": "Bệnh Nấm Mốc Lá trên Cà chua",
        "danger_level": "Trung bình",
        "cause": "Nấm Passalora fulva phát triển mạnh trong nhà màng/nhà lưới thiếu thông gió.",
        "symptoms": "Mặt trên lá có đốm vàng, mặt dưới lá có lớp nấm mốc màu xám/tím nhạt.",
        "treatment": ["Tăng cường thông gió, giảm độ ẩm môi trường.", "Phun thuốc diệt nấm chứa Difenoconazole."],
        "prevention": ["Thiết kế giàn leo hợp lý để đón nắng và gió.", "Kiểm soát độ ẩm nhà màng dưới 85%."]
    },
    "Tomato_Septoria_leaf_spot": {
        "name_vn": "Bệnh Đốm Lá Septoria ở Cà chua",
        "danger_level": "Trung bình",
        "cause": "Nấm Septoria lycopersici tồn tại trong tàn dư thực vật và cỏ dại.",
        "symptoms": "Nhiều đốm nhỏ viền nâu sẫm, tâm màu xám trắng. Lá úa vàng và rụng hàng loạt.",
        "treatment": ["Dọn sạch lá rụng dưới gốc.", "Dùng thuốc trừ nấm phổ rộng (Azoxystrobin, Chlorothalonil)."],
        "prevention": ["Dọn sạch cỏ dại quanh vườn.", "Không tưới phun mưa trên ngọn cây."]
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "name_vn": "Nhện Đỏ trên lá Cà chua",
        "danger_level": "Cao",
        "cause": "Thời tiết nắng nóng, khô hạn làm nhện đỏ bùng phát và hút nhựa cây.",
        "symptoms": "Lá có các chấm lấm tấm màu vàng/trắng. Mặt dưới lá có lớp tơ nhện mỏng.",
        "treatment": ["Phun nước áp lực mạnh để rửa trôi nhện.", "Dùng thuốc đặc trị nhện (Abamectin, Propargite)."],
        "prevention": ["Giữ ẩm độ vườn cây ổn định trong mùa nắng nóng.", "Trồng xen các cây thiên địch."]
    },
    "Tomato__Target_Spot": {
        "name_vn": "Bệnh Đốm Đích ở Cà chua",
        "danger_level": "Trung bình",
        "cause": "Nấm Corynespora cassiicola.",
        "symptoms": "Đốm nâu sẫm, có các vòng đồng tâm mờ hơn Early Blight. Đốm thường lõm xuống ở quả.",
        "treatment": ["Tỉa bớt cành lá rậm rạp.", "Dùng thuốc trừ nấm gốc Mancozeb."],
        "prevention": ["Tiêu hủy triệt để tàn dư cây trồng sau thu hoạch."]
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "name_vn": "Bệnh Xoăn Lá Vàng Virus ở Cà chua",
        "danger_level": "Rất nghiêm trọng",
        "cause": "Virus do côn trùng chích hút (Bọ phấn trắng - Whitefly) truyền nhiễm.",
        "symptoms": "Lá ngọn xoăn tít lại, viền lá nhạt màu vàng. Cây còi cọc, không đậu quả.",
        "treatment": ["Không có thuốc trị virus. BẮT BUỘC nhổ bỏ và tiêu hủy cây bệnh ngay lập tức.", "Phun thuốc tiêu diệt Bọ phấn trắng để chặn lây lan."],
        "prevention": ["Dùng bẫy dính màu vàng để bắt bọ phấn.", "Trồng cà chua trong nhà lưới chắn côn trùng."]
    },
    "Tomato__Tomato_mosaic_virus": {
        "name_vn": "Bệnh Khảm Lá Virus ở Cà chua",
        "danger_level": "Cao",
        "cause": "Virus (TMV/ToMV) lây qua tiếp xúc cơ học (tay người, dụng cụ) hoặc hạt giống.",
        "symptoms": "Lá có vệt màu xanh đậm xen lẫn xanh nhạt (như gạch đá hoa/khảm). Lá nhăn nheo, quả dị dạng.",
        "treatment": ["Không có thuốc chữa. Nhổ bỏ và đốt cây bệnh.", "Rửa tay bằng xà phòng trước khi chạm vào cây khỏe."],
        "prevention": ["Xử lý hạt giống bằng nước nóng hoặc hóa chất trước khi gieo.", "Không hút thuốc lá gần vườn ươm (TMV lây từ thuốc lá)."]
    },
    "Tomato_healthy": {
        "name_vn": "Cà chua khỏe mạnh",
        "danger_level": "An toàn",
        "cause": "Cây được chăm sóc tốt và môi trường thuận lợi.",
        "symptoms": "Lá xanh đều, thân mập mạp, phát triển bình thường.",
        "treatment": ["Không sử dụng thuốc hóa học."],
        "prevention": ["Tiếp tục quy trình chăm sóc hiện tại.", "Thường xuyên thăm vườn để phát hiện sớm sâu bệnh."]
    },

    "Potato___Early_blight": {
        "name_vn": "Bệnh Đốm Vòng ở Khoai tây",
        "danger_level": "Trung bình",
        "cause": "Nấm Alternaria solani lây nhiễm qua tàn dư ở đất.",
        "symptoms": "Các đốm đen hoặc nâu có vòng đồng tâm trên lá, xuất hiện từ lá dưới thấp lên trên.",
        "treatment": ["Dọn sạch lá héo rơi rụng.", "Phun thuốc diệt nấm (Mancozeb, Chlorothalonil)."],
        "prevention": ["Luân canh với cây trồng không cùng họ cà.", "Tránh tưới nước lên lá."]
    },
    "Potato___Late_blight": {
        "name_vn": "Bệnh Mốc Sương ở Khoai tây",
        "danger_level": "Nghiêm trọng",
        "cause": "Nấm Phytophthora infestans.",
        "symptoms": "Vết thâm đen lan rất nhanh trên lá, làm thối rữa thân và củ. Bốc mùi hôi.",
        "treatment": ["Cắt bỏ thân lá bệnh đem tiêu hủy.", "Phun thuốc gốc Đồng mạnh hoặc Metalaxyl."],
        "prevention": ["Dùng củ giống sạch bệnh.", "Vun luống cao để nước không đọng mầm bệnh xuống củ."]
    },
    "Potato___healthy": {
        "name_vn": "Khoai tây khỏe mạnh",
        "danger_level": "An toàn",
        "cause": "Cây sinh trưởng tốt.",
        "symptoms": "Lá màu xanh thẫm, không đốm bệnh.",
        "treatment": ["Không cần điều trị."],
        "prevention": ["Tiếp tục duy trì dinh dưỡng và chế độ tưới."]
    },

    "Pepper__bell___Bacterial_spot": {
        "name_vn": "Bệnh Đốm Vi Khuẩn ở ớt chuông",
        "danger_level": "Cao",
        "cause": "Vi khuẩn Xanthomonas lây nhiễm qua nước tưới hoặc mưa.",
        "symptoms": "Đốm nhỏ sũng nước, sau chuyển nâu, lá vàng rụng. Quả bị đốm như mụn rộp.",
        "treatment": ["Dừng ngay việc tưới phun mưa.", "Phun thuốc gốc Đồng hoặc Kasugamycin."],
        "prevention": ["Trồng mật độ vừa phải.", "Xử lý đất và hạt giống cẩn thận."]
    },
    "Pepper__bell___healthy": {
        "name_vn": "Ớt chuông khỏe mạnh",
        "danger_level": "An toàn",
        "cause": "Môi trường tối ưu.",
        "symptoms": "Lá bóng mượt, cây vững chắc.",
        "treatment": ["Không cần điều trị."],
        "prevention": ["Duy trì chăm sóc định kỳ."]
    }
}

def get_expert_advice(disease_class: str) -> dict:
    default_info = {
        "name_vn": disease_class,
        "danger_level": "Chưa xác định",
        "cause": "Hệ thống đang cập nhật dữ liệu cho bệnh này.",
        "symptoms": "Đang cập nhật",
        "treatment": ["Vui lòng tham khảo ý kiến chuyên gia nông nghiệp tại địa phương."],
        "prevention": ["Theo dõi thêm tình trạng của vườn cây."]
    }
    return DISEASE_KNOWLEDGE.get(disease_class, default_info)