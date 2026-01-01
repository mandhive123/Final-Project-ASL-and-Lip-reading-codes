// Voice-to-ASL with GIF/Animation Display
class VoiceToASL {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isInitialized = false;

        console.log('VoiceToASL constructor called');
        
        setTimeout(() => {
            this.initSpeechRecognition();
        }, 500);

        // Map words to GIF/animation paths
        // FIXED: Using correct Flask static path
        this.wordToGif = {
            'hello': '/static/animations/hello.gif',
            'hi': '/static/animations/hello.gif',
            'goodbye': '/static/animations/goodbye.gif',
            'bye': '/static/animations/goodbye.gif',
            'thank you': '/static/animations/thank-you.gif',
            'thanks': '/static/animations/thank-you.gif',
            'please': '/static/animations/please.gif',
            'yes': '/static/animations/yes.gif',
            'no': '/static/animations/no.gif',
            'sorry': '/static/animations/sorry.gif',
            'help': '/static/animations/help.gif',
            'love': '/static/animations/i-love-you.gif',
            'happy': '/static/animations/happy.gif',
            'sad': '/static/animations/sad.gif',
            'good': '/static/animations/good.gif',
            'bad': '/static/animations/bad.gif',
            'water': '/static/animations/water.gif',
            'food': '/static/animations/food.gif',
            'eat': '/static/animations/eat.gif',
            'drink': '/static/animations/drink.gif',
            'sleep': '/static/animations/sleep.gif',
            'home': '/static/animations/home.gif',
            'family': '/static/animations/family.gif',
            'friend': '/static/animations/friend.gif',
            'me': '/static/animations/me.gif',
            'go': '/static/animations/go.gif',
            'walk': '/static/animations/walk.gif',
            'back': '/static/animations/back.gif',
            'you': '/static/animations/you.gif',
            'to': '/static/animations/to.gif',
            'work': '/static/animations/work.gif',
            'name': '/static/animations/name.gif',
            'meet': '/static/animations/meet.gif',
            'nice': '/static/animations/nice.gif',
            'here': '/static/animations/here.gif',
            'goodbye': '/static/animations/bye.gif',
            'want': '/static/animations/want.gif',
            'how are you': '/static/animations/how-are-you.gif',
            'appluase': '/static/animations/applause.gif',
            'i love you': '/static/animations/i-love-you.gif',
            'good morning': '/static/animations/good-morning.gif',
            'nice to meet you': '/static/animations/nice-to-meet-you.gif',
            'Pardon': '/static/animations/Pardon.gif',
            'hi': '/static/animations/hi.gif',
            'good night': '/static/animations/goodnight.gif',
            'good afternoon': '/static/animations/afternoon.gif',
            'are you here': '/static/animations/here.gif',
            'excuse me': '/static/animations/excuse.gif',
            'see you again': '/static/animations/again.gif'
        };

        // Multi-word phrases (IMPORTANT: List longest phrases first!)
        this.multiWordPhrases = [
            'how are you',
            'nice to meet you',
            'thank you',
            'i love you',
            'good morning',
            'good night',
            'good afternoon',
            'good evening',
            'excuse me',
            'are you here',
            'see you again',
            'you are welcome',
            'what is your name',
            'pleased to meet you'
        ];

        // Word variations mapping
        this.wordVariations = {
            'hi': 'hello',
            'hey': 'hello',
            'greetings': 'hello',
            'bye': 'goodbye',
            'farewell': 'goodbye',
            'thanks': 'thank you',
            'thank': 'thank you',
            'thx': 'thank you',
            'plz': 'please',
            'yeah': 'yes',
            'yep': 'yes',
            'yup': 'yes',
            'nope': 'no',
            'nah': 'no',
            'want': 'wanna'
        };
    }

    initSpeechRecognition() {
        console.log('Initializing speech recognition...');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            this.showStatusMessage('Speech recognition not supported in this browser');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.isListening = true;
                this.updateMicrophoneUI(true);
                this.showStatusMessage('Listening... Speak now!');
            };

            this.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript.trim();
                        console.log('Final transcript:', transcript);
                        this.processTranscription(transcript);
                    }
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'no-speech') {
                    return; // Continue listening
                }
                
                this.isListening = false;
                this.updateMicrophoneUI(false);
                
                let errorMessage = 'Speech recognition error: ' + event.error;
                if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone access denied. Please allow microphone access.';
                }
                
                this.showStatusMessage(errorMessage);
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error('Error restarting:', error);
                        this.isListening = false;
                        this.updateMicrophoneUI(false);
                    }
                }
            };

            this.isInitialized = true;
            console.log('Speech recognition initialized');
            
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            this.showStatusMessage('Failed to initialize speech recognition');
        }
    }

    processTranscription(text) {
        console.log('Processing transcription:', text);
        
        // Update transcription display
        const transcriptionElement = document.querySelector('#voice-to-asl-screen .transcribed-text');
        if (transcriptionElement) {
            const currentText = transcriptionElement.textContent;
            if (currentText === 'Your speech will appear here...') {
                transcriptionElement.textContent = text;
            } else {
                transcriptionElement.textContent = currentText + ' ' + text;
            }
        }

        // FIXED: Check for multi-word phrases FIRST
        const lowerText = text.toLowerCase();
        let foundPhrase = false;
        
        // Check if the text contains any multi-word phrases
        for (const phrase of this.multiWordPhrases) {
            if (lowerText.includes(phrase)) {
                console.log(`Found phrase: "${phrase}"`);
                this.displayGifForWord(phrase);
                foundPhrase = true;
                break; // Stop after finding first phrase
            }
        }
        
        // If no multi-word phrase found, process individual words
        if (!foundPhrase) {
            const words = text.toLowerCase().split(/\s+/);
            this.displayAnimationsForWords(words);
        }
    }

    displayAnimationsForWords(words) {
        words.forEach((word, index) => {
            const cleanWord = word.replace(/[^\w']/g, '');
            if (cleanWord.length > 0) {
                setTimeout(() => {
                    this.displayGifForWord(cleanWord);
                }, index * 2500); // 2.5 second delay between words
            }
        });
    }

    displayGifForWord(word) {
        console.log('Displaying GIF for word:', word);
        
        // Normalize word (handle variations)
        let normalizedWord = word.toLowerCase();
        if (this.wordVariations[normalizedWord]) {
            normalizedWord = this.wordVariations[normalizedWord];
        }

        // Get GIF path
        const gifPath = this.wordToGif[normalizedWord];
        
        // Get animation area
        const animationArea = document.querySelector('#voice-to-asl-screen .animation-area');
        
        if (!animationArea) {
            console.error('Animation area not found');
            return;
        }

        if (gifPath) {
            console.log(`Found GIF for "${word}": ${gifPath}`);
            this.showGifAnimation(animationArea, gifPath, word);
        } else {
            console.log(`No GIF found for "${word}", showing text`);
            this.showTextAnimation(animationArea, word);
        }
    }

    showGifAnimation(container, gifPath, word) {
        // Clear container
        container.innerHTML = '';
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            animation: fadeIn 0.3s ease-in;
        `;

        // Create word label
        const label = document.createElement('div');
        label.textContent = word.toUpperCase();
        label.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: #04BFAD;
            margin-bottom: 16px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        `;

        // Create GIF image
        const gifImage = document.createElement('img');
        gifImage.src = gifPath;
        gifImage.alt = `ASL sign for ${word}`;
        gifImage.style.cssText = `
            max-width: 90%;
            max-height: 250px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(4, 191, 173, 0.3);
        `;

        // Handle image load error
        gifImage.onerror = () => {
            console.error(`Failed to load GIF: ${gifPath}`);
            this.showTextAnimation(container, word);
        };

        // Add elements
        wrapper.appendChild(label);
        wrapper.appendChild(gifImage);
        container.appendChild(wrapper);

        // Auto-clear after animation duration
        setTimeout(() => {
            this.resetAnimationArea();
        }, 3000);
    }

    showTextAnimation(container, word) {
        // Clear container
        container.innerHTML = '';
        
        // Create text display
        const textDisplay = document.createElement('div');
        textDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            animation: fadeIn 0.3s ease-in;
        `;

        textDisplay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #B497BD, #E6DAF5);
                color: white;
                padding: 30px 50px;
                border-radius: 20px;
                font-size: 32px;
                font-weight: bold;
                box-shadow: 0 8px 32px rgba(180, 151, 189, 0.4);
                transform: scale(1);
                animation: wordPulse 2s ease-in-out;
            ">${word.toUpperCase()}</div>
            <p style="
                margin-top: 16px;
                font-size: 14px;
                color: #8e8e93;
            ">No animation available</p>
        `;

        container.appendChild(textDisplay);

        // Auto-clear
        setTimeout(() => {
            this.resetAnimationArea();
        }, 2500);
    }

    resetAnimationArea() {
        const animationArea = document.querySelector('#voice-to-asl-screen .animation-area');
        if (animationArea) {
            animationArea.innerHTML = `
                <i class='bx bx-user'></i>
                <p>ASL animation will appear here</p>
            `;
        }
    }

    startListening() {
        console.log('StartListening called');
        
        if (!this.isInitialized) {
            this.initSpeechRecognition();
            setTimeout(() => this.startListening(), 1000);
            return;
        }

        if (!this.recognition) {
            console.error('No recognition object available');
            this.showStatusMessage('Speech recognition not available');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        try {
            console.log('Starting recognition...');
            this.recognition.start();
            this.showStatusMessage('Starting microphone...');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.isListening = false;
            this.updateMicrophoneUI(false);
            this.showStatusMessage('Error: ' + error.message);
        }
    }

    stopListening() {
        console.log('Stop listening called');
        
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                this.isListening = false;
                this.updateMicrophoneUI(false);
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
    }

    updateMicrophoneUI(isListening) {
        const micButton = document.querySelector('#voice-to-asl-screen .mic-button');
        const statusText = document.querySelector('#voice-to-asl-screen .microphone-area p');
        const waveVisualizer = document.querySelector('#voice-to-asl-screen .voice-visualizer');

        if (micButton) {
            micButton.classList.toggle('recording', isListening);
            const icon = micButton.querySelector('i');
            if (icon) {
                icon.className = isListening ? 'bx bx-stop' : 'bx bx-microphone';
            }
        }
        
        if (statusText) {
            statusText.textContent = isListening ? 'Listening... Speak clearly!' : 'Click to start recording';
        }
        
        if (waveVisualizer) {
            waveVisualizer.classList.toggle('active', isListening);
        }
    }

    showStatusMessage(message) {
        console.log('Status message:', message);
        
        let statusElement = document.querySelector('.voice-status-message');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'voice-status-message';
            statusElement.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(74, 63, 85, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 1000;
                max-width: 400px;
                text-align: center;
            `;
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.style.background = message.includes('error') || message.includes('Error') ? 
        'rgba(255, 59, 48, 0.95)' : 'rgba(4, 191, 173, 0.95)';  
        
        setTimeout(() => {
            if (statusElement && statusElement.parentNode) {
                statusElement.remove();
            }
        }, 3000);
    }

    clearOutput() {
        const transcriptionElement = document.querySelector('#voice-to-asl-screen .transcribed-text');
        if (transcriptionElement) {
            transcriptionElement.textContent = 'Your speech will appear here...';
        }
        
        this.resetAnimationArea();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing VoiceToASL...');
    
    setTimeout(() => {
        window.voiceToASL = new VoiceToASL();
        
        const setupMicButton = () => {
            const micButton = document.querySelector('#voice-to-asl-screen .mic-button');
            if (micButton) {
                console.log('Setting up mic button...');
                
                const newButton = micButton.cloneNode(true);
                micButton.parentNode.replaceChild(newButton, micButton);
                
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Mic button clicked!');
                    
                    if (window.voiceToASL) {
                        if (window.voiceToASL.isListening) {
                            window.voiceToASL.stopListening();
                        } else {
                            window.voiceToASL.startListening();
                        }
                    }
                });
                
                console.log('Mic button ready');
            } else {
                setTimeout(setupMicButton, 1000);
            }
        };
        
        setupMicButton();
    }, 1000);
});

// Global clear function
function clearVoiceOutput() {
    if (window.voiceToASL) {
        window.voiceToASL.clearOutput();
    }
}

// Add animation styles
if (!document.querySelector('#voice-asl-animations')) {
    const style = document.createElement('style');
    style.id = 'voice-asl-animations';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
}

window.VoiceToASL = VoiceToASL;