// gameController.js - Main controller
import eventBus from './eventBus.js';
import gameModel from './gameModel.js';
import ruleEngine from './ruleEngine.js';
import eventGenerator from './eventGenerator.js';
import threatBriefs from './briefsController.js';

const gameController = {
    simulationInterval: null,
    escalationCheckInterval: null,
    debugMode: false, // Debug mode flag
    
    /**
     * Initialize the game controller
     */
    init: function() {
        // Initialize components
        gameModel.init();
        ruleEngine.init();
        threatBriefs.init();
        
        // Set up event subscriptions
        this.setupEventSubscriptions();
        
        // Add debug mode toggle to window for console access
        window.toggleDebugMode = this.toggleDebugMode.bind(this);
        
        // Log initialization
        console.log('Game controller initialized.');
        console.log('To enable debug mode, run toggleDebugMode() in the console');
    },
    
    /**
     * Toggle debug mode
     * @returns {boolean} New debug mode state
     */
    toggleDebugMode: function() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
        
        if (this.debugMode) {
            // Show debug UI
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel) {
                debugPanel.style.display = 'block';
            } else {
                this.createDebugPanel();
            }
        } else {
            // Hide debug UI
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel) {
                debugPanel.style.display = 'none';
            }
        }
        
        return this.debugMode;
    },
    
    /**
     * Create debug panel
     */
    createDebugPanel: function() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.bottom = '10px';
        debugPanel.style.left = '10px';
        debugPanel.style.backgroundColor = '#333';
        debugPanel.style.color = '#fff';
        debugPanel.style.padding = '10px';
        debugPanel.style.borderRadius = '5px';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.maxWidth = '300px';
        debugPanel.style.maxHeight = '300px';
        debugPanel.style.overflow = 'auto';
        debugPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        
        debugPanel.innerHTML = `
            <h3 style="margin-top:0;">Debug Panel</h3>
            <button id="debug-dump-state">Dump Game State</button>
            <button id="debug-dump-events">Dump Recent Events</button>
            <button id="debug-dump-rules">Dump Rules</button>
            <pre id="debug-output" style="background:#222;padding:5px;margin-top:10px;"></pre>
        `;
        
        document.body.appendChild(debugPanel);
        
        // Add event listeners to debug buttons
        document.getElementById('debug-dump-state').addEventListener('click', () => {
            const output = document.getElementById('debug-output');
            output.textContent = JSON.stringify(gameModel.state, null, 2);
        });
        
        document.getElementById('debug-dump-events').addEventListener('click', () => {
            const output = document.getElementById('debug-output');
            output.textContent = JSON.stringify(gameModel.state.events.slice(-5), null, 2);
        });
        
        document.getElementById('debug-dump-rules').addEventListener('click', () => {
            const output = document.getElementById('debug-output');
            output.textContent = JSON.stringify(gameModel.state.rules, null, 2);
        });
    },
    
    /**
     * Set up subscriptions to event bus events
     */
    setupEventSubscriptions: function() {
        // Handle UI button actions
        eventBus.subscribe('ui:startGame', this.startSimulation.bind(this));
        eventBus.subscribe('ui:pauseGame', this.pauseSimulation.bind(this));
        eventBus.subscribe('ui:resetGame', this.resetGame.bind(this));
        
        // Handle rule actions
        eventBus.subscribe('ui:testRule', this.testRule.bind(this));
        eventBus.subscribe('ui:saveRule', this.saveRule.bind(this));
        
        // Handle event actions
        eventBus.subscribe('ui:handleEvent', this.handleEvent.bind(this));
        
        // Respond to state requests
        eventBus.subscribe('request:gameState', this.getGameState.bind(this));
    },
    
    /**
     * Start the game simulation
     */
    startSimulation: function() {
        // Don't start if already running
        if (this.simulationInterval) {
            return;
        }
        
        // Update game model state
        gameModel.state.isRunning = true;
        
        // Start briefs
        threatBriefs.startBriefs();
        
        // Publish game started event
        eventBus.publish('game:started');
        
        // Start event generation interval
        this.simulationInterval = setInterval(() => {
            // Generate a new event
            const event = eventGenerator.generateEvent();
            
            // Add event to game model
            gameModel.addEvent(event);
            
            // Check for false positives if this is noise
            if (event.isNoise && Math.random() < gameModel.settings.falsePositiveChance) {
                const falsePositiveEvent = {
                    ...event,
                    type: "potential_false_positive",
                    description: `Potential false positive: ${event.description}`
                };
                
                // Add false positive event
                gameModel.addEvent(falsePositiveEvent);
            }
        }, 
        // Use level-specific event frequency
        gameModel.settings.simulationInterval * gameModel.settings.eventFrequencyMultiplier);
        
        // Start escalation check interval
        this.escalationCheckInterval = setInterval(() => {
            const escalatedEvents = gameModel.checkEscalations();
            
            if (escalatedEvents.length > 0) {
                // Handle escalations is already done via eventBus
                console.log(`${escalatedEvents.length} events escalated.`);
            }
        }, 5000); // Check every 5 seconds
    },
    
    /**
     * Pause the game simulation
     */
    pauseSimulation: function() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        if (this.escalationCheckInterval) {
            clearInterval(this.escalationCheckInterval);
            this.escalationCheckInterval = null;
        }
        
        // Update game model state
        gameModel.state.isRunning = false;
        
        // Stop briefs
        threatBriefs.stopBriefs();
        
        // Publish game paused event
        eventBus.publish('game:paused');
    },
    
    /**
     * Stop and reset the game
     */
    resetGame: function() {
        // Stop simulation
        this.pauseSimulation();
        
        // Reset game state
        gameModel.resetGameState();
        
        // Reset event listeners 
        eventBus.reset();
        
        // Re-setup event subscriptions
        this.setupEventSubscriptions();
        
        // Publish game reset event
        eventBus.publish('game:reset');
        
        console.log('Game reset completed.');
    },
    
    /**
     * Test a rule against recent events
     * @param {object} data - Rule data from the event bus
     */
    testRule: function(data) {
        const rule = data.rule;
        
        // Use last 10 events for testing
        const testEvents = gameModel.state.events.slice(-10);
        
        // Test rule
        const results = ruleEngine.testRule(rule, testEvents);
        
        // Publish test results
        eventBus.publish('rule:testResults', {
            rule: rule,
            results: results
        });
    },
    
    /**
     * Save a rule
     * @param {object} data - Rule data from the event bus
     */
    saveRule: function(data) {
        const rule = data.rule;
        const success = ruleEngine.addRule(rule);
        
        if (success) {
            // Rule added successfully
            eventBus.publish('notification:success', {
                message: 'Rule saved successfully.'
            });
        }
    },
    
    /**
     * Handle an event via player action
     * @param {object} data - Event data from the event bus
     */
    handleEvent: function(data) {
        const event = data.event;
        const action = data.action;
        
        // Check if event and action are defined
        if (!event || !action) {
            eventBus.publish('notification:error', {
                message: `Invalid event or action specified.`
            });
            return;
        }
        
        // Format action for display (replace underscores with spaces)
        const formattedAction = typeof action === 'string' ? action.replace(/_/g, ' ') : String(action);
        
        // Handle special manual actions
        if (action === 'stop_timer') {
            // Pause all timers/simulation
            this.pauseSimulation();
            eventBus.publish('notification:info', {
                message: `Timers paused. Click Start Simulation to resume.`
            });
            return;
        }
        
        if (action === 'clear_log') {
            // Clear alerts from UI
            const alertList = document.getElementById('alert-list');
            if (alertList) {
                alertList.innerHTML = '';
                eventBus.publish('notification:success', {
                    message: `Alert list cleared.`
                });
            }
            return;
        }
        
        // Special case for apply_rule - always succeeds
        if (action === 'apply_rule') {
            gameModel.markEventAsHandled(event);
            eventBus.publish('notification:success', {
                message: `Rule applied successfully to ${event.type} event.`
            });
            return;
        }
        
        // If action doesn't match the remediation for this event
        let isEffective = false;
        
        // Check if this is a valid remediation for this event
        if (event.remediation) {
            const possibleRemediation = event.remediation.split(', ');
            isEffective = possibleRemediation.includes(action);
        } 
        
        // Alternative remediations - if the exact action isn't listed but general type is
        if (!isEffective) {
            // For any network/connection issues, block_ip is generally effective
            if (action === 'block_ip' && 
                (event.type === 'dns_query' || event.type === 'http_error' || 
                 event.type === 'traffic_spike' || event.type === 'sql_injection')) {
                isEffective = true;
            }
            
            // For any service issues, rebooting often helps
            if (action === 'reboot_server' && 
                (event.type === 'service_failure' || event.type === 'process_spawn')) {
                isEffective = true;
            }
            
            // For auth issues, password reset helps
            if (action === 'reset_password' && 
                (event.type === 'login_fail' || event.type === 'unauthorized_access')) {
                isEffective = true;
            }
        }
        
        if (isEffective) {
            // Mark event as handled
            const success = gameModel.markEventAsHandled(event);
            
            if (success) {
                eventBus.publish('notification:success', {
                    message: `${formattedAction} succeeded for ${event.type}.`
                });
            } else {
                eventBus.publish('notification:error', {
                    message: `Unable to apply ${formattedAction} to this event.`
                });
            }
        } else {
            eventBus.publish('notification:warning', {
                message: `${formattedAction} is not an effective mitigation for ${event.type}.`
            });
        }
    },
    
    /**
     * Get current game state
     * @returns {object} Current game state
     */
    getGameState: function() {
        return {
            isRunning: gameModel.state.isRunning,
            level: gameModel.getCurrentLevel(),
            score: gameModel.state.score,
            uptime: gameModel.state.uptime,
            pendingThreats: gameModel.getPendingMaliciousEvents()
        };
    }
};

export default gameController;