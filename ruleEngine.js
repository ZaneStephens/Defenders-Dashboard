// ruleEngine.js - Handles rule creation and event evaluation
import eventBus from './eventBus.js';
import gameModel from './gameModel.js';

const ruleEngine = {
    /**
     * Initialize the rule engine
     */
    init: function() {
        this.loadRules();
        
        // Subscribe to new events
        eventBus.subscribe('event:added', this.handleNewEvent.bind(this));
    },
    
    /**
     * Handle a new event coming in
     * @param {object} data - Event data from the event bus
     */
    handleNewEvent: function(data) {
        const event = data.event;
        const triggeredRules = this.checkEventAgainstRules(event);
        
        if (triggeredRules.length > 0) {
            // Mark event as handled by a rule
            gameModel.markEventAsHandled(event);
            
            // Publish rule triggered event
            eventBus.publish('rules:triggered', {
                event: event,
                rules: triggeredRules
            });
        }
    },
    
    /**
     * Add a new rule to the system
     * @param {object} rule - Rule definition
     */
    addRule: function(rule) {
        // Validate rule
        if (!this.validateRule(rule)) {
            eventBus.publish('notification:error', {
                message: 'Invalid rule configuration. Please check all fields.'
            });
            return false;
        }
        
        // Add to model's rules
        gameModel.state.rules.push(rule);
        gameModel.saveGameState();
        
        // Publish rule added event
        eventBus.publish('rule:added', { rule });
        
        return true;
    },
    
    /**
     * Validate a rule is properly configured
     * @param {object} rule - Rule to validate
     * @returns {boolean} True if valid
     */
    validateRule: function(rule) {
        if (!rule || !rule.conditionType) {
            return false;
        }
        
        switch (rule.conditionType) {
            case "login_fail":
            case "traffic_spike":
                return rule.threshold && !isNaN(parseInt(rule.threshold));
                
            case "process_spawn":
                return rule.processName && rule.processName.trim().length > 0;
                
            case "dns_query":
                return rule.domainKeyword && rule.domainKeyword.trim().length > 0;
                
            case "http_error":
                return rule.errorCodeThreshold && 
                       !isNaN(parseInt(rule.errorCodeThreshold)) && 
                       parseInt(rule.errorCodeThreshold) >= 100 &&
                       parseInt(rule.errorCodeThreshold) <= 599;
                       
            case "unauthorized_access":
                return rule.resourceKeyword && rule.resourceKeyword.trim().length > 0;
                
            case "service_failure":
                return rule.serviceName && rule.serviceName.trim().length > 0;
                
            default:
                return false;
        }
    },
    
    /**
     * Load saved rules from game model
     */
    loadRules: function() {
        // Rules are now stored in the game model
        return gameModel.state.rules;
    },
    
    /**
     * Evaluate if a single rule applies to an event
     * @param {object} rule - Rule definition
     * @param {object} event - Event to check
     * @returns {boolean} True if rule matches event
     */
    evaluateRule: function(rule, event) {
        if (!rule || !event) {
            return false;
        }
        
        let conditionMet = false;
        
        switch (rule.conditionType) {
            case "login_fail":
                if (event.type === "login_fail" && parseInt(event.count) > parseInt(rule.threshold)) {
                    conditionMet = true;
                }
                break;
                
            case "traffic_spike":
                if (event.type === "traffic_spike" && parseInt(event.volume) > parseInt(rule.threshold)) {
                    conditionMet = true;
                }
                break;
                
            case "process_spawn":
                if (event.type === "process_spawn" && 
                    event.process && 
                    event.process === rule.processName) {
                    conditionMet = true;
                }
                break;
                
            case "dns_query":
                if (event.type === "dns_query" && 
                    event.domain && 
                    event.domain.includes(rule.domainKeyword)) {
                    conditionMet = true;
                }
                break;
                
            case "http_error":
                if (event.type === "http_error" && 
                    parseInt(event.code) >= parseInt(rule.errorCodeThreshold)) {
                    conditionMet = true;
                }
                break;
                
            case "unauthorized_access":
                if (event.type === "unauthorized_access" && 
                    event.resource && 
                    event.resource.includes(rule.resourceKeyword)) {
                    conditionMet = true;
                }
                break;
                
            case "service_failure":
                if (event.type === "service_failure" && 
                    event.service === rule.serviceName) {
                    conditionMet = true;
                }
                break;
                
            default:
                conditionMet = false;
        }
        
        return conditionMet;
    },
    
    /**
     * Test a rule against sample events
     * @param {object} rule - Rule definition
     * @param {array} testEvents - Events to test against
     * @returns {array} Matching events
     */
    testRule: function(rule, testEvents) {
        const results = [];
        
        testEvents.forEach(event => {
            if (this.evaluateRule(rule, event)) {
                results.push({ event: event, rule: rule });
            }
        });
        
        return results;
    },
    
    /**
     * Check a single event against all rules
     * @param {object} event - Event to check
     * @returns {array} Triggered rules
     */
    checkEventAgainstRules: function(event) {
        const triggeredRules = [];
        
        gameModel.state.rules.forEach(rule => {
            if (this.evaluateRule(rule, event)) {
                triggeredRules.push(rule);
            }
        });
        
        return triggeredRules;
    },
    
    /**
     * Check all events against a specific rule
     * @param {object} rule - Rule to check
     * @returns {array} Matching events
     */
    checkRuleAgainstEvents: function(rule) {
        return gameModel.state.events.filter(event => 
            this.evaluateRule(rule, event)
        );
    }
};

export default ruleEngine;