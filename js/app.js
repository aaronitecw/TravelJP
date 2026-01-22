import { CATEGORIES, PHRASES } from './data.js';

class App {
    constructor() {
        this.currentView = 'home'; // home, lesson, saved, translator
        this.activeCategory = null;
        this.savedPhrases = this.loadSavedPhrases();

        // Translator State
        this.sourceLang = 'en-GB'; // or 'ja-JP'
        this.targetLang = 'ja-JP';
        this.recognition = null;
        this.isRecording = false;

        this.dom = {
            content: document.getElementById('app-content'),
            navHome: document.getElementById('nav-home'),
            navSaved: document.getElementById('nav-saved'),
            navTranslator: document.getElementById('nav-translator'),
            btnInstall: document.getElementById('btn-install')
        };

        this.deferredPrompt = null;
        this.init();
        this.setupSpeechRecognition();
        this.setupInstallPrompt();
    }

    init() {
        this.render();
        lucide.createIcons();
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.deferredPrompt = e;
            // Update UI to notify the user they can add to home screen
            if (this.dom.btnInstall) {
                this.dom.btnInstall.classList.remove('hidden');
            }
        });
    }

    async installPWA() {
        if (!this.deferredPrompt) return;

        // Show the prompt
        this.deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, so clear it
        this.deferredPrompt = null;

        // Hide the button
        if (this.dom.btnInstall) {
            this.dom.btnInstall.classList.add('hidden');
        }
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateMicUI();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateMicUI();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const inputArea = document.getElementById('t-input');
                if (inputArea) {
                    inputArea.value = transcript;
                }
            };

            this.recognition.onerror = (event) => {
                console.error("Speech Recognition Error", event.error);
                const outputArea = document.getElementById('t-output');

                if (event.error === 'not-allowed') {
                    if (outputArea) {
                        outputArea.textContent = "Error: Microphone blocked.\nPlease allow permissions or run via 'npm run dev' (local server).";
                        outputArea.style.color = '#ff3333';
                    }
                } else if (event.error === 'no-speech') {
                    // Ignore
                } else {
                    if (outputArea) {
                        outputArea.textContent = "Error: " + event.error;
                        outputArea.style.color = '#ff3333';
                    }
                }
                this.isRecording = false;
                this.updateMicUI();
            };
        }
    }

    toggleRecording() {
        if (!this.recognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.lang = this.sourceLang;
            this.recognition.start();
        }
    }

    updateMicUI() {
        const btn = document.getElementById('btn-mic');
        if (!btn) return;

        if (this.isRecording) {
            btn.classList.add('recording');
        } else {
            btn.classList.remove('recording');
        }
    }

    swapLanguages() {
        const temp = this.sourceLang;
        this.sourceLang = this.targetLang;
        this.targetLang = temp;

        // Update UI Text if visible
        const sourceLabel = document.getElementById('lbl-source');
        const targetLabel = document.getElementById('lbl-target');
        if (sourceLabel && targetLabel) {
            sourceLabel.textContent = this.getLangName(this.sourceLang);
            targetLabel.textContent = this.getLangName(this.targetLang);
        }

        // Clear input/output
        document.getElementById('t-input').value = '';
        document.getElementById('t-output').textContent = 'Translation will appear here...';
    }

    getLangName(code) {
        return code.startsWith('en') ? 'English' : 'Japanese';
    }

    async translateText() {
        const input = document.getElementById('t-input').value;
        if (!input.trim()) return;

        const outputArea = document.getElementById('t-output');
        outputArea.textContent = 'Translating...';
        outputArea.style.opacity = '0.7';

        try {
            // MyMemory API expects ISO codes (en, ja) not full locale (en-GB, ja-JP) often
            const sourceInfo = this.sourceLang.split('-')[0];
            const targetInfo = this.targetLang.split('-')[0];

            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${sourceInfo}|${targetInfo}`);
            const data = await response.json();

            if (data && data.responseData) {
                outputArea.textContent = data.responseData.translatedText;
                outputArea.style.opacity = '1';
                outputArea.style.color = 'var(--accent-cyan)';
            } else {
                outputArea.textContent = 'Error translating.';
            }
        } catch (e) {
            console.error(e);
            outputArea.textContent = 'Connection error.';
        }
    }

    loadSavedPhrases() {
        const saved = localStorage.getItem('cyberTokyoSaved');
        return saved ? JSON.parse(saved) : [];
    }

    savePhrases() {
        localStorage.setItem('cyberTokyoSaved', JSON.stringify(this.savedPhrases));
        // Re-render if in saved view or lesson view to update star status
        if (this.currentView === 'saved' || this.currentView === 'lesson') {
            // We only re-render if it affects the current view's list
            // However, fully re-rendering might lose scroll position etc.
            // For now, let's just re-render to change star icon state
            this.render();
        }
    }

    toggleSave(phraseId) {
        const categoryId = this.findCategoryByPhraseId(phraseId);
        if (!categoryId) return; // Should not happen

        const phrase = PHRASES[categoryId].find(p => p.id === phraseId);
        if (!phrase) return;

        const isSaved = this.savedPhrases.some(p => p.id === phraseId);

        if (isSaved) {
            this.savedPhrases = this.savedPhrases.filter(p => p.id !== phraseId);
        } else {
            this.savedPhrases.push(phrase);
        }

        this.savePhrases();
    }

    findCategoryByPhraseId(phraseId) {
        for (const [catId, phrases] of Object.entries(PHRASES)) {
            if (phrases.some(p => p.id === phraseId)) {
                return catId;
            }
        }
        return null;
    }

    playAudio(text, lang = 'ja-JP') {
        if (!('speechSynthesis' in window)) {
            alert("Text-to-Speech not supported in this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        // Ensure voices are loaded
        let voices = window.speechSynthesis.getVoices();

        const speak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;

            voices = window.speechSynthesis.getVoices(); // Get latest
            let voice = null;

            const isFemale = (v) => {
                const name = v.name.toLowerCase();
                return name.includes('female') ||
                    name.includes('google') ||
                    name.includes('samantha') ||
                    name.includes('kyoko') ||
                    name.includes('zira') ||
                    name.includes('siri') ||
                    name.includes('yuri');
            };

            const isMale = (v) => {
                const name = v.name.toLowerCase();
                return name.includes('male') ||
                    name.includes('david') ||
                    name.includes('mark') ||
                    name.includes('daniel') ||
                    name.includes('fred') ||
                    name.includes('otoya');
            }

            if (lang === 'ja-JP') {
                // Priority for Japanese
                voice = voices.find(v => v.lang === 'ja-JP' && isFemale(v));
                // Fallback: any JA voice that isn't explicitly male
                if (!voice) voice = voices.find(v => v.lang === 'ja-JP' && !isMale(v));

                // If we STILL don't have a voice (only male options?), pick one but pitch shift high
                if (!voice) {
                    voice = voices.find(v => v.lang === 'ja-JP');
                    if (voice) utterance.pitch = 1.4; // Force feminine pitch
                }
            } else {
                // Priority for English
                voice = voices.find(v => v.lang.startsWith('en') && isFemale(v));
                if (!voice) voice = voices.find(v => v.lang.startsWith('en') && !isMale(v));

                if (!voice) {
                    voice = voices.find(v => v.lang.startsWith('en'));
                    if (voice) utterance.pitch = 1.3; // Force feminine pitch
                }
            }

            if (voice) {
                utterance.voice = voice;
                // Add slight pitch to generic voices
                if (!isFemale(voice) && utterance.pitch === 1) utterance.pitch = 1.1;
            }

            window.speechSynthesis.speak(utterance);
        };

        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null; // Clean up
                speak();
            };
        } else {
            speak();
        }
    }

    // Helper for translator output audio
    playTranslation() {
        const text = document.getElementById('t-output').textContent;
        if (text && text !== 'Translating...' && text !== 'Translation will appear here...') {
            this.playAudio(text, this.targetLang);
        }
    }

    navigateTo(view, categoryId = null) {
        this.currentView = view;
        if (categoryId) {
            this.activeCategory = categoryId;
        }

        // Reset Nav UI (safely check if element exists, translator nav might not be in DOM yet if index.html update pending)
        if (this.dom.navHome) {
            this.dom.navHome.classList.remove('active');
            this.dom.navHome.style.color = 'var(--text-secondary)';
        }
        if (this.dom.navSaved) {
            this.dom.navSaved.classList.remove('active');
            this.dom.navSaved.style.color = 'var(--text-secondary)';
        }
        if (this.dom.navTranslator) {
            this.dom.navTranslator.classList.remove('active');
            this.dom.navTranslator.style.color = 'var(--text-secondary)';
        }

        // Set Active
        if (view === 'saved' && this.dom.navSaved) {
            this.dom.navSaved.classList.add('active');
            this.dom.navSaved.style.color = 'var(--accent-cyan)';
        } else if (view === 'translator' && this.dom.navTranslator) {
            this.dom.navTranslator.classList.add('active');
            this.dom.navTranslator.style.color = 'var(--accent-cyan)';
        } else if (this.dom.navHome) { // home or lesson
            this.dom.navHome.classList.add('active');
            this.dom.navHome.style.color = 'var(--accent-cyan)';
        }

        this.render();
    }

    render() {
        // Clear content
        if (!this.dom.content) return;
        this.dom.content.innerHTML = '';

        switch (this.currentView) {
            case 'home':
                this.renderHome();
                break;
            case 'lesson':
                this.renderLesson();
                break;
            case 'saved':
                this.renderSaved();
                break;
            case 'translator':
                this.renderTranslator();
                break;
        }

        // Re-initialize icons after DOM change
        if (window.lucide) lucide.createIcons();
    }

    renderHome() {
        const container = document.createElement('div');
        container.className = 'view-container animate-fade-in';
        container.innerHTML = `<h2 class="section-title">Select a Situation</h2>`;

        const list = document.createElement('div');
        list.className = 'category-list';

        CATEGORIES.forEach(category => {
            const card = document.createElement('div');
            card.className = 'card category-card';
            card.onclick = () => this.navigateTo('lesson', category.id);

            card.innerHTML = `
                <div class="category-icon" style="color: ${category.color}">
                    <i data-lucide="${category.icon}" width="24" height="24"></i>
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${PHRASES[category.id].length} Phrases</p>
                </div>
            `;
            list.appendChild(card);
        });

        container.appendChild(list);
        this.dom.content.appendChild(container);
    }

    renderLesson() {
        const category = CATEGORIES.find(c => c.id === this.activeCategory);
        const phrases = PHRASES[this.activeCategory] || [];

        const container = document.createElement('div');
        container.className = 'view-container animate-slide-in';

        // Back Button
        const header = document.createElement('div');
        header.innerHTML = `
            <button class="back-btn" onclick="window.app.navigateTo('home')">
                <i data-lucide="arrow-left" width="18"></i> Back
            </button>
            <div class="lesson-header">
                <div style="color: ${category.color}; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 50%; display: flex;">
                    <i data-lucide="${category.icon}" width="24"></i>
                </div>
                <h2 class="lesson-title">${category.name}</h2>
            </div>
        `;
        container.appendChild(header);

        // Phrases
        const list = document.createElement('div');
        list.className = 'phrase-list';

        phrases.forEach(phrase => {
            list.appendChild(this.createPhraseCard(phrase));
        });

        container.appendChild(list);
        this.dom.content.appendChild(container);
    }

    renderSaved() {
        const container = document.createElement('div');
        container.className = 'view-container animate-fade-in';

        container.innerHTML = `
            <h2 class="section-title" style="display: flex; align-items: center; gap: 10px">
                <i data-lucide="sparkles" width="20" color="#ffd700"></i>
                Saved Phrases
            </h2>
        `;

        if (this.savedPhrases.length === 0) {
            container.innerHTML += `
                <div class="empty-state">
                    <p>No saved phrases yet.</p>
                    <p style="font-size: 0.8rem">Star phrases in lessons to see them here!</p>
                </div>
            `;
        } else {
            const list = document.createElement('div');
            list.className = 'phrase-list';
            this.savedPhrases.forEach(phrase => {
                list.appendChild(this.createPhraseCard(phrase));
            });
            container.appendChild(list);
        }

        this.dom.content.appendChild(container);
    }

    renderTranslator() {
        const container = document.createElement('div');
        container.className = 'view-container animate-fade-in';

        container.innerHTML = `
            <h2 class="section-title">Translator</h2>
            
            <div class="translator-controls">
                <span id="lbl-source" class="lang-select">${this.getLangName(this.sourceLang)}</span>
                <button class="swap-btn" onclick="window.app.swapLanguages()">
                    <i data-lucide="arrow-left-right" width="18"></i>
                </button>
                <span id="lbl-target" class="lang-select">${this.getLangName(this.targetLang)}</span>
            </div>

            <div class="translate-area">
                <div class="input-group">
                    <div class="input-header">
                        <span>Input</span>
                        <div class="action-bar" style="margin:0">
                            <button id="btn-mic" class="btn-mic" onclick="window.app.toggleRecording()">
                                <i data-lucide="mic" width="20"></i>
                            </button>
                        </div>
                    </div>
                    <textarea id="t-input" class="text-area" placeholder="Type or speak..."></textarea>
                </div>

                <div class="output-group">
                    <div class="output-header">
                        <span>Translation</span>
                        <button class="btn-mic" onclick="window.app.playTranslation()" style="width:30px; height:30px;">
                            <i data-lucide="volume-2" width="16"></i>
                        </button>
                    </div>
                    <div id="t-output" class="text-area" style="color: var(--text-secondary)">
                        Translation will appear here...
                    </div>
                </div>

                <button class="btn-translate" onclick="window.app.translateText()">
                    <i data-lucide="languages" width="18"></i>
                    Translate
                </button>
            </div>
        `;

        this.dom.content.appendChild(container);
    }

    createPhraseCard(phrase) {
        const isSaved = this.savedPhrases.some(p => p.id === phrase.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="phrase-accent-line"></div>
            <div class="phrase-content">
                <h3 class="phrase-en">${phrase.en}</h3>
                <p class="phrase-ja">${phrase.ja}</p>
                <p class="phrase-romaji">${phrase.romaji}</p>
            </div>
            <div class="phrase-actions">
                <button class="btn-play" onclick="window.app.playAudio('${phrase.ja.replace(/'/g, "\\'")}', 'ja-JP')">
                    <i data-lucide="play" width="18"></i> Listen
                </button>
                <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="window.app.toggleSave('${phrase.id}')">
                    <i data-lucide="star" width="20" fill="${isSaved ? 'currentColor' : 'none'}"></i>
                </button>
            </div>
        `;
        return card;
    }
}

// Initialize App
window.app = new App();
