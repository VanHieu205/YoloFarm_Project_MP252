import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Upload, Camera, Bug, Trash2, AlertTriangle, Loader, X, Sprout } from 'lucide-react';
import '../styles/components.css';

const PestDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current.click();
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment"
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
    setAnalysisResult(null);
  }, [webcamRef]);

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/plant-disease/detect-disease-quick`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Lỗi phản hồi từ máy chủ AI');
      }

      const data = await response.json();

      const dangerLevel = data.expert_advice.danger_level;
      let color = '#2ecc71';
      if (dangerLevel.includes('Cao') || dangerLevel.includes('Nghiêm trọng')) {
        color = '#e74c3c';
      } else if (dangerLevel.includes('Trung bình')) {
        color = '#f1c40f';
      }

      const finalResult = {
        pestName: data.expert_advice.name_vn,
        scientificName: `Mã nhận diện: ${data.ai_analysis.disease}`,
        confidence: data.ai_analysis.confidence_score,
        severity: dangerLevel,
        severityColor: color,
        description: `Nguyên nhân: ${data.expert_advice.cause}\n\nTriệu chứng: ${data.expert_advice.symptoms}`,
        recommendations: [
          ...data.expert_advice.treatment,
          ...data.expert_advice.prevention
        ]
      };

      setAnalysisResult(finalResult);

    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến hệ thống AI. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
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

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

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
                <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-line' }}>{analysisResult.description}</p>
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