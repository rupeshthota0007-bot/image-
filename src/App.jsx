import React, { useState, useRef } from 'react';
import { Lock, Unlock, Download, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
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
  const encodeCustomRef = useRef(null);

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

  const handleCustomEncodeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const customT = { id: 'custom', name: 'Custom Image', src: event.target.result };
      setSelectedTemplate(customT);
    };
    reader.readAsDataURL(file);
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
          <Lock size={18} /> Encode
        </button>
        <button 
          className={`tab-btn ${activeTab === 'decode' ? 'active' : ''}`}
          onClick={() => { setActiveTab('decode'); setError(null); }}
        >
          <Unlock size={18} /> Decode
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {activeTab === 'encode' ? (
        <div className="tab-content">
          <label>Select Template</label>
          <div className="template-grid">
            {templates.map(t => (
              <div 
                key={t.id} 
                className={`template-card ${selectedTemplate.id === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t)}
              >
                <img src={t.src} alt={t.name} />
                <div style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>{t.name}</div>
              </div>
            ))}
            <div 
              className={`template-card ${selectedTemplate.id === 'custom' ? 'active' : ''}`}
              onClick={() => encodeCustomRef.current.click()}
            >
              <input 
                type="file" 
                hidden 
                ref={encodeCustomRef} 
                accept="image/*"
                onChange={handleCustomEncodeUpload}
              />
              <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                {selectedTemplate.id === 'custom' ? (
                  <img src={selectedTemplate.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Custom" />
                ) : (
                  <>
                    <Upload size={24} />
                    <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Upload Custom</span>
                  </>
                )}
              </div>
              <div style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
                {selectedTemplate.id === 'custom' ? 'Custom Image' : 'Your Image'}
              </div>
            </div>
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
            <label>Passphrase</label>
            <input 
              type="password" 
              placeholder="Encryption key..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleEncode} disabled={loading}>
            {loading ? "Processing..." : <><ImageIcon size={20} /> Generate Image</>}
          </button>

          {encodedImage && (
            <div className="result-area">
              <img src={encodedImage} className="preview-img" alt="Encoded" />
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={downloadImage}>
                <Download size={20} /> Download PNG
              </button>
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
              <p><CheckCircle size={48} color="#10b981" /><br/>{decodeFile.name}</p>
            ) : (
              <p><Upload size={48} color="var(--text-muted)" /><br/>Upload encoded PNG</p>
            )}
          </div>

          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label>Passphrase</label>
            <input 
              type="password" 
              placeholder="Decryption key..."
              value={decodeKey}
              onChange={(e) => setDecodeKey(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleDecode} disabled={loading}>
            {loading ? "Decrypting..." : <><Unlock size={20} /> Reveal Message</>}
          </button>

          {decodedMessage && (
            <div className="result-area">
              <label>Hidden Message:</label>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem', color: '#10b981', wordBreak: 'break-all' }}>
                {decodedMessage}
              </div>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
