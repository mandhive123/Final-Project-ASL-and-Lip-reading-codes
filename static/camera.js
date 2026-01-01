// ============================================
// MERCEDES-AMG F1 CAMERA.JS - ENHANCED LUXURY VERSION
// YOLOv11 ASL + LIP READING with Premium Features
// ============================================

// History tracking
let conversionStartTime = null;
let lipConversionStartTime = null;

// Sound effects (optional - can be disabled)
const soundEnabled = false; // Set to true if you want sound effects

function playSound(type) {
    if (!soundEnabled) return;
    const audio = new Audio();
    const sounds = {
        start: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi77eafTQ',
        stop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi77eafTQ'
    };
    audio.src = sounds[type] || sounds.start;
    audio.play().catch(() => {}); // Ignore errors
}

function saveConversionToHistory(type, input, output, confidence, method, duration, metadata) {
    if (window.historyModule && window.historyModule.saveToHistory) {
        window.historyModule.saveToHistory(type, input, output, confidence, method, duration, metadata);
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `amg-notification ${type}`;
    notification.innerHTML = `
        <i class='bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-error-circle' : 'bx-info-circle'}'></i>
        <span>${message}</span>
    `;
    
    // Add styles if not exist
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .amg-notification {
                position: fixed;
                top: 60px;
                right: 20px;
                padding: 15px 25px;
                background: linear-gradient(135deg, #0E0F13 0%, #1a1b21 100%);
                border: 2px solid #04BFAD;
                border-radius: 8px;
                color: #C1D4D9;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 0 30px rgba(4, 191, 173, 0.3);
                font-family: 'Exo 2', sans-serif;
                font-weight: 600;
                font-size: 14px;
                letter-spacing: 0.5px;
            }
            .amg-notification.success { border-color: #04BFAD; }
            .amg-notification.error { border-color: #ff3b30; }
            .amg-notification.warning { border-color: #ffbd2e; }
            .amg-notification i { font-size: 24px; color: #04BFAD; }
            .amg-notification.error i { color: #ff3b30; }
            .amg-notification.warning i { color: #ffbd2e; }
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// YOLOV11 ASL CAMERA CLASS - ENHANCED
// ============================================

class ASLCamera {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.canvasElement = document.getElementById('canvasElement');
        this.outputElement = document.getElementById('aslTextOutput');
        this.statusElement = document.getElementById('cameraStatus');
        
        this.stream = null;
        this.isProcessing = false;
        this.processingInterval = null;
        this.currentText = "";
        this.lastPrediction = null;
        this.lastAddedSign = null;
        this.lastAddTime = 0;
        
        // Prevent duplicate additions
        this.addCooldown = 1.0; // seconds
        
        // Stats
        this.stats = { 
            predictions: 0, 
            detections: 0,
            model_loaded: false 
        };
        
        if (this.canvasElement) {
            this.canvasElement.width = 960;
            this.canvasElement.height = 720;
        }
        
        console.log('[AMG] YOLOv11 ASL Camera initialized');
        this.checkModelStatus();
        this.ensureInterfaceVisible();
    }
    
    ensureInterfaceVisible() {
        const yoloInterface = document.getElementById('aslYoloInterface');
        if (yoloInterface) {
            yoloInterface.style.display = 'block';
            yoloInterface.style.visibility = 'visible';
        }
        
        if (this.statusElement) {
            this.statusElement.style.display = 'flex';
            this.statusElement.style.visibility = 'visible';
        }
    }
    
    async checkModelStatus() {
        try {
            const response = await fetch('/system_status');
            const status = await response.json();
            
            if (status.yolo && status.yolo.available) {
                this.stats.model_loaded = true;
                const statusEl = document.getElementById('yoloStatus');
                if (statusEl) {
                    statusEl.innerHTML = `Model Ready - ${status.signs.total} signs loaded`;
                    statusEl.style.color = '#04BFAD';
                }
                
                const modelLoadedEl = document.getElementById('yoloModelLoaded');
                if (modelLoadedEl) {
                    modelLoadedEl.innerHTML = '<i class="bx bx-check"></i>';
                }
                
                const totalSignsEl = document.getElementById('yoloTotalSigns');
                if (totalSignsEl) {
                    totalSignsEl.textContent = status.signs.total;
                }
                
                console.log('[AMG] YOLOv11 Model Ready:', status.signs.available);
                showNotification('YOLOv11 Model Ready', 'success');
            } else {
                const statusEl = document.getElementById('yoloStatus');
                if (statusEl) {
                    statusEl.innerHTML = 'Model not loaded - Check TRAINING_GUIDE.txt';
                    statusEl.style.color = '#ff3b30';
                }
                
                console.warn('[AMG] YOLOv11 Model not loaded');
                showNotification('YOLOv11 Model not loaded', 'warning');
            }
        } catch (error) {
            console.error('[AMG] Status check failed:', error);
            const statusEl = document.getElementById('yoloStatus');
            if (statusEl) {
                statusEl.textContent = 'Connection error';
            }
            showNotification('Connection error - Check server', 'error');
        }
    }
    
    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            
            const placeholder = document.getElementById('cameraPlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            this.ensureInterfaceVisible();
            
            await this.videoElement.play();
            this.updateStatus('Camera initialized - Ready for detection', 'success');
            
            conversionStartTime = Date.now();
            playSound('start');
            showNotification('Camera started successfully', 'success');
            console.log('[AMG] Camera started');
        } catch (error) {
            console.error('[AMG] Camera error:', error);
            this.updateStatus('Camera failed: ' + error.message, 'error');
            showNotification('Camera Error: ' + error.message, 'error');
            
            const errorMsg = `Camera Error: ${error.message}\n\nTroubleshooting:\nâ€¢ Check camera permissions\nâ€¢ Ensure camera is not in use\nâ€¢ Use HTTPS or localhost\nâ€¢ Try refreshing the page`;
            alert(errorMsg);
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.videoElement.style.display = 'none';
        
        const placeholder = document.getElementById('cameraPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        this.ensureInterfaceVisible();
        
        this.stopProcessing();
        this.updateStatus('Camera stopped', 'info');
        playSound('stop');
        showNotification('Camera stopped', 'info');
        console.log('[AMG] Camera stopped');
    }
    
    startProcessing() {
        if (!this.stream) {
            this.updateStatus('Camera not initialized', 'error');
            showNotification('Please start camera first', 'warning');
            return;
        }
        
        if (!this.stats.model_loaded) {
            showNotification('YOLOv11 Model not loaded - Check TRAINING_GUIDE.txt', 'error');
            alert('[!] YOLOv11 Model not loaded!\n\nPlease:\n1. Place "best.pt" in app folder\n2. Or read TRAINING_GUIDE.txt\n3. Restart the app');
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus('YOLOv11 detection active...', 'success');
        showNotification('Detection started', 'success');
        
        // Process every 500ms (2 FPS for accuracy)
        this.processingInterval = setInterval(() => {
            this.captureAndPredict();
        }, 500);
        
        this.updateButtons(true);
        console.log('[AMG] Started YOLOv11 detection');
    }
    
    stopProcessing() {
        this.isProcessing = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.updateStatus('Detection paused', 'info');
        this.updateButtons(false);
        showNotification('Detection paused', 'info');
        console.log('[AMG] Paused detection');
    }
    
    async captureAndPredict() {
        if (!this.isProcessing) return;
        
        try {
            const ctx = this.canvasElement.getContext('2d');
            ctx.drawImage(this.videoElement, 0, 0, 960, 720);
            
            const imageData = this.canvasElement.toDataURL('image/jpeg', 0.8);
            
            const response = await fetch('/predict_asl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.handlePrediction(result);
            } else {
                console.error('[AMG] Prediction failed:', response.status);
            }
        } catch (error) {
            console.error('[AMG] Prediction error:', error);
            this.updateStatus('Error: ' + error.message, 'error');
        }
    }
    
    handlePrediction(result) {
        const { prediction, confidence, current_text, status, model_loaded, frame_count, total_signs } = result;
        
        this.stats.model_loaded = model_loaded;
        
        // Update frame counter with animation
        const framesEl = document.getElementById('yoloFrames');
        if (framesEl && frame_count) {
            framesEl.textContent = frame_count;
            framesEl.style.color = '#04BFAD';
            setTimeout(() => framesEl.style.color = '#C1D4D9', 200);
        }
        
        const totalSignsEl = document.getElementById('yoloTotalSigns');
        if (totalSignsEl && total_signs) {
            totalSignsEl.textContent = total_signs;
        }
        
        // Handle no detection
        if (!prediction || prediction === 'No Hand' || prediction === 'Error') {
            const currentSignEl = document.getElementById('yoloCurrentSign');
            if (currentSignEl) {
                currentSignEl.textContent = prediction || 'No Hand';
                currentSignEl.style.color = '#979DA6';
            }
            
            const confidenceEl = document.getElementById('yoloConfidence');
            if (confidenceEl) {
                confidenceEl.textContent = '-';
            }
            
            if (status) {
                this.updateStatus(status, 'info');
            }
            return;
        }
        
        // Valid detection with animation
        this.lastPrediction = prediction;
        this.stats.predictions++;
        
        const signElement = document.getElementById('yoloCurrentSign');
        if (signElement) {
            signElement.textContent = prediction;
            signElement.style.color = '#04BFAD';
            signElement.style.textShadow = '0 0 20px #04BFAD';
            setTimeout(() => signElement.style.textShadow = 'none', 500);
        }
        
        const confidenceEl = document.getElementById('yoloConfidence');
        if (confidenceEl) {
            confidenceEl.textContent = `${(confidence * 100).toFixed(1)}%`;
            confidenceEl.style.color = confidence > 0.8 ? '#04BFAD' : confidence > 0.6 ? '#ffbd2e' : '#ff6b6b';
        }
        
        const modelLoadedEl = document.getElementById('yoloModelLoaded');
        if (modelLoadedEl) {
            modelLoadedEl.innerHTML = '<i class="bx bx-check"></i>';
        }
        
        // Update detection counter with pulse
        this.stats.detections++;
        const detectionsEl = document.getElementById('yoloDetections');
        if (detectionsEl) {
            detectionsEl.textContent = this.stats.detections;
            detectionsEl.style.transform = 'scale(1.2)';
            setTimeout(() => detectionsEl.style.transform = 'scale(1)', 200);
        }
        
        // Add to text with cooldown
        const currentTime = Date.now() / 1000;
        const shouldAdd = (
            prediction !== this.lastAddedSign || 
            (currentTime - this.lastAddTime) > this.addCooldown
        );
        
        if (shouldAdd && confidence > 0.5) {
            if (prediction.length === 1) {
                this.currentText += prediction;
            } else {
                this.currentText += prediction + " ";
            }
            
            this.lastAddedSign = prediction;
            this.lastAddTime = currentTime;
            
            if (this.outputElement) {
                this.outputElement.textContent = this.currentText;
                this.outputElement.style.color = '#C1D4D9';
            }
            
            console.log(`[AMG] Detected: "${prediction}" | Confidence: ${(confidence * 100).toFixed(1)}%`);
            
            const duration = conversionStartTime ? (Date.now() - conversionStartTime) / 1000 : 0;
            saveConversionToHistory('asl-to-text', 'Camera', prediction, confidence, 'yolo', duration, {});
        }
        
        this.updateStatus(`${prediction} detected (${(confidence * 100).toFixed(1)}%)`, 'success');
    }
    
    clearText() {
        this.currentText = '';
        if (this.outputElement) {
            this.outputElement.textContent = 'Text will appear here as you sign...';
            this.outputElement.style.color = '#979DA6';
        }
        this.lastAddedSign = null;
        
        fetch('/clear_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error(err));
        
        showNotification('Text cleared', 'info');
        console.log('[AMG] Text cleared');
    }
    
    updateStatus(message, type) {
        if (!this.statusElement) return;
        
        const icon = type === 'success' ? 'bx-check-circle' : 
                     type === 'error' ? 'bx-error-circle' : 
                     type === 'warning' ? 'bx-error' : 'bx-info-circle';
        
        this.statusElement.innerHTML = `<i class='bx ${icon}'></i>${message}`;
        
        const colors = { 
            success: '#04BFAD', 
            error: '#ff3b30', 
            info: '#979DA6',
            warning: '#ffbd2e'
        };
        this.statusElement.style.color = colors[type] || colors.info;
    }
    
    updateButtons(isProcessing) {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (startBtn) {
            startBtn.disabled = isProcessing;
            startBtn.style.opacity = isProcessing ? '0.5' : '1';
            startBtn.style.cursor = isProcessing ? 'not-allowed' : 'pointer';
        }
        if (pauseBtn) {
            pauseBtn.disabled = !isProcessing;
            pauseBtn.style.opacity = !isProcessing ? '0.5' : '1';
            pauseBtn.style.cursor = !isProcessing ? 'not-allowed' : 'pointer';
        }
    }
}

// ============================================
// LIP READING CAMERA CLASS - ENHANCED
// ============================================

class LipReadingCamera {
    constructor() {
        this.videoElement = document.getElementById('lipVideoElement');
        this.canvasElement = document.getElementById('lipCanvasElement');
        this.outputElement = document.getElementById('lipTextOutput');
        this.statusElement = document.getElementById('lipCameraStatus');
        
        this.stream = null;
        this.isProcessing = false;
        this.processingInterval = null;
        this.currentText = '';
        
        this.currentPrediction = null;
        this.lastAddedWord = null;
        this.lastAddTime = 0;
        this.addCooldown = 2.0;
        
        this.stats = {
            predictions: 0,
            words_detected: 0,
            frames: 0
        };
        
        if (this.canvasElement) {
            this.canvasElement.width = 960;
            this.canvasElement.height = 720;
        }
        
        console.log('[AMG] Lip Reading Camera initialized');
        this.ensureInterfaceVisible();
    }
    
    ensureInterfaceVisible() {
        const lipInterface = document.getElementById('lipReadingInterface');
        if (lipInterface) {
            lipInterface.style.display = 'block';
            lipInterface.style.visibility = 'visible';
        }
        
        if (this.statusElement) {
            this.statusElement.style.display = 'flex';
            this.statusElement.style.visibility = 'visible';
        }
    }
    
    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            
            const placeholder = document.getElementById('lipCameraPlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            this.ensureInterfaceVisible();
            
            await this.videoElement.play();
            this.updateStatus('Camera ready for lip reading', 'success');
            
            lipConversionStartTime = Date.now();
            playSound('start');
            showNotification('Lip reading camera started', 'success');
            console.log('[AMG] Lip reading camera started');
        } catch (error) {
            console.error('[AMG] Camera error:', error);
            this.updateStatus('Camera failed: ' + error.message, 'error');
            showNotification('Camera Error: ' + error.message, 'error');
            alert('Camera Error: ' + error.message);
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.videoElement.style.display = 'none';
        
        const placeholder = document.getElementById('lipCameraPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        this.ensureInterfaceVisible();
        
        this.stopProcessing();
        this.updateStatus('Camera stopped', 'info');
        playSound('stop');
        showNotification('Camera stopped', 'info');
        console.log('[AMG] Lip camera stopped');
    }
    
    startProcessing() {
        if (!this.stream) {
            this.updateStatus('Camera not initialized', 'error');
            showNotification('Please start camera first', 'warning');
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus('Lip reading active - Speak clearly!', 'success');
        showNotification('Lip reading started', 'success');
        
        // Process every 200ms (5 FPS)
        this.processingInterval = setInterval(() => {
            this.captureAndPredict();
        }, 200);
        
        console.log('[AMG] Started lip reading');
    }
    
    stopProcessing() {
        this.isProcessing = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.updateStatus('Lip reading paused', 'info');
        showNotification('Lip reading paused', 'info');
        console.log('[AMG] Paused lip reading');
    }
    
    async captureAndPredict() {
        if (!this.isProcessing) return;
        
        try {
            this.stats.frames++;
            const frameCountEl = document.getElementById('lipFrameCount');
            if (frameCountEl) {
                frameCountEl.textContent = this.stats.frames;
            }
            
            const ctx = this.canvasElement.getContext('2d');
            ctx.drawImage(this.videoElement, 0, 0, 960, 720);
            
            const imageData = this.canvasElement.toDataURL('image/jpeg', 0.8);
            
            const response = await fetch('/predict_lip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.handlePrediction(result);
            } else {
                console.error('[AMG] Prediction failed:', response.status);
            }
        } catch (error) {
            console.error('[AMG] Prediction error:', error);
            this.updateStatus('Error: ' + error.message, 'error');
        }
    }
    
    handlePrediction(result) {
        const { prediction, confidence, current_text, status, features } = result;
        
        this.stats.predictions++;
        const predCountEl = document.getElementById('lipPredCount');
        if (predCountEl) {
            predCountEl.textContent = this.stats.predictions;
        }
        
        // Handle no detection
        if (!prediction || prediction === 'No Face' || prediction === 'Analyzing...') {
            const currentWordEl = document.getElementById('lipCurrentWord');
            if (currentWordEl) {
                currentWordEl.textContent = prediction || 'No Face';
                currentWordEl.style.color = '#979DA6';
            }
            
            const confidenceEl = document.getElementById('lipConfidence');
            if (confidenceEl) {
                confidenceEl.textContent = '-';
            }
            
            if (status) {
                this.updateStatus(status, 'info');
            }
            return;
        }
        
        // Valid detection with animation
        this.currentPrediction = { word: prediction, confidence: confidence || 0 };
        
        const currentWordEl = document.getElementById('lipCurrentWord');
        if (currentWordEl) {
            currentWordEl.textContent = prediction;
            currentWordEl.style.color = '#04BFAD';
            currentWordEl.style.textShadow = '0 0 20px #04BFAD';
            setTimeout(() => currentWordEl.style.textShadow = 'none', 500);
        }
        
        const confidenceEl = document.getElementById('lipConfidence');
        if (confidenceEl) {
            confidenceEl.textContent = `${(confidence * 100).toFixed(1)}%`;
            confidenceEl.style.color = confidence > 0.7 ? '#04BFAD' : confidence > 0.5 ? '#ffbd2e' : '#ff6b6b';
        }
        
        // Update stats
        if (current_text && current_text !== this.currentText) {
            this.currentText = current_text;
            this.stats.words_detected++;
            
            const wordsCountEl = document.getElementById('lipWordsCount');
            if (wordsCountEl) {
                wordsCountEl.textContent = this.stats.words_detected;
                wordsCountEl.style.transform = 'scale(1.2)';
                setTimeout(() => wordsCountEl.style.transform = 'scale(1)', 200);
            }
            
            // Update output
            if (this.outputElement) {
                this.outputElement.textContent = current_text;
                this.outputElement.style.color = '#C1D4D9';
            }
            
            // Save to history
            const duration = lipConversionStartTime ? (Date.now() - lipConversionStartTime) / 1000 : 0;
            saveConversionToHistory('lip-reading', 'Lips', prediction, confidence, 'mediapipe', duration, {});
            
            console.log(`[AMG] Lip detected: "${prediction}" | Confidence: ${(confidence * 100).toFixed(1)}%`);
        }
        
        // Update status
        if (features) {
            this.updateStatus(
                `${prediction} (${(confidence * 100).toFixed(1)}%) | Mouth: ${features.openness.toFixed(2)}`, 
                'success'
            );
        } else {
            this.updateStatus(`${prediction} (${(confidence * 100).toFixed(1)}%)`, 'success');
        }
    }
    
    clearOutput() {
        this.currentText = '';
        if (this.outputElement) {
            this.outputElement.textContent = 'Lip reading output will appear here...';
            this.outputElement.style.color = '#979DA6';
        }
        
        fetch('/clear_lip_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error(err));
        
        showNotification('Output cleared', 'info');
        console.log('[AMG] Lip output cleared');
    }
    
    updateStatus(message, type) {
        if (!this.statusElement) return;
        
        const icon = type === 'success' ? 'bx-check-circle' : 
                     type === 'error' ? 'bx-error-circle' : 
                     type === 'warning' ? 'bx-error' : 'bx-info-circle';
        
        this.statusElement.innerHTML = `<i class='bx ${icon}'></i>${message}`;
        
        const colors = { 
            success: '#04BFAD', 
            error: '#ff3b30', 
            info: '#979DA6',
            warning: '#ffbd2e'
        };
        this.statusElement.style.color = colors[type] || colors.info;
    }
}

// ============================================
// GLOBAL INSTANCES
// ============================================

let aslCamera = null;
let lipCamera = null;

// ASL Functions
function startCamera() {
    if (!aslCamera) {
        aslCamera = new ASLCamera();
    }
    aslCamera.startCamera();
}

function stopCamera() {
    if (aslCamera) {
        aslCamera.stopCamera();
    }
}

function startProcessing() {
    if (aslCamera) {
        aslCamera.startProcessing();
    }
}

function stopProcessing() {
    if (aslCamera) {
        aslCamera.stopProcessing();
    }
}

function clearTextOutput() {
    if (aslCamera) {
        aslCamera.clearText();
    }
}

// Lip Reading Functions
function startLipCamera() {
    if (!lipCamera) {
        lipCamera = new LipReadingCamera();
    }
    lipCamera.startCamera();
}

function stopLipCamera() {
    if (lipCamera) {
        lipCamera.stopCamera();
    }
}

function startLipProcessing() {
    if (lipCamera) {
        lipCamera.startProcessing();
    }
}

function stopLipProcessing() {
    if (lipCamera) {
        lipCamera.stopProcessing();
    }
}

function clearLipOutput() {
    if (lipCamera) {
        lipCamera.clearOutput();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('[AMG] Mercedes-AMG F1 Camera System Loaded');
    
    // Check if we're on ASL page
    if (document.getElementById('videoElement')) {
        aslCamera = new ASLCamera();
        setTimeout(() => {
            if (aslCamera) aslCamera.ensureInterfaceVisible();
        }, 100);
    }
    
    // Check if we're on Lip Reading page
    if (document.getElementById('lipVideoElement')) {
        lipCamera = new LipReadingCamera();
        setTimeout(() => {
            if (lipCamera) lipCamera.ensureInterfaceVisible();
        }, 100);
    }
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
});

console.log('[AMG] Mercedes-AMG F1 Camera.js - Performance Edition Loaded');