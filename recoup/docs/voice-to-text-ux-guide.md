# Voice-to-Text UX Patterns for Business Applications

## 1. Voice Input UI Patterns & Best Practices

### 1.1 Recording Button Design

#### Button States & Transitions

```css
/* Recording button base state */
.voice-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Hover state */
.voice-button:hover:not(:disabled) {
  background-color: #e8e8e8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Focus state (keyboard accessibility) */
.voice-button:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Recording state (active) */
.voice-button.recording {
  background-color: #f44336;
  color: white;
  animation: pulse-recording 1.5s ease-in-out infinite;
}

/* Processing state */
.voice-button.processing {
  background-color: #2196f3;
  color: white;
  pointer-events: none;
}

/* Disabled state */
.voice-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Error state */
.voice-button.error {
  background-color: #d32f2f;
  color: white;
  animation: shake 0.5s ease-in-out;
}

@keyframes pulse-recording {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  }
  50% {
    box-shadow: 0 2px 20px rgba(244, 67, 54, 0.6);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

#### Recording State Indicator

```html
<!-- Recording indicator with accessibility labels -->
<div class="recording-indicator" role="status" aria-live="polite" aria-label="Recording in progress">
  <!-- Pulsing dot animation -->
  <div class="pulse-dot">
    <span class="pulse-ring"></span>
    <span class="pulse-ring"></span>
  </div>
  <span class="recording-time">0:12</span>
</div>

<style>
.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffebee;
  border-radius: 6px;
  border-left: 4px solid #f44336;
}

.pulse-dot {
  position: relative;
  width: 12px;
  height: 12px;
}

.pulse-dot::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #f44336;
  border-radius: 50%;
  top: 0;
  left: 0;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  border: 2px solid #f44336;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  animation: expand 1.5s ease-out infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.6s;
}

@keyframes expand {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
```

### 1.2 Button Positioning Strategies

#### Inline Position (Recommended for Forms)

```html
<div class="form-group">
  <label for="message">Message</label>
  <div class="input-container">
    <input 
      id="message"
      type="text" 
      placeholder="Type or speak your message..."
      aria-describedby="voice-hint"
    >
    <button 
      class="voice-button-inline" 
      aria-label="Start voice recording"
      title="Press to start voice recording (keyboard: Ctrl+Shift+V)"
    >
      🎤
    </button>
  </div>
  <small id="voice-hint">Press the microphone icon or use Ctrl+Shift+V to dictate your message</small>
</div>

<style>
.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-container input {
  flex: 1;
  padding: 12px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.voice-button-inline {
  position: absolute;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.voice-button-inline:hover {
  background-color: #f0f0f0;
}

.voice-button-inline:focus {
  outline: 2px solid #1976d2;
}

.voice-button-inline.recording {
  color: #f44336;
  animation: microphone-pulse 1s ease-in-out infinite;
}

@keyframes microphone-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
```

#### Floating Action Button (Mobile)

```html
<div class="floating-voice-button-container">
  <button 
    class="floating-voice-button"
    aria-label="Start voice input"
    id="fab-voice"
  >
    🎤
  </button>
  <div class="voice-tooltip">Hold to record</div>
</div>

<style>
.floating-voice-button-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.floating-voice-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-voice-button:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  transform: scale(1.1);
}

.floating-voice-button:active {
  transform: scale(0.95);
}

.floating-voice-button.recording {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  animation: float-pulse 1s ease-in-out infinite;
}

@keyframes float-pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
  50% {
    box-shadow: 0 8px 24px rgba(244, 67, 54, 0.6);
  }
}

.voice-tooltip {
  position: absolute;
  bottom: 70px;
  right: 0;
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}

.floating-voice-button-container:hover .voice-tooltip {
  opacity: 1;
}

@media (max-width: 768px) {
  .floating-voice-button-container {
    bottom: 16px;
    right: 16px;
  }
}
</style>
```

#### Modal/Dialog Pattern (Desktop)

```html
<div class="voice-modal" id="voice-modal" hidden>
  <div class="voice-modal-backdrop"></div>
  <div class="voice-modal-content" role="dialog" aria-labelledby="voice-modal-title" aria-modal="true">
    <header class="voice-modal-header">
      <h2 id="voice-modal-title">Voice Input</h2>
      <button class="close-button" aria-label="Close voice input modal">✕</button>
    </header>
    
    <div class="voice-modal-body">
      <div class="waveform-container">
        <canvas id="waveform-canvas"></canvas>
      </div>
      
      <div class="recording-stats">
        <div class="stat">
          <span class="stat-label">Duration:</span>
          <span class="stat-value" id="duration">0:00</span>
        </div>
        <div class="stat">
          <span class="stat-label">Language:</span>
          <select id="language-select" aria-label="Select language for transcription">
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
            <option value="en-AU">English (Australian)</option>
          </select>
        </div>
      </div>
    </div>
    
    <footer class="voice-modal-footer">
      <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
      <button class="btn btn-primary recording" id="record-btn" aria-pressed="false">
        <span class="record-icon">🎤</span>
        <span class="record-text">Start Recording</span>
      </button>
      <button class="btn btn-primary" id="confirm-btn">Confirm</button>
    </footer>
  </div>
</div>

<style>
.voice-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.voice-modal[hidden] {
  display: none;
}

.voice-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.voice-modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.voice-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.voice-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.waveform-container {
  margin-bottom: 20px;
  min-height: 120px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-container canvas {
  width: 100%;
  height: 100%;
}

.recording-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.voice-modal-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1565c0;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d0d0d0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### 1.3 Visual Feedback: Waveform Visualization

```javascript
// Canvas-based waveform visualization
class WaveformVisualizer {
  constructor(canvasElement, audioContext) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.audioContext = audioContext;
    this.analyser = null;
    this.animationId = null;
    this.dataArray = null;
    this.barCount = 50;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  connectAudioStream(stream) {
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    const source = this.audioContext.createMediaStreamAudioSource(stream);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  start() {
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.clearCanvas();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    this.draw();
  }

  draw() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    const barWidth = width / this.barCount;

    // Clear canvas
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, width, height);

    // Draw waveform bars
    this.ctx.fillStyle = '#1976d2';
    const centerY = height / 2;
    
    for (let i = 0; i < this.barCount; i++) {
      const index = Math.floor((i / this.barCount) * this.dataArray.length);
      const value = this.dataArray[index] / 255;
      const barHeight = value * height * 0.8;

      const x = i * barWidth;
      const y = centerY - barHeight / 2;

      this.ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }

  clearCanvas() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, width, height);
  }
}

// Usage
const canvas = document.getElementById('waveform-canvas');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const visualizer = new WaveformVisualizer(canvas, audioContext);

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    visualizer.connectAudioStream(stream);
    visualizer.start();
  });
```

---

## 2. Voice-to-Text Accuracy: Browser APIs & Providers

### 2.1 Web Speech API vs Third-Party Services Comparison

| Feature | Web Speech API | Deepgram | AssemblyAI | Google Cloud STT |
|---------|---|---|---|---|
| **Word Error Rate** | 5-10% | 0.5-2% (domain-tuned) | 5.65-6.7% | 3-5% |
| **Latency** | 500-1500ms | <300ms (40x faster) | 1-3s | 1-2s |
| **Streaming Support** | Native | Yes (WebRTC) | Yes | Yes |
| **Offline Capability** | No (cloud-based) | On-premises available | Cloud only | Cloud only |
| **Pricing** | Free | $0.0043/min | $0.12/min | $0.024/15sec |
| **Browser Support** | Chrome, Edge (not Firefox/Safari) | API-based | API-based | API-based |
| **Accent Support** | Basic | Excellent (custom training) | Good | Good |
| **Setup Complexity** | Low | Medium | Low | High |

### 2.2 Web Speech API Implementation

```javascript
class VoiceRecognitionManager {
  constructor(language = 'en-GB') {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      this.supported = false;
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.supported = true;
    this.language = language;
    this.isRecording = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.confidence = 0;
    
    this.setupRecognition();
  }

  setupRecognition() {
    // Settings
    this.recognition.continuous = true; // Continue recording until explicitly stopped
    this.recognition.interimResults = true; // Show partial results
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    // Event handlers
    this.recognition.onstart = () => {
      this.isRecording = true;
      this.dispatchEvent('recordingStarted');
    };

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
          this.confidence = confidence;
          this.dispatchEvent('transcribed', { 
            text: transcript, 
            confidence,
            isFinal: true 
          });
        } else {
          this.interimTranscript += transcript;
          this.dispatchEvent('interim', { text: transcript });
        }
      }
    };

    this.recognition.onerror = (event) => {
      this.dispatchEvent('error', { error: event.error });
      this.handleError(event.error);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.dispatchEvent('recordingStopped', { 
        finalTranscript: this.transcript.trim() 
      });
    };
  }

  handleError(error) {
    const errorMessages = {
      'network': 'Network error occurred',
      'audio-capture': 'No microphone found or access denied',
      'not-allowed': 'Permission to use microphone was denied',
      'no-speech': 'No speech detected. Please try again.',
      'service-not-allowed': 'Speech Recognition service is not allowed',
    };
    
    console.error('Speech Recognition Error:', errorMessages[error] || error);
  }

  start() {
    if (!this.supported) {
      console.error('Speech Recognition API not supported');
      return;
    }
    
    this.transcript = '';
    this.interimTranscript = '';
    this.recognition.start();
  }

  stop() {
    this.recognition.stop();
  }

  abort() {
    this.recognition.abort();
  }

  setLanguage(lang) {
    this.language = lang;
    this.recognition.lang = lang;
  }

  dispatchEvent(eventType, detail = {}) {
    window.dispatchEvent(new CustomEvent(`voice:${eventType}`, { detail }));
  }
}

// Usage
const voiceManager = new VoiceRecognitionManager('en-GB');

window.addEventListener('voice:transcribed', (e) => {
  console.log('Final:', e.detail.text);
  console.log('Confidence:', (e.detail.confidence * 100).toFixed(2) + '%');
});

window.addEventListener('voice:interim', (e) => {
  console.log('Interim:', e.detail.text);
});

window.addEventListener('voice:error', (e) => {
  console.error('Error:', e.detail.error);
});
```

### 2.3 Deepgram Integration

```javascript
class DeepgramVoiceRecognizer {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepgram.com/v1/listen';
    this.options = {
      model: 'nova-2-general', // Or nova-2-medical, nova-2-finance
      language: 'en',
      tier: 'nova', // base, nova
      ...options
    };
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.socket = null;
  }

  // Streaming transcription (Real-time)
  async startStreaming() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Deepgram WebSocket for real-time transcription
      const params = new URLSearchParams({
        key: this.apiKey,
        model: this.options.model,
        language: this.options.language,
        encoding: 'linear16',
        sample_rate: 16000,
      });

      this.socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`);

      this.socket.onopen = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const source = audioContext.createMediaStreamAudioSource(stream);
        
        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          const audioData = event.inputData.getChannelData(0);
          // Convert to 16-bit PCM
          const pcm = this.convertToPCM(audioData);
          if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(pcm);
          }
        };
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel.alternatives[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          const confidence = data.channel.alternatives[0].confidence;
          console.log(`[${confidence}] ${transcript}`);
        }
      };

      this.socket.onerror = (error) => console.error('WebSocket error:', error);
    } catch (error) {
      console.error('Error starting streaming:', error);
    }
  }

  // Post-recording transcription (Higher accuracy)
  async transcribeFile(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob);

    const params = new URLSearchParams({
      key: this.apiKey,
      model: this.options.model,
      language: this.options.language,
    });

    try {
      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const transcript = result.results.channels[0].alternatives[0].transcript;
      const confidence = result.results.channels[0].alternatives[0].confidence;
      
      return { transcript, confidence };
    } catch (error) {
      console.error('Transcription error:', error);
    }
  }

  convertToPCM(floatArray) {
    const pcm = new Int16Array(floatArray.length);
    for (let i = 0; i < floatArray.length; i++) {
      const s = Math.max(-1, Math.min(1, floatArray[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm.buffer;
  }
}

// Usage
const deepgram = new DeepgramVoiceRecognizer('YOUR_DEEPGRAM_API_KEY', {
  model: 'nova-2-general',
  language: 'en-GB'
});

await deepgram.startStreaming();
```

---

## 3. Real-Time vs Post-Recording Transcription

### 3.1 When to Use Each Approach

**Real-Time Transcription (Streaming):**
- ✅ Voice agents and conversational AI
- ✅ Live chat support interfaces
- ✅ Meeting transcription with immediate feedback
- ✅ Accessibility for real-time captions
- ❌ Lower accuracy (1-2% degradation)
- ❌ Higher API costs for continuous streaming

**Post-Recording Transcription:**
- ✅ Higher accuracy (5-10% better than real-time)
- ✅ Lower costs
- ✅ Time-consuming tasks (podcasts, lectures)
- ✅ User review before confirmation
- ❌ Delayed feedback
- ❌ Not suitable for conversational flows

### 3.2 Hybrid Approach (Best of Both)

```javascript
class HybridVoiceRecognizer {
  constructor(options = {}) {
    this.useRealTime = options.useRealTime !== false;
    this.audioBuffer = [];
    this.mediaRecorder = null;
    this.recordedBlob = null;
    this.interimResults = [];
    this.finalTranscript = '';
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    // Collect audio chunks for post-processing
    this.mediaRecorder.ondataavailable = (event) => {
      this.audioBuffer.push(event.data);
    };

    // If real-time enabled, start WebSocket stream
    if (this.useRealTime) {
      this.startRealTimeTranscription(stream);
    }

    this.mediaRecorder.start();
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        this.recordedBlob = new Blob(this.audioBuffer, { type: 'audio/webm' });
        
        // Get more accurate post-processing result
        const finalResult = await this.processRecordedAudio(this.recordedBlob);
        
        resolve({
          interim: this.interimResults,
          final: finalResult,
          blob: this.recordedBlob
        });
      };
      
      this.mediaRecorder.stop();
    });
  }

  async startRealTimeTranscription(stream) {
    // Send audio to real-time API (Deepgram, etc.)
    // Update UI with interim results as they arrive
  }

  async processRecordedAudio(blob) {
    // Send complete recording to post-processing service
    // Returns higher accuracy transcript
    // Can include speaker diarization, punctuation correction, etc.
  }
}
```

---

## 4. Error Correction UI Patterns

### 4.1 Inline Editing with Confidence Indicators

```html
<div class="transcript-editor">
  <div class="transcript-text" contenteditable="true" id="transcript">
    <!-- Words with confidence indicators -->
    <span class="word low-confidence" data-confidence="0.65" title="Low confidence - Click to review">
      receipt
    </span>
    <span class="word high-confidence" data-confidence="0.98">
      for
    </span>
    <span class="word medium-confidence" data-confidence="0.82">
      your
    </span>
    <span class="word high-confidence" data-confidence="0.95">
      purchase
    </span>
  </div>
</div>

<style>
.transcript-editor {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  line-height: 1.6;
  font-size: 16px;
}

.word {
  position: relative;
  cursor: pointer;
  transition: background-color 150ms ease;
  padding: 2px 4px;
  border-radius: 2px;
}

/* High confidence (>0.90) */
.word.high-confidence {
  background-color: transparent;
  border-bottom: 2px solid transparent;
}

/* Medium confidence (0.70-0.90) */
.word.medium-confidence {
  background-color: #fff9e6;
  border-bottom: 2px solid #ffc107;
}

.word.medium-confidence:hover {
  background-color: #ffe082;
}

/* Low confidence (<0.70) */
.word.low-confidence {
  background-color: #ffebee;
  border-bottom: 2px solid #f44336;
}

.word.low-confidence:hover {
  background-color: #ffcdd2;
}

/* Hover state with alternatives popup */
.word:hover::after {
  content: attr(data-alternatives);
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #333;
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 4px;
  pointer-events: none;
  z-index: 100;
}
</style>

<script>
// Highlight low confidence words
document.querySelectorAll('.word.low-confidence').forEach(word => {
  word.addEventListener('click', (e) => {
    const alternatives = ['receipt', 'recept', 'recipt'];
    showAlternativesMenu(e.target, alternatives);
  });
});

function showAlternativesMenu(wordElement, alternatives) {
  const menu = document.createElement('div');
  menu.className = 'alternatives-menu';
  menu.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    min-width: 150px;
  `;
  
  alternatives.forEach(alt => {
    const item = document.createElement('div');
    item.textContent = alt;
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 150ms;
    `;
    
    item.onmouseover = () => item.style.backgroundColor = '#f5f5f5';
    item.onmouseout = () => item.style.backgroundColor = 'transparent';
    item.onclick = () => {
      wordElement.textContent = alt;
      wordElement.classList.remove('low-confidence');
      wordElement.classList.add('high-confidence');
      menu.remove();
    };
    
    menu.appendChild(item);
  });
  
  document.body.appendChild(menu);
  menu.style.top = wordElement.getBoundingClientRect().bottom + 'px';
  menu.style.left = wordElement.getBoundingClientRect().left + 'px';
}
</script>
```

### 4.2 Descript-Style Quick Edit

```javascript
class QuickEditTranscript {
  constructor(transcriptElement) {
    this.element = transcriptElement;
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Hold E + Click word to edit
      if (e.key === 'e' || e.key === 'E') {
        this.enterEditMode = true;
      }
    });

    document.addEventListener('keyup', () => {
      this.enterEditMode = false;
    });

    // Word-level click handling
    this.element.addEventListener('click', (e) => {
      if (this.enterEditMode && e.target.classList.contains('word')) {
        this.editWord(e.target);
      }
    });
  }

  editWord(wordElement) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = wordElement.textContent;
    input.style.cssText = `
      padding: 2px 4px;
      border: 1px solid #1976d2;
      border-radius: 2px;
      font-size: 16px;
      font-family: inherit;
    `;

    input.onblur = () => {
      wordElement.textContent = input.value || wordElement.textContent;
      wordElement.replaceWith(wordElement);
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        wordElement.textContent = wordElement.textContent;
        wordElement.replaceWith(wordElement);
      }
    };

    wordElement.replaceWith(input);
    input.focus();
    input.select();
  }
}
```

---

## 5. Mobile vs Desktop Voice Input

### 5.1 Platform-Specific Considerations

#### Browser Support Matrix

| Browser | Web Speech API | MediaRecorder | getUserMedia | WebRTC |
|---------|---|---|---|---|
| **Chrome (Desktop)** | ✅ | ✅ | ✅ | ✅ |
| **Chrome (Android)** | ✅ Limited | ✅ | ✅ | ✅ |
| **Safari (iOS)** | ❌ | ✅ | ⚠️ Limited | ✅ |
| **Safari (macOS)** | ❌ | ✅ | ✅ | ✅ |
| **Firefox** | ❌ | ✅ | ✅ | ✅ |
| **Edge** | ✅ | ✅ | ✅ | ✅ |

#### iOS Safari Workarounds

```javascript
class PlatformVoiceInput {
  static async handlePlatformSpecifics() {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

    if (isIOS && isSafari) {
      return this.getIOSSafariAlternative();
    }
    
    return this.getStandardImplementation();
  }

  static async getIOSSafariAlternative() {
    // iOS Safari limitations:
    // 1. Web Speech API not available
    // 2. getUserMedia requires HTTPS
    // 3. AudioContext may pause when microphone activates
    
    return {
      useWebSpeechAPI: false,
      fallbackToThirdParty: true,
      provider: 'deepgram', // or 'assemblyai'
      requiresHTTPS: true,
      audioContextWorkaround: `
        // After getUserMedia, resume AudioContext
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      `
    };
  }

  static getStandardImplementation() {
    return {
      useWebSpeechAPI: true,
      fallbackToThirdParty: true,
      provider: 'webSpeechAPI'
    };
  }
}
```

#### Mobile Touch Gestures

```javascript
class MobileVoiceGestures {
  constructor(recordButton) {
    this.button = recordButton;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.setupGestures();
  }

  setupGestures() {
    // Long press to start recording (WhatsApp style)
    this.button.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartX = e.touches[0].clientX;
      this.longPressTimer = setTimeout(() => {
        this.startRecording();
      }, 500);
    });

    this.button.addEventListener('touchmove', (e) => {
      if (!this.isRecording) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      
      // Slide up to lock recording
      if (currentY < this.touchStartY - 50) {
        this.lockRecording();
      }
      
      // Slide left to cancel
      if (currentX < this.touchStartX - 50) {
        this.cancelRecording();
      }
    });

    this.button.addEventListener('touchend', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
      
      if (this.isRecording && !this.isLocked) {
        this.stopRecording();
      }
    });
  }

  startRecording() {
    this.isRecording = true;
    this.showRecordingUI();
  }

  lockRecording() {
    this.isLocked = true;
    // Show confirmation to send
  }

  cancelRecording() {
    this.isRecording = false;
    this.isLocked = false;
    this.resetUI();
  }

  stopRecording() {
    this.isRecording = false;
    this.submitRecording();
  }

  showRecordingUI() {
    const overlay = document.createElement('div');
    overlay.className = 'recording-overlay';
    overlay.innerHTML = `
      <div class="recording-indicator">
        <span class="pulse"></span>
        <span class="duration">0:00</span>
      </div>
      <div class="gesture-hints">
        <div class="hint slide-up">⬆️ Slide up to lock</div>
        <div class="hint slide-left">⬅️ Slide left to cancel</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}
```

---

## 6. Accessibility: WCAG 2.1 Compliance

### 6.1 WCAG Requirements for Voice Input

```html
<!-- Complete accessible voice input example -->
<div class="voice-input-container">
  <!-- Screen reader instructions -->
  <div class="sr-only" id="voice-instructions">
    Microphone button. Press to start voice recording. Use Ctrl+Shift+V keyboard shortcut. 
    Tab through results to review transcript.
  </div>

  <!-- Main voice button with proper ARIA -->
  <button 
    id="voice-button"
    class="voice-button"
    aria-label="Start voice recording (Ctrl+Shift+V)"
    aria-describedby="voice-instructions"
    aria-pressed="false"
  >
    🎤
  </button>

  <!-- Recording state announcement -->
  <div 
    id="recording-status" 
    role="status" 
    aria-live="polite" 
    aria-atomic="true"
    class="sr-only"
  >
    Ready to start recording
  </div>

  <!-- Transcript with semantic structure -->
  <div 
    id="transcript-container"
    role="region"
    aria-label="Voice transcript"
    aria-live="polite"
  >
    <div class="transcript-output" id="transcript">
      <!-- Transcription appears here -->
    </div>
  </div>

  <!-- Error messages with proper roles -->
  <div 
    id="error-message" 
    role="alert" 
    aria-live="assertive"
    aria-atomic="true"
    class="sr-only"
  >
    <!-- Errors announced immediately -->
  </div>
</div>

<style>
/* Screen reader only text - never display visually */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* High contrast focus indicator for keyboard navigation */
.voice-button:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
}

/* Sufficient color contrast (4.5:1 for normal text) */
.transcript-output {
  color: #212121;
  background-color: #ffffff;
  min-contrast-ratio: 4.5;
}

/* Large touch targets for motor accessibility (minimum 44x44px) */
.voice-button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Sufficient spacing for users with motor disabilities */
button + button {
  margin-left: 12px;
}
</style>

<script>
// Keyboard accessibility - SC 2.1.4: Character Key Shortcuts
class AccessibleVoiceInput {
  constructor() {
    this.setupKeyboardControls();
    this.setupScreenReaderAnnouncements();
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      // Custom keyboard shortcut: Ctrl+Shift+V
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        this.toggleRecording();
      }
      
      // Allow users to override: SC 2.1.4
      // Users can configure/disable this shortcut in preferences
    });

    // Tab navigation
    const transcriptWords = document.querySelectorAll('[role="option"]');
    let currentWordIndex = 0;

    transcriptWords.forEach((word, index) => {
      word.tabIndex = index === 0 ? 0 : -1;
      word.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          if (index < transcriptWords.length - 1) {
            transcriptWords[index + 1].focus();
          }
        } else if (e.key === 'ArrowLeft') {
          if (index > 0) {
            transcriptWords[index - 1].focus();
          }
        }
      });
    });
  }

  setupScreenReaderAnnouncements() {
    // Announce recording state changes
    const recordingStatus = document.getElementById('recording-status');
    
    window.addEventListener('voice:recordingStarted', () => {
      recordingStatus.textContent = 'Recording started. Speak your message.';
    });

    window.addEventListener('voice:interim', (e) => {
      // Only announce significant changes
      recordingStatus.textContent = e.detail.text;
    });

    window.addEventListener('voice:recordingStopped', (e) => {
      recordingStatus.textContent = `Recording stopped. ${e.detail.finalTranscript}. Tab through to review and edit.`;
    });

    window.addEventListener('voice:error', (e) => {
      const errorMsg = document.getElementById('error-message');
      errorMsg.textContent = `Error: ${e.detail.error}`;
    });
  }

  toggleRecording() {
    const button = document.getElementById('voice-button');
    const isPressed = button.getAttribute('aria-pressed') === 'true';
    
    button.setAttribute('aria-pressed', String(!isPressed));
    
    if (!isPressed) {
      // Announce to screen reader
      document.getElementById('recording-status').textContent = 'Starting recording...';
    }
  }
}

// Initialize
new AccessibleVoiceInput();
</script>
```

### 6.2 WCAG Success Criteria Checklist

```markdown
# Voice Input Accessibility Checklist

## SC 2.1.1 Keyboard (Level A)
- ✅ All voice input functionality accessible via keyboard
- ✅ No time-based keystrokes required
- ✅ Tab order logical and visible
- ✅ Can start/stop recording with keyboard

## SC 2.1.4 Character Key Shortcuts (Level A)
- ✅ Single-key shortcuts use modifier keys
- ✅ Shortcuts can be disabled or remapped
- ✅ Doesn't apply when form control focused

## SC 4.1.2 Name, Role, Value (Level A)
- ✅ Voice button has proper aria-label
- ✅ Recording state announced via aria-pressed
- ✅ Transcript has proper role="region"

## SC 4.1.3 Status Messages (Level AA)
- ✅ Recording status announced via aria-live="polite"
- ✅ Errors announced via role="alert"
- ✅ No need to obtain focus

## SC 2.4.7 Focus Visible (Level AA)
- ✅ Focus indicator has 3:1 contrast
- ✅ Outline offset visible
- ✅ Not hidden by other elements

## SC 3.3.4 Error Prevention (Level AA)
- ✅ Transcript editable before submission
- ✅ Confirmation dialog for sensitive actions
- ✅ Undo option available

## SC 3.3.3 Error Suggestion (Level AA)
- ✅ Low confidence words highlighted
- ✅ Alternative suggestions provided
- ✅ User can easily correct

## SC 2.5.1 Pointer Gestures (Level A)
- ✅ Voice input works with single click/tap
- ✅ Complex gestures have alternatives
- ✅ Gesture-based actions aren't required
```

---

## 7. Production-Ready Code Examples

### 7.1 React Voice Recorder Component

```jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

const VoiceRecorder = ({ onTranscript, language = 'en-GB' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [recordingStates, setRecordingStates] = useState({
    idle: true,
    recording: false,
    processing: false,
    error: false
  });

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    initializeRecognition();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [language]);

  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setRecordingStates({ idle: false, recording: true, processing: false, error: false });
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) setTranscript(prev => prev + final);
    };

    recognition.onerror = (event) => {
      setRecordingStates({ idle: false, recording: false, processing: false, error: true });
      setError(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      clearInterval(timerRef.current);
      setRecordingStates({ idle: true, recording: false, processing: false, error: false });
      setIsRecording(false);
      setInterimTranscript('');
      
      if (transcript || interimTranscript) {
        onTranscript?.(transcript + interimTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, [language, onTranscript, transcript, interimTranscript]);

  const startRecording = () => {
    setError(null);
    setTranscript('');
    recognitionRef.current?.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`voice-button ${recordingStates.recording ? 'recording' : ''} ${recordingStates.error ? 'error' : ''}`}
        disabled={recordingStates.processing}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
      >
        🎤
      </button>

      {recordingStates.recording && (
        <div className="recording-indicator" role="status" aria-live="polite">
          <div className="pulse"></div>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {transcript && (
        <div className="transcript">
          <p>{transcript}</p>
          {interimTranscript && <p className="interim">{interimTranscript}</p>}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
```

### 7.2 CSS Styling

```css
.voice-recorder {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.voice-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background-color: #f0f0f0;
  font-size: 24px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.voice-button:hover:not(:disabled) {
  background-color: #e8e8e8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.voice-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.voice-button.recording {
  background-color: #f44336;
  animation: pulse-recording 1.5s ease-in-out infinite;
}

.voice-button.error {
  background-color: #d32f2f;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
}

.pulse {
  width: 12px;
  height: 12px;
  background-color: #f44336;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-recording {
  0%, 100% { box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3); }
  50% { box-shadow: 0 2px 20px rgba(244, 67, 54, 0.6); }
}

.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
  font-size: 14px;
}

.transcript {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  line-height: 1.6;
}

.transcript p {
  margin: 0 0 8px 0;
}

.transcript .interim {
  color: #999;
  font-style: italic;
}
```

---

## 8. Testing Voice Input UX

### 8.1 Test Scenarios

```javascript
// Test scenarios to validate voice input UX

const testScenarios = {
  // Test 1: Initial state
  initialState: {
    description: 'Button should show ready state',
    assertions: [
      'Button displays microphone icon',
      'Button is not disabled',
      'aria-label contains "start"',
      'aria-pressed="false"'
    ]
  },

  // Test 2: Recording started
  recordingStarted: {
    description: 'Visual feedback when recording starts',
    assertions: [
      'Button changes to red color',
      'Pulsing animation active',
      'Recording indicator shows',
      'Timer starts counting',
      'aria-pressed="true"',
      'Screen reader announces "Recording started"'
    ]
  },

  // Test 3: Audio capture
  audioCapture: {
    description: 'Audio captured and waveform displayed',
    assertions: [
      'Waveform updates in real-time',
      'Interim transcript appears',
      'Confidence scores displayed for low-confidence words',
      'No audio glitches or clipping'
    ]
  },

  // Test 4: Error handling
  errorHandling: {
    description: 'Graceful error handling',
    assertions: [
      'Error message displayed',
      'aria-live announcement triggered',
      'User can retry',
      'Button returns to ready state',
      'No stuck states'
    ]
  },

  // Test 5: Accessibility
  accessibility: {
    description: 'Full keyboard and screen reader support',
    assertions: [
      'Ctrl+Shift+V triggers recording',
      'Tab navigates through transcript words',
      'Tab+Enter selects alternative words',
      'Screen reader announces all state changes',
      'Focus indicators visible',
      'Contrast ratios meet WCAG AA'
    ]
  },

  // Test 6: Mobile responsiveness
  mobileResponsiveness: {
    description: 'Touch and mobile optimizations',
    assertions: [
      'Floating action button visible on mobile',
      'Touch targets > 44x44px',
      'Gesture support works (long press, swipe)',
      'No horizontal scroll',
      'Performance good on 4G'
    ]
  },

  // Test 7: Browser compatibility
  browserCompatibility: {
    browsers: ['Chrome Desktop', 'Chrome Android', 'Safari macOS', 'Edge', 'Firefox'],
    assertions: [
      'Web Speech API supported or fallback works',
      'getUserMedia permission prompt works',
      'AudioContext resumes on iOS',
      'No console errors'
    ]
  }
};

// Performance benchmarks
const performanceBenchmarks = {
  'Recording start latency': '< 200ms',
  'First transcript appearance': '< 500ms',
  'Interim result update': '< 300ms',
  'Final transcript latency': '< 1s',
  'Error recovery': '< 2s',
  'UI responsiveness': '60 FPS'
};
```

---

## Conclusion

This guide covers best practices for implementing voice-to-text UX in business applications, from UI patterns and API selection to accessibility compliance and mobile optimization. The key takeaways are:

1. **Choose button positions based on context**: Inline for forms, floating for secondary actions
2. **Implement comprehensive visual feedback**: Waveforms, pulsing indicators, and state transitions
3. **Prioritize accuracy over speed**: Use post-processing for important data, real-time for responsiveness
4. **Provide error correction UI**: Confidence indicators and inline editing for user control
5. **Ensure full keyboard and screen reader accessibility**: WCAG 2.1 compliance is non-negotiable
6. **Handle browser limitations gracefully**: Feature detection and fallback strategies
7. **Test across platforms**: Desktop, mobile (iOS/Android), and different browsers
