// eventBus.js - Central event management system
const eventBus = {
    events: {},
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to subscribe to
     * @param {function} callback - Function to execute when event occurs
     * @returns {function} Unsubscribe function
     */
    subscribe: function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        // Return an unsubscribe function
        return () => {
            this.events[eventName] = this.events[eventName].filter(
                eventCallback => eventCallback !== callback
            );
        };
    },
    
    /**
     * Publish an event with data
     * @param {string} eventName - Name of the event to publish
     * @param {object} data - Data to pass to subscribers
     */
    publish: function(eventName, data = {}) {
        if (!this.events[eventName]) {
            return;
        }
        
        this.events[eventName].forEach(callback => {
            callback(data);
        });
    },
    
    /**
     * Reset all event subscriptions
     */
    reset: function() {
        this.events = {};
    }
};

export default eventBus;