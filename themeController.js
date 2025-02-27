// themeController.js - Handles theme customization
import eventBus from './eventBus.js';

const themeController = {
    // Theme definitions
    themes: {
        dark: {
            '--dark-bg': '#1a1f2e',
            '--dark-bg-lighter': '#2d3345',
            '--card-bg': '#3a4060',
            '--card-border': '#4a5270',
            '--text-light': '#e0e6ed',
            '--text-muted': '#b0b7c3'
        },
        light: {
            '--dark-bg': '#f0f2f5',
            '--dark-bg-lighter': '#e2e5eb',
            '--card-bg': '#ffffff',
            '--card-border': '#d0d5dd',
            '--text-light': '#2a2f45',
            '--text-muted': '#6c757d'
        },
        'high-contrast': {
            '--dark-bg': '#000000',
            '--dark-bg-lighter': '#121212',
            '--card-bg': '#1a1a1a',
            '--card-border': '#ffffff',
            '--text-light': '#ffffff',
            '--text-muted': '#eeeeee'
        },
        'blue-theme': {
            '--dark-bg': '#172b4d',
            '--dark-bg-lighter': '#203a60',
            '--card-bg': '#2c4a7c',
            '--card-border': '#3b5998',
            '--text-light': '#e0e6ed',
            '--text-muted': '#b0b7c3'
        },
        'green-theme': {
            '--dark-bg': '#1e3a2d',
            '--dark-bg-lighter': '#2a4b3c',
            '--card-bg': '#375a49',
            '--card-border': '#4c7561',
            '--text-light': '#e0e6ed',
            '--text-muted': '#b0b7c3'
        }
    },
    
    // Current theme
    currentTheme: 'dark',
    
    /**
     * Initialize theme controller
     */
    init: function() {
        // Load saved theme
        this.loadSavedTheme();
        
        // Subscribe to theme change events
        eventBus.subscribe('theme:change', this.changeTheme.bind(this));
        
        // Add theme selector to UI
        this.createThemeSelector();
    },
    
    /**
     * Load saved theme from localStorage
     */
    loadSavedTheme: function() {
        try {
            const savedTheme = localStorage.getItem('preferredTheme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                // Use light theme if user prefers it
                this.currentTheme = 'light';
            }
            
            // Apply theme
            this.applyTheme(this.currentTheme);
        } catch (error) {
            console.error('Error loading theme:', error);
            // Default to dark theme
            this.applyTheme('dark');
        }
    },
    
    /**
     * Apply theme to document
     * @param {string} theme - Theme name
     */
    applyTheme: function(theme) {
        // Get theme definition
        const themeColors = this.themes[theme];
        if (!themeColors) {
            console.error(`Theme "${theme}" not found!`);
            return;
        }
        
        // Apply each CSS variable
        Object.entries(themeColors).forEach(([variable, value]) => {
            document.documentElement.style.setProperty(variable, value);
        });
        
        // Set theme class on body
        document.body.className = '';
        document.body.classList.add(`theme-${theme}`);
        
        // Save preference
        localStorage.setItem('preferredTheme', theme);
        this.currentTheme = theme;
        
        // Publish theme applied event
        eventBus.publish('theme:applied', { theme });
    },
    
    /**
     * Change theme
     * @param {object} data - Theme data from event bus
     */
    changeTheme: function(data) {
        this.applyTheme(data.theme);
    },
    
    /**
     * Create theme selector in UI
     */
    createThemeSelector: function() {
        // Check if container exists
        let container = document.getElementById('theme-selector');
        
        // Create container if it doesn't exist
        if (!container) {
            container = document.createElement('div');
            container.id = 'theme-selector';
            container.style.position = 'absolute';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.zIndex = '100';
            container.style.backgroundColor = 'var(--card-bg)';
            container.style.padding = '5px 10px';
            container.style.borderRadius = '5px';
            container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            
            document.body.appendChild(container);
        }
        
        // Add theme selector dropdown
        const select = document.createElement('select');
        select.id = 'theme-select';
        select.style.backgroundColor = 'var(--dark-bg-lighter)';
        select.style.color = 'var(--text-light)';
        select.style.border = '1px solid var(--card-border)';
        select.style.borderRadius = '4px';
        select.style.padding = '5px';
        select.style.cursor = 'pointer';
        
        // Add options
        Object.keys(this.themes).forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            if (theme === this.currentTheme) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // Add change handler
        select.addEventListener('change', () => {
            this.applyTheme(select.value);
        });
        
        // Add label
        const label = document.createElement('label');
        label.htmlFor = 'theme-select';
        label.textContent = 'Theme: ';
        label.style.color = 'var(--text-light)';
        label.style.marginRight = '5px';
        label.style.fontSize = '0.9rem';
        
        // Add to container
        container.innerHTML = '';
        container.appendChild(label);
        container.appendChild(select);
    }
};

export default themeController;