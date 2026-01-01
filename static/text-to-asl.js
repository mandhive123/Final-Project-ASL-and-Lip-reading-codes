// ============================================
// TEXT-TO-ASL CONVERTER - FIXED VERSION
// ============================================

class TextToASL {
    constructor() {
        this.isAnimating = false;
        this.animationQueue = [];
        this.currentAnimationIndex = 0;
        this.conversionStartTime = null;

        console.log('[TextToASL] Initializing...');

        // Word-to-GIF mapping
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
            'want': '/static/animations/want.gif',
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
            'go': '/static/animations/go.gif',
            'me': '/static/animations/me.gif',
            'you': '/static/animations/you.gif',
            'work': '/static/animations/work.gif',
            'name': '/static/animations/name.gif',
            'meet': '/static/animations/meet.gif',
            'nice': '/static/animations/nice.gif',
            'how are you': '/static/animations/how-are-you.gif',
            'i love you': '/static/animations/i-love-you.gif',
            'good morning': '/static/animations/good-morning.gif',
            'nice to meet you': '/static/animations/nice-to-meet-you.gif',
            'good night': '/static/animations/goodnight.gif',
            'good afternoon': '/static/animations/afternoon.gif'
        };

        // Multi-word phrases (check longest first)
        this.multiWordPhrases = [
            'nice to meet you',
            'how are you',
            'thank you',
            'i love you',
            'good morning',
            'good night',
            'good afternoon'
        ];

        // Initialize after a short delay to ensure DOM is ready
        setTimeout(() => this.init(), 500);
    }

    init() {
        console.log('[TextToASL] Setting up event listeners...');
        
        // Find all convert buttons (handle both class and direct onclick)
        const convertBtns = document.querySelectorAll('#text-to-asl-screen .amg-button, #text-to-asl-screen .convert-btn');
        convertBtns.forEach(btn => {
            // Remove old listeners
            btn.replaceWith(btn.cloneNode(true));
        });

        // Re-attach listeners
        const freshBtns = document.querySelectorAll('#text-to-asl-screen .amg-button, #text-to-asl-screen .convert-btn');
        freshBtns.forEach(btn => {
            if (btn.textContent.includes('Convert')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.convertText();
                });
                console.log('[TextToASL] Convert button attached');
            }
        });

        // Find replay and clear buttons
        const replayBtn = document.querySelector('#text-to-asl-screen .icon-btn[onclick*="refresh"]');
        const clearBtn = document.querySelector('#text-to-asl-screen .icon-btn[onclick*="trash"]');

        if (replayBtn) {
            replayBtn.onclick = () => this.replayAnimation();
            console.log('[TextToASL] Replay button attached');
        }

        if (clearBtn) {
            clearBtn.onclick = () => this.clearAll();
            console.log('[TextToASL] Clear button attached');
        }

        console.log('[TextToASL] Initialization complete');
    }

    async convertText() {
        const textInput = document.querySelector('#text-to-asl-screen #textInput');
        
        if (!textInput) {
            console.error('[TextToASL] Text input not found');
            this.showNotification('Error: Text input not found', 'error');
            return;
        }

        const text = textInput.value.trim();

        if (!text) {
            this.showNotification('Please enter text to convert!', 'warning');
            return;
        }

        console.log('[TextToASL] Converting:', text);
        this.conversionStartTime = Date.now();

        try {
            // Call backend API
            const response = await fetch('/convert_text_to_asl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.animationQueue = result.words;
                console.log('[TextToASL] Queue:', this.animationQueue);

                if (this.animationQueue.length === 0) {
                    this.showNotification('No words to convert!', 'warning');
                    return;
                }

                // Start animation
                this.currentAnimationIndex = 0;
                this.playAnimationSequence(result.animations);
                
                this.showNotification(`Converting ${this.animationQueue.length} words...`, 'success');
            } else {
                this.showNotification('Conversion failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('[TextToASL] Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    playAnimationSequence(animations) {
        if (!animations || animations.length === 0) {
            this.showNotification('No animations available', 'warning');
            return;
        }

        this.isAnimating = true;
        this.currentAnimations = animations;
        this.playNextAnimation();
    }

    playNextAnimation() {
        if (this.currentAnimationIndex >= this.animationQueue.length) {
            this.isAnimating = false;
            const duration = (Date.now() - this.conversionStartTime) / 1000;
            
            // Save to history
            if (window.historyModule) {
                const textInput = document.querySelector('#text-to-asl-screen #textInput');
                window.historyModule.saveToHistory(
                    'text-to-asl',
                    textInput.value.trim(),
                    this.animationQueue.join(' '),
                    1.0,
                    'Text-to-ASL Converter',
                    duration,
                    { word_count: this.animationQueue.length }
                );
            }
            
            this.showNotification('Animation complete!', 'success');
            return;
        }

        const word = this.animationQueue[this.currentAnimationIndex];
        const gifPath = this.currentAnimations[this.currentAnimationIndex];
        
        console.log(`[TextToASL] Playing ${this.currentAnimationIndex + 1}/${this.animationQueue.length}: ${word}`);

        this.displayAnimation(word, gifPath);

        this.currentAnimationIndex++;

        // Next animation after 3 seconds
        setTimeout(() => this.playNextAnimation(), 3000);
    }

    displayAnimation(word, gifPath) {
        const animationArea = document.querySelector('#text-to-asl-screen .animation-area');

        if (!animationArea) {
            console.error('[TextToASL] Animation area not found');
            return;
        }

        animationArea.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            animation: fadeIn 0.3s ease;
        `;

        // Word label
        const label = document.createElement('div');
        label.textContent = word.toUpperCase();
        label.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            color: #04BFAD;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(4, 191, 173, 0.5);
            letter-spacing: 2px;
        `;

        if (gifPath) {
            // GIF animation
            const gifImage = document.createElement('img');
            gifImage.src = gifPath;
            gifImage.alt = `ASL sign for ${word}`;
            gifImage.style.cssText = `
                max-width: 90%;
                max-height: 300px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(4, 191, 173, 0.3);
            `;

            gifImage.onerror = () => {
                console.error(`[TextToASL] Failed to load: ${gifPath}`);
                this.showTextFallback(wrapper, word);
            };

            wrapper.appendChild(label);
            wrapper.appendChild(gifImage);
        } else {
            // Text fallback
            this.showTextFallback(wrapper, word);
        }

        // Progress indicator
        const progress = document.createElement('div');
        progress.textContent = `${this.currentAnimationIndex + 1} / ${this.animationQueue.length}`;
        progress.style.cssText = `
            margin-top: 16px;
            font-size: 16px;
            color: #979DA6;
            font-weight: 600;
        `;

        wrapper.appendChild(progress);
        animationArea.appendChild(wrapper);
    }

    showTextFallback(container, word) {
        const textBox = document.createElement('div');
        textBox.style.cssText = `
            background: linear-gradient(135deg, #04BFAD, #02a89a);
            color: white;
            padding: 40px 60px;
            border-radius: 16px;
            font-size: 36px;
            font-weight: bold;
            box-shadow: 0 8px 32px rgba(4, 191, 173, 0.4);
            margin: 20px 0;
        `;
        textBox.textContent = word.toUpperCase();

        const note = document.createElement('p');
        note.textContent = 'Animation not available';
        note.style.cssText = `
            margin-top: 12px;
            font-size: 14px;
            color: #979DA6;
        `;

        container.appendChild(textBox);
        container.appendChild(note);
    }

    replayAnimation() {
        if (!this.currentAnimations || this.currentAnimations.length === 0) {
            this.showNotification('Nothing to replay!', 'warning');
            return;
        }

        console.log('[TextToASL] Replaying animation');
        this.currentAnimationIndex = 0;
        this.isAnimating = false;
        this.playAnimationSequence(this.currentAnimations);
    }

    clearAll() {
        console.log('[TextToASL] Clearing all');
        
        const textInput = document.querySelector('#text-to-asl-screen #textInput');
        if (textInput) {
            textInput.value = '';
        }
        
        this.resetAnimationArea();
        this.animationQueue = [];
        this.currentAnimations = [];
        this.currentAnimationIndex = 0;
        this.isAnimating = false;
        
        this.showNotification('Cleared!', 'info');
    }

    resetAnimationArea() {
        const animationArea = document.querySelector('#text-to-asl-screen .animation-area');
        if (animationArea) {
            animationArea.innerHTML = `
                <i class='bx bx-user' style='font-size: 64px; color: #04BFAD; opacity: 0.3;'></i>
                <p style='color: #979DA6; margin-top: 16px;'>ASL animation will appear here</p>
            `;
        }
    }

    showNotification(message, type = 'info') {
        console.log(`[TextToASL] ${type.toUpperCase()}: ${message}`);

        const notification = document.createElement('div');
        notification.className = `text-to-asl-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#04BFAD' : type === 'error' ? '#ff3b30' : type === 'warning' ? '#ffbd2e' : '#979DA6'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[TextToASL] DOM loaded, initializing...');
        setTimeout(() => {
            window.textToASL = new TextToASL();
        }, 1000);
    });
} else {
    console.log('[TextToASL] DOM already loaded, initializing...');
    setTimeout(() => {
        window.textToASL = new TextToASL();
    }, 1000);
}

// Re-initialize when switching to text-to-asl screen
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-screen="text-to-asl"]')) {
        setTimeout(() => {
            if (window.textToASL) {
                window.textToASL.init();
            }
        }, 500);
    }
});

console.log('[TextToASL] Module loaded');