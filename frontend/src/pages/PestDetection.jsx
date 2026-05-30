import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Upload, Camera, Bug, Trash2, AlertTriangle, Loader, X, Sprout } from 'lucide-react';
import '../styles/components.css'; // Đảm bảo bạn đã style components chung

const PestDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  // Xử lý chọn tệp từ thiết bị
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setAnalysisResult(null); // Reset kết quả cũ
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current.click();
  };

  // Xử lý chụp ảnh từ Camera
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment" // Sử dụng camera sau trên điện thoại
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreviewUrl(imageSrc);
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        setSelectedImage(file);
      });
    setIsCameraOpen(false);
    setAnalysisResult(null); // Reset kết quả cũ
  }, [webcamRef]);

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
  };

  // Mô phỏng gọi API phân tích AI (Mock Data)
  const handleAnalyze = () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setAnalysisResult(null);

    // Mô phỏng độ trễ API 2 giây
    setTimeout(() => {
      // Mock data kết quả
      const mockResult = {
        pestName: "Sâu cuốn lá nhỏ",
        scientificName: "Cnaphalocrocis medinalis",
        confidence: 88,
        severity: "Trung bình",
        severityColor: "#f1c40f", // Vàng
        description: "Loại sâu hại phổ biến trên lúa, làm lá bị cuốn lại và ăn phần xanh của lá, làm giảm khả năng quang hợp.",
        recommendations: [
          "Sử dụng bẫy đèn để thu hút bướm trưởng thành.",
          "Cân đối lượng phân đạm, tránh bón quá nhiều.",
          "Phun thuốc trừ sâu gốc lúa khi mật độ sâu cao."
        ]
      };
      setAnalysisResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="page-container">
      {/* Header trang */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bug size={32} color="#2ecc71" style={{ background: '#eafaf1', padding: '8px', borderRadius: '12px' }} />
          <div>
            <h1 className="page-title">Nhận diện sâu bệnh AI</h1>
            <p className="page-subtitle">Tải lên hoặc chụp ảnh lá cây để AI phân tích và đưa ra đề xuất xử lý.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header" style={{ marginBottom: '20px', borderBottom: 'none', padding: 0 }}>
            <h2 className="card-title" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Tải lên hình ảnh lá cây</h2>
          </div>
          
          <div className="card-body" style={{ padding: 0 }}>
            <div className="pest-preview-container" style={{
              width: '100%',
              height: '300px',
              border: '2px dashed #e1e8ed',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundColor: '#fbfcfd',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <button className="remove-img-btn" onClick={handleRemoveImage} style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(231, 76, 60, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s'
                  }}>
                    <X size={20} />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Bug size={64} color="#e1e8ed" style={{ marginBottom: '16px' }} />
                  <p>Hình ảnh lá cây sẽ hiển thị tại đây</p>
                  <p style={{ fontSize: '12px' }}>Vui lòng chọn hoặc chụp ảnh</p>
                </div>
              )}
            </div>

            {/* Input file ẩn */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

            {/* Nút thao tác */}
            <div className="pest-action-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handleSelectFileClick} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                border: '1px solid #e1e8ed', background: 'white', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600
              }}>
                <Upload size={18} />
                Chọn tệp từ thiết bị
              </button>
              
              <button className="btn btn-primary" onClick={() => setIsCameraOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                border: 'none', background: '#2ecc71', color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)'
              }}>
                <Camera size={18} />
                Mở Camera
              </button>

              {previewUrl && (
                <button className="btn btn-success" onClick={handleAnalyze} disabled={isLoading} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                  border: 'none', background: '#3498db', color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)'
                }}>
                  {isLoading ? <Loader size={18} className="spin" /> : <Bug size={18} />}
                  {isLoading ? "Đang phân tích..." : "Phân tích ngay"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thẻ Card hiển thị kết quả (Chỉ hiện khi có kết quả) */}
        {analysisResult && (
          <div className="card animate-fade-in" style={{ padding: '24px', borderLeft: `6px solid ${analysisResult.severityColor}` }}>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: '24px', marginBottom: '4px' }}>{analysisResult.pestName}</h2>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '14px' }}>{analysisResult.scientificName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: analysisResult.severityColor, fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>
                    <AlertTriangle size={20} />
                    <span>Mức độ: {analysisResult.severity}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Độ tin cậy: {analysisResult.confidence}%</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Mô tả:</h4>
                <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>{analysisResult.description}</p>
              </div>

              <div style={{ background: '#fbfcfd', padding: '16px', borderRadius: '12px', border: '1px solid #e1e8ed' }}>
                <h4 style={{ color: '#2ecc71', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Sprout size={18} /> Đề xuất xử lý:</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.8' }}>
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal (Hiển thị khi mở camera) */}
      {isCameraOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="modal-content card animate-scale-up" style={{
            padding: '16px', borderRadius: '16px', background: 'white', maxWidth: '800px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title">Chụp ảnh lá cây</h3>
              <button className="close-modal-btn" onClick={() => setIsCameraOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="webcam-container" style={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e8ed',
                backgroundColor: '#fbfcfd',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>
              
              <button className="btn btn-primary capture-btn" onClick={capture} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '12px',
                border: 'none', background: '#2ecc71', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '16px', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)'
              }}>
                <Camera size={20} />
                Chụp ảnh
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PestDetection;