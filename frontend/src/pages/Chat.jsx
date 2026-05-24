import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import '../styles/components.css';
import {
  Send,
  Mic,
  Loader,
  Bot,
  MessageCircle,
  BookOpen,
  AlertCircle
} from 'lucide-react'

import logo from '../../logo.jpg'
const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"))
  const userId = user?.user_id


  // Scroll to bottom khi có message mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history khi component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Load chat history từ API
  const loadChatHistory = async () => {
    try {
      const response = await axiosClient.get(`api/chatbot/chat/history/${userId}?limit=10`);
      if (response.data.success) {
        const formattedHistory = response.data.history.map(chat => [
          { role: 'user', content: chat.user_message, timestamp: chat.timestamp },
          { role: 'bot', content: chat.bot_response, timestamp: chat.timestamp }
        ]).flat();
        setMessages(formattedHistory);
      }
    } catch (error) {
      console.error('Lỗi khi tải chat history:', error);
    }
  };

  // Gửi tin nhắn text
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await axiosClient.post('api/chatbot/chat', {
        user_id: userId,
        message: userMessage
      });

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: response.data.response,
          context: response.data.context_used,
          timestamp: response.data.timestamp
        }]);
      }
    } catch (error) {
      console.error('Lỗi:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer cho thời gian ghi
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi truy cập micro:', error);
      alert('Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  // Dừng ghi âm và gửi
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      // Dừng stream
      streamRef.current.getTracks().forEach(track => track.stop());

      // Tạo blob từ audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await sendAudioMessage(audioBlob);
    };
  };

  // Gửi tin nhắn âm thanh
  const sendAudioMessage = async (audioBlob) => {
    setIsLoading(true);
    setMessages(prev => [...prev, {
      role: 'user',
      content: '[Đang xử lý âm thanh...]',
      isVoice: true,
      timestamp: new Date().toISOString()
    }]);

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('audio_file', audioBlob, 'audio.webm');

      const response = await axiosClient.post('api/chatbot/chat/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Cập nhật message cuối cùng (user message) với nội dung đã nhận dạng
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'user',
            content: response.data.response || '[Không thể nhận dạng]',
            isVoice: true,  
            timestamp: new Date().toISOString()
          };
          return updated;
        });

        // Thêm response từ bot
        setMessages(prev => [...prev, {
          role: 'bot',
          content: response.data.response,
          context: response.data.context_used,
          timestamp: response.data.timestamp
        }]);
      }
    } catch (error) {
      console.error('Lỗi khi gửi âm thanh:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'user',
          content: '❌ Không thể xử lý âm thanh',
          timestamp: new Date().toISOString()
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setRecordingTime(0);
    }
  };

  // Format thời gian ghi
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
        <img src={logo} alt="Logo" style={styles.logo} />

        <h1 style={styles.title}>
          Chatbot Nông Nghiệp Thông Minh
        </h1>
      </div>
        <p style={styles.subtitle}>Hỏi về bệnh cây, cách chăm sóc và giải pháp nông nghiệp</p>
      </div>

      {/* Chat Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <MessageCircle size={52} />
            </div>
            <p style={styles.emptyText}>Chào bạn! Tôi là chatbot nông nghiệp thông minh.</p>
            <p style={styles.emptyText}>Hãy hỏi tôi về bệnh cây, cách điều trị, hoặc bất kỳ vấn đề nông nghiệp nào!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ ...styles.messageGroup, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.messageBubble, ...( msg.role === 'user' ? styles.userMessage : styles.botMessage) }}>
                <div style={styles.messageTextWrapper}>
                  {msg.isVoice && (
                    <Mic size={16} style={{ minWidth: '16px' }} />
                  )}
                  {msg.isError && (
                    <AlertCircle size={16} style={{ minWidth: '16px' }} />
                  )}

                  <p style={styles.messageContent}>{msg.content}</p>
                </div>
                                
                {/* Hiển thị context nếu có */}
                {msg.context && msg.context.length > 0 && (
                  <div style={styles.contextBox}>
                    <div style={styles.contextTitle}>
                      <BookOpen size={14} />
                      <strong>Tham khảo</strong>
                    </div>
                    {msg.context.map((ctx, i) => (
                      <div key={i} style={styles.contextItem}>
                        <span>• {ctx.disease} ({ctx.crop})</span>
                        <span style={styles.relevance}>{ctx.relevance}</span>
                      </div>
                    ))}
                  </div>
                )}

                <small style={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                </small>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div style={{ ...styles.messageGroup, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.messageBubble, ...styles.botMessage }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginLeft: '10px' }}>Đang xử lý...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {isRecording && (
          <div style={styles.recordingIndicator}>
            <div style={styles.recordingDot}></div>
            <span style={styles.recordingText}>Đang ghi: {formatRecordingTime(recordingTime)}</span>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi hoặc nhấn nút mic để nói..."
            disabled={isLoading || isRecording}
            style={styles.input}
          />
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            style={{
              ...styles.micButton,
              ...( isRecording ? styles.micButtonActive : {})
            }}
            title={isRecording ? "Dừng ghi" : "Bắt đầu ghi"}
          >
            <Mic size={20} />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || isRecording}
            style={styles.sendButton}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  header: {
    backgroundColor: '#2ecc71',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '24px',
    fontWeight: '600'
  },
  subtitle: {
    margin: '0',
    fontSize: '14px',
    opacity: 0.9
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  emptyIcon: {
    marginBottom: '15px',
    color: '#2ecc71'
  },
  emptyText: {
    margin: '8px 0',
    fontSize: '16px'
  },
  messageGroup: {
    display: 'flex',
    marginBottom: '8px'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
  },
  messageTextWrapper: {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
},
  userMessage: {
    backgroundColor: '#2ecc71',
    color: 'white',
    borderBottomRightRadius: '4px'
  },
  botMessage: {
    backgroundColor: 'white',
    color: '#333',
    borderBottomLeftRadius: '4px',
    border: '1px solid #e0e0e0'
  },
  messageContent: {
    margin: '0 0 8px 0',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap'
  },
  contextBox: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#f9f9f9',
    borderLeft: '3px solid #2ecc71',
    borderRadius: '4px',
    fontSize: '12px'
  },
  contextTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    color: '#2ecc71'
  },
  contextItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    color: '#666',
    fontSize: '11px'
  },
  relevance: {
    marginLeft: '10px',
    fontWeight: '600',
    color: '#2ecc71'
  },
  timestamp: {
    display: 'block',
    marginTop: '6px',
    fontSize: '11px',
    opacity: 0.6
  },
  inputArea: {
    backgroundColor: 'white',
    padding: '15px',
    borderTop: '1px solid #e0e0e0',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#ffe0e0',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#d32f2f'
  },
  recordingDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#d32f2f',
    borderRadius: '50%',
    animation: 'pulse 1s infinite'
  },
  recordingText: {
    fontWeight: '500'
  },
  form: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s',
    ':focus': {
      borderColor: '#2ecc71'
    }
  },
  micButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff9800',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#f57c00'
    }
  },
  micButtonActive: {
    backgroundColor: '#d32f2f',
    animation: 'pulse 1s infinite'
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#2ecc71',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    ':hover:not(:disabled)': {
      backgroundColor: '#27ae60'
    },
    ':disabled': {
      backgroundColor: '#bbb',
      cursor: 'not-allowed'
    }
  },
  titleWrapper: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginBottom: '6px'
},

logo: {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid rgba(255,255,255,0.4)'
},
};

export default ChatPage;
