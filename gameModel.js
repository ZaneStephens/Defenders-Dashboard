// gameModel.js - Central game state management
import eventBus from './eventBus.js';
import possibleEvents from './threats.js';

const gameModel = {
    // Game state
    state: {
        isRunning: false,
        level: 1,
        score: 0,
        uptime: 100,
        rules: [],
        levelProgress: 0,
        events: [],       // Store all game events
        pendingMaliciousEvents: [], // Malicious events that need handling
        trafficData: [],  // Store traffic data for visualization
    },
    
    // Settings and configuration
    settings: {
        eventFrequencyMultiplier: 1,
        noiseEventProbability: 0.1,
        attackSophistication: "basic",
        simulationInterval: 9000, // Increased from 7000 to 9000 (9 seconds)
        falsePositiveChance: 0.1,
        escalationTimeout: 45000, // Increased from 30000 to 45000 (45 seconds)
    },
    
    // Level definitions
    levels: [
        {
            level: 1,
            name: "Level 1: Basic Scan Detection",
            description: "Detect basic reconnaissance scans.",
            eventFrequencyMultiplier: 0.5,
            noiseEventProbability: 0.1,
            attackSophistication: "basic",
            targetScore: 1000
        },
        {
            level: 2,
            name: "Level 2: Exploit Attempts",
            description: "Counter exploit attempts and malware.",
            eventFrequencyMultiplier: 0.6,
            noiseEventProbability: 0.15,
            attackSophistication: "intermediate",
            targetScore: 1500
        },
        {
            level: 3,
            name: "Level 3: Data Exfiltration",
            description: "Prevent data breaches and advanced threats.",
            eventFrequencyMultiplier: 0.7,
            noiseEventProbability: 0.2,
            attackSophistication: "advanced",
            targetScore: 2000
        }
    ],
    
    /**
     * Initialize the game model
     */
    init: function() {
        this.loadGameState();
        this.applyLevelSettings();
    },
    
    /**
     * Reset the game state
     */
    resetGameState: function() {
        this.state = {
            isRunning: false,
            level: 1,
            score: 0,
            uptime: 100,
            rules: [],
            levelProgress: 0,
            events: [],
            pendingMaliciousEvents: [],
            trafficData: [],
        };
        
        this.currentLevelIndex = 0;
        this.saveGameState();
        
        // Publish state changed event
        eventBus.publish('gameState:reset', this.state);
    },
    
    /**
     * Load game state from localStorage
     */
    loadGameState: function() {
        try {
            const storedState = localStorage.getItem('gameState');
            if (storedState) {
                const savedState = JSON.parse(storedState);
                
                // Only copy valid properties to prevent injection
                const validProperties = ['level', 'score', 'uptime', 'rules', 'levelProgress'];
                validProperties.forEach(prop => {
                    if (savedState.hasOwnProperty(prop)) {
                        this.state[prop] = savedState[prop];
                    }
                });
                
                this.currentLevelIndex = this.state.level - 1;
                
                // Validate level bounds
                if (this.currentLevelIndex < 0 || this.currentLevelIndex >= this.levels.length) {
                    this.currentLevelIndex = 0;
                    this.state.level = 1;
                }
            } else {
                this.currentLevelIndex = 0;
                this.state.level = 1;
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            this.currentLevelIndex = 0;
            this.state.level = 1;
        }
    },
    
    /**
     * Save game state to localStorage
     */
    saveGameState: function() {
        try {
            // Only save necessary state data, not the full events array
            const stateToSave = {
                level: this.state.level,
                score: this.state.score,
                uptime: this.state.uptime,
                rules: this.state.rules,
                levelProgress: this.state.levelProgress
            };
            
            localStorage.setItem('gameState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving game state:', error);
            eventBus.publish('notification:error', {
                message: 'Failed to save game state. Storage may be full or disabled.'
            });
        }
    },
    
    /**
     * Get the current level configuration
     * @returns {object} Current level
     */
    getCurrentLevel: function() {
        return this.levels[this.currentLevelIndex];
    },
    
    /**
     * Apply settings from the current level
     */
    applyLevelSettings: function() {
        const currentLevel = this.getCurrentLevel();
        
        this.settings.eventFrequencyMultiplier = currentLevel.eventFrequencyMultiplier;
        this.settings.noiseEventProbability = currentLevel.noiseEventProbability;
        this.settings.attackSophistication = currentLevel.attackSophistication;
        
        // Publish settings updated event
        eventBus.publish('settings:updated', this.settings);
    },
    
    /**
     * Start the next level
     * @returns {boolean} True if progressed to next level, false if game completed
     */
    startNextLevel: function() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            this.state.level = this.currentLevelIndex + 1;
            this.state.levelProgress = 0;
            
            this.saveGameState();
            this.applyLevelSettings();
            
            // Publish level changed event
            eventBus.publish('level:changed', {
                level: this.getCurrentLevel()
            });
            
            return true;
        } else {
            // Game completed, restart from level 1
            this.resetGameState();
            this.applyLevelSettings();
            
            // Publish game completed event
            eventBus.publish('game:completed');
            
            return false;
        }
    },
    
    /**
     * Calculate and update score based on game events
     * @param {number} detectedMaliciousEvents - Number of detected malicious events
     * @param {number} responseSpeed - How quickly player responded
     * @param {number} networkUptime - Current network uptime
     * @param {number} falsePositives - Number of false positive alerts
     * @returns {number} Points earned this round
     */
    calculateScore: function(detectedMaliciousEvents, responseSpeed, networkUptime, falsePositives) {
        let score = 0;
        score += detectedMaliciousEvents * 100; // Points per detected event
        score += responseSpeed * 5;     // Speed bonus 
        score += networkUptime * 10;    // Uptime points
        score -= falsePositives * 50;   // False positive penalty
        
        // Ensure score is never negative
        const earnedPoints = Math.max(0, Math.round(score));
        
        this.state.score += earnedPoints;
        this.saveGameState();
        
        // Publish score updated event
        eventBus.publish('score:updated', {
            totalScore: this.state.score,
            earnedPoints: earnedPoints
        });
        
        return earnedPoints;
    },
    
    /**
     * Add an event to the game state
     * @param {object} event - Game event
     */
    addEvent: function(event) {
        // Add to events array
        this.state.events.push(event);
        
        // If malicious, add to pending events
        if (event.category === "malicious") {
            this.state.pendingMaliciousEvents.push({
                event: event,
                timestamp: Date.now(),
                handled: false
            });
        }
        
        // Update traffic data
        this.state.trafficData.push({
            timestamp: Date.now(),
            packetCount: 1
        });
        
        // Limit traffic data length
        if (this.state.trafficData.length > 100) {
            this.state.trafficData.shift();
        }
        
        // Publish event added
        eventBus.publish('event:added', { event });
    },
    
    /**
     * Mark an event as handled
     * @param {object} event - The event to mark
     * @returns {boolean} True if event was found and marked
     */
    markEventAsHandled: function(event) {
        const pendingEvent = this.state.pendingMaliciousEvents.find(p => 
            p.event.timestamp === event.timestamp && 
            p.event.type === event.type &&
            p.event.ip === event.ip
        );
        
        if (pendingEvent) {
            pendingEvent.handled = true;
            
            // Calculate response time in seconds (capped at 30)
            const responseTime = Math.min(30, (Date.now() - pendingEvent.timestamp) / 1000);
            const responseSpeed = Math.max(0, 30 - responseTime); // Higher for faster response
            
            this.calculateScore(1, responseSpeed, this.state.uptime, 0);
            
            // Publish event handled
            eventBus.publish('event:handled', { event });
            
            return true;
        }
        
        return false;
    },
    
    /**
     * Get game statistics for debrief
     * @returns {object} Game statistics
     */
    getDebriefStats: function() {
        const currentLevel = this.getCurrentLevel();
        const eventsHandled = this.state.events.filter(e => 
            e.category === "malicious" && e._handled
        ).length;
        
        const totalMalicious = this.state.events.filter(e => 
            e.category === "malicious"
        ).length;
        
        return {
            levelName: currentLevel.name,
            levelDescription: currentLevel.description,
            currentScore: this.state.score,
            levelTargetScore: currentLevel.targetScore,
            eventsHandled: eventsHandled,
            totalMalicious: totalMalicious,
            handlePercentage: totalMalicious ? 
                Math.round((eventsHandled / totalMalicious) * 100) : 0,
            uptime: this.state.uptime
        };
    },
    
    /**
     * Get the status of all pending malicious events
     * @returns {array} Pending malicious events with status
     */
    getPendingMaliciousEvents: function() {
        return this.state.pendingMaliciousEvents.map(pendingEvent => {
            const timeElapsed = Date.now() - pendingEvent.timestamp;
            const escalationPercentage = Math.min(100, 
                Math.round((timeElapsed / this.settings.escalationTimeout) * 100)
            );
            
            return {
                event: pendingEvent.event,
                escalationPercentage: escalationPercentage,
                handled: pendingEvent.handled,
                timeElapsed: timeElapsed
            };
        });
    },
    
    /**
     * Check for events that need to be escalated
     * @returns {array} Events that should be escalated
     */
    checkEscalations: function() {
        const now = Date.now();
        const escalatedEvents = [];
        
        // Check each pending event
        this.state.pendingMaliciousEvents = this.state.pendingMaliciousEvents.filter(pendingEventInfo => {
            // Remove handled events
            if (pendingEventInfo.handled) {
                return false;
            }
            
            // Check if time to escalate
            const timeElapsed = now - pendingEventInfo.timestamp;
            if (timeElapsed >= this.settings.escalationTimeout) {
                // Add to escalated events
                escalatedEvents.push(pendingEventInfo.event);
                return false; // Remove from pending
            }
            
            return true; // Keep in pending
        });
        
        // Publish escalated events
        if (escalatedEvents.length > 0) {
            eventBus.publish('events:escalated', { events: escalatedEvents });
        }
        
        return escalatedEvents;
    }
};

export default gameModel;