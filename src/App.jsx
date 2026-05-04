import React, { useState, useRef } from 'react';
import { Lock, Unlock, Download, Upload, Sun, Moon, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { encodeDataInCanvas, decodeDataFromCanvas } from './utils/steganography';

// Import local images
import morningImg from './assets/templates/morning.png';
import nightImg from './assets/templates/night.png';

const templates = [
  { id: 'morning', name: 'Good Morning 🌅', src: morningImg },
  { id: 'night', name: 'Good Night 🌙', src: nightImg },
];

function App() {
  const [activeTab, setActiveTab] = useState('encode');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [message, setMessage] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [encodedImage, setEncodedImage] = useState(null);
  const [decodedMessage, setDecodedMessage] = useState(null);
  const [decodeKey, setDecodeKey] = useState('');
  const [decodeFile, setDecodeFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleEncode = async () => {
    if (!message || !passphrase) {
      setError("Please enter both a message and a passphrase.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedTemplate.src;
      
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const result = encodeDataInCanvas(canvas, message, passphrase);
          setEncodedImage(result);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError("Encoding failed. Try again.");
      setLoading(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile || !decodeKey) {
      setError("Please upload an image and enter the passphrase.");
      return;
    }
    setError(null);
    setLoading(true);
    setDecodedMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const result = decodeDataFromCanvas(canvas, decodeKey);
        if (result) {
          setDecodedMessage(result);
        } else {
          setError("Failed to decode. Incorrect key or no hidden message found.");
        }
        setLoading(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(decodeFile);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `stego_${selectedTemplate.id}.png`;
    link.href = encodedImage;
    link.click();
  };

  return (
    <div className="glass-card">
      <h1>SteganoCrypt</h1>
      <p className="subtitle">Invisible Encrypted Communication via Aesthetic Imagery</p>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'encode' ? 'active' : ''}`}
          onClick={() => { setActiveTab('encode'); setError(null); }}
        >
          <Lock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Encode Secret
        </button>
        <button 
          className={`tab-btn ${activeTab === 'decode' ? 'active' : ''}`}
          onClick={() => { setActiveTab('decode'); setError(null); }}
        >
          <Unlock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Decode Image
        </button>
      </div>

      {error && (
        <div className="error-box">
          <AlertCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {activeTab === 'encode' ? (
        <div className="tab-content">
          <label>Select Aesthetic Template</label>
          <div className="template-grid">
            {templates.map(t => (
              <div 
                key={t.id} 
                className={`template-card ${selectedTemplate.id === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t)}
              >
                <img src={t.src} alt={t.name} />
                <div className="template-label">{t.name}</div>
              </div>
            ))}
          </div>

          <div className="input-group">
            <label>Secret Message</label>
            <textarea 
              rows="4" 
              placeholder="Enter your hidden message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Encryption Passphrase</label>
            <input 
              type="password" 
              placeholder="Keep it secure..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleEncode} disabled={loading}>
            {loading ? <div className="loader" /> : <><ImageIcon size={20} /> Generate Secure Image</>}
          </button>

          {encodedImage && (
            <div className="result-area">
              <img src={encodedImage} className="preview-img" alt="Encoded Result" />
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={downloadImage}>
                <Download size={20} /> Download PNG
              </button>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tip: Share as a file (PNG) to maintain data integrity.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="tab-content">
          <div 
            className="upload-zone"
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              accept="image/png"
              onChange={(e) => setDecodeFile(e.target.files[0])}
            />
            {decodeFile ? (
              <div>
                <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <p>{decodeFile.name}</p>
              </div>
            ) : (
              <div>
                <Upload size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <p>Click to upload the encoded PNG image</p>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Decryption Passphrase</label>
            <input 
              type="password" 
              placeholder="Enter the key to unlock..."
              value={decodeKey}
              onChange={(e) => setDecodeKey(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleDecode} disabled={loading}>
            {loading ? <div className="loader" /> : <><Unlock size={20} /> Reveal Secret Message</>}
          </button>

          {decodedMessage && (
            <div className="result-area">
              <label>Hidden Message Found:</label>
              <div className="message-box">
                {decodedMessage}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
