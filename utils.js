// utils.js - Common utility functions

/**
 * Sanitize a string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
    if (!str) return '';
    
    // Create a temporary DOM element
    const temp = document.createElement('div');
    // Set its content to the string
    temp.textContent = str;
    // Return the sanitized content
    return temp.innerHTML;
}

/**
 * Format a timestamp nicely
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Safely parse JSON
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed object or fallback
 */
export function safeJsonParse(jsonString, fallback = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('JSON parse error:', e);
        return fallback;
    }
}

/**
 * Debounce a function to limit how often it can be called
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

/**
 * Create a throttled function that only invokes func at most once per wait period
 * @param {function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, wait = 100) {
    let timeout = null;
    let lastCall = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - lastCall);
        
        if (remaining <= 0) {
            lastCall = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastCall = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    // Handle Object
    if (obj instanceof Object) {
        const copy = {};
        Object.keys(obj).forEach(key => {
            copy[key] = deepClone(obj[key]);
        });
        return copy;
    }
    
    throw new Error(`Unable to copy obj! Its type isn't supported.`);
}

/**
 * Display an error modal
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
export function showErrorModal(title, message) {
    // Create modal wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'popup-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.background = 'rgba(0, 0, 0, 0.7)';
    wrapper.style.zIndex = '10000';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'popup error-modal';
    modal.style.backgroundColor = '#2d3345';
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
    modal.style.color = '#e0e6ed';
    modal.style.maxWidth = '90%';
    modal.style.width = '400px';
    
    // Set modal content
    modal.innerHTML = `
        <h3 style="color:#dc3545;margin-top:0;">${sanitizeString(title)}</h3>
        <p>${sanitizeString(message)}</p>
        <button id="error-modal-close" style="background:#dc3545;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;float:right;margin-top:10px;">Close</button>
    `;
    
    // Add to DOM
    wrapper.appendChild(modal);
    document.body.appendChild(wrapper);
    
    // Add close button handler
    document.getElementById('error-modal-close').addEventListener('click', () => {
        document.body.removeChild(wrapper);
    });
    
    // Add ESC key handler
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(wrapper);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}