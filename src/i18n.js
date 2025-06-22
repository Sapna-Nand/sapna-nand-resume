// Internationalization (i18n) System
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.translations = {};
        this.observers = [];
        this.isInitialized = false;
    }

    // Load translations for a specific language
    async loadTranslations(language) {
        try {
            const response = await fetch(`src/locales/${language}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${language} translations`);
            }
            this.translations[language] = await response.json();
            console.log(`Loaded ${language} translations:`, this.translations[language]);
        } catch (error) {
            console.error(`Error loading translations for ${language}:`, error);
            // Fallback to English if available
            if (language !== 'en' && this.translations.en) {
                console.warn(`Falling back to English translations`);
            }
        }
    }

    // Initialize the i18n system
    async init() {
        console.log('Initializing i18n system...');
        
        // Load English translations first (fallback)
        await this.loadTranslations('en');
        
        // Load current language if different from English
        if (this.currentLanguage !== 'en') {
            await this.loadTranslations(this.currentLanguage);
        }
        
        this.isInitialized = true;
        
        // Apply translations to the page
        this.applyTranslations();
        
        // Update language selector
        this.updateLanguageSelector();
        
        console.log('i18n system initialized successfully');
    }

    // Get translation for a key
    t(key, fallback = key) {
        const currentTranslations = this.translations[this.currentLanguage];
        const englishTranslations = this.translations['en'];
        
        // Try current language first
        if (currentTranslations && this.getNestedValue(currentTranslations, key)) {
            return this.getNestedValue(currentTranslations, key);
        }
        
        // Fallback to English
        if (englishTranslations && this.getNestedValue(englishTranslations, key)) {
            return this.getNestedValue(englishTranslations, key);
        }
        
        // Return fallback or key if no translation found
        console.warn(`Translation not found for key: ${key}`);
        return fallback;
    }

    // Helper to get nested object values using dot notation
    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => (o || {})[k], obj);
    }

    // Change language
    async changeLanguage(language) {
        if (language === this.currentLanguage) return;
        
        console.log(`Changing language from ${this.currentLanguage} to ${language}`);
        
        this.currentLanguage = language;
        localStorage.setItem('language', language);
        
        // Load translations if not already loaded
        if (!this.translations[language]) {
            await this.loadTranslations(language);
        }
        
        // Apply new translations
        this.applyTranslations();
        
        // Update language selector
        this.updateLanguageSelector();
        
        // Notify observers
        this.notifyObservers();
    }

    // Apply translations to all elements with data-i18n attribute
    applyTranslations() {
        if (!this.isInitialized) {
            console.warn('i18n not initialized yet');
            return;
        }
        
        console.log('Applying translations...');
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${elements.length} elements to translate`);
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Handle different types of content
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = translation;
            } else if (element.hasAttribute('data-i18n-title')) {
                element.title = translation;
            } else if (element.hasAttribute('data-i18n-alt')) {
                element.alt = translation;
            } else {
                element.innerHTML = translation;
            }
        });

        // Update document title and meta description
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && metaDescription.hasAttribute('data-i18n-content')) {
            const descKey = metaDescription.getAttribute('data-i18n-content');
            metaDescription.content = this.t(descKey);
        }
        
        // Populate skills
        this.populateSkills();
    }

    // Update language selector buttons
    updateLanguageSelector() {
        const languageButtons = document.querySelectorAll('[data-language]');
        
        languageButtons.forEach(button => {
            const language = button.getAttribute('data-language');
            if (language === this.currentLanguage) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    // Populate skills dynamically based on current language
    populateSkills() {
        const skillCategories = ['professional', 'pharmaceutical', 'management', 'technical'];
        
        skillCategories.forEach(category => {
            const container = document.getElementById(`${category}-skills`);
            if (container) {
                const skills = this.t(`skills.${category}.items`);
                if (Array.isArray(skills)) {
                    container.innerHTML = skills.map(skill => 
                        `<span class="px-3 py-1 rounded-full text-sm transition-colors border border-gray-300 text-gray-700 hover:bg-gray-100">${skill}</span>`
                    ).join('');
                }
            }
        });
    }

    // Add observer for language changes
    addObserver(callback) {
        this.observers.push(callback);
    }

    // Notify all observers of language change
    notifyObservers() {
        this.observers.forEach(callback => callback(this.currentLanguage));
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Create global i18n instance
window.i18n = new I18n();

// Language switching function for buttons
window.switchLanguage = function(language) {
    if (window.i18n) {
        window.i18n.changeLanguage(language);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing i18n...');
    if (window.i18n) {
        window.i18n.init();
    }
});

