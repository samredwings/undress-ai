/**
 * CARNAL ROULETTE VR — Session Recorder
 * Captures VR canvas to WebM video using MediaRecorder API
 */

const Recorder = {
  mediaRecorder: null,
  recordedChunks: [],
  isRecording: false,
  stream: null,

  init() {
    document.getElementById('btn-start-record').addEventListener('click', () => this.startRecording());
    document.getElementById('btn-stop-record').addEventListener('click', () => this.stopRecording());
  },

  async startRecording() {
    if (this.isRecording) return;

    const canvas = VRScene.renderer?.domElement;
    if (!canvas) {
      console.warn('[Recorder] No canvas available');
      return;
    }

    try {
      // Capture stream from WebGL canvas
      this.stream = canvas.captureStream(30); // 30 FPS
      
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm;codecs=av1',
        'video/webm',
      ];

      let mimeType = 'video/webm';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt;
          break;
        }
      }

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveVideo();
      };

      this.mediaRecorder.start(1000); // chunk every second
      this.isRecording = true;

      // UI state
      document.getElementById('btn-start-record').disabled = true;
      document.getElementById('btn-stop-record').disabled = false;
      document.getElementById('rec-status').textContent = '🔴 RECORDING';
      document.getElementById('rec-status').style.color = '#ff0044';

      // Start timer
      this.startTimer();
      
      console.log('[Recorder] Recording started');

    } catch (err) {
      console.error('[Recorder] Failed to start recording:', err);
      document.getElementById('rec-status').textContent = `Error: ${err.message}`;
      document.getElementById('rec-status').style.color = '#ff0044';
    }
  },

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    this.mediaRecorder.stop();
    this.isRecording = false;

    // UI state
    document.getElementById('btn-start-record').disabled = false;
    document.getElementById('btn-stop-record').disabled = true;
    document.getElementById('rec-status').textContent = '⏹ Stopped • Processing...';
    document.getElementById('rec-status').style.color = '#ffcc00';

    this.stopTimer();
  },

  saveVideo() {
    if (this.recordedChunks.length === 0) {
      document.getElementById('rec-status').textContent = 'No data recorded';
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `carnal-roulette-session-${timestamp}.webm`;

    // Auto-download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    URL.revokeObjectURL(url);

    document.getElementById('rec-status').textContent = `✅ Saved: ${filename}`;
    document.getElementById('rec-status').style.color = '#00ff88';

    // Release stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    console.log(`[Recorder] Video saved: ${blob.size / 1024 / 1024} MB`);
  },

  timerInterval: null,
  seconds: 0,

  startTimer() {
    this.seconds = 0;
    this.timerInterval = setInterval(() => {
      this.seconds++;
      const mins = Math.floor(this.seconds / 60);
      const secs = this.seconds % 60;
      document.getElementById('rec-timer').textContent = 
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },
};
