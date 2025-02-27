// escalationsController.js - Handles threat escalations
import eventBus from './eventBus.js';
import gameModel from './gameModel.js';
import { sanitizeString } from './utils.js';

const escalationsController = {
    // Escalation scenarios by event type
    escalationScenarios: {
        login_fail: {
            attackVectorDescription: "Brute force attack detected. Unauthorized access attempt may lead to account compromise.",
            impact: "Potential account takeover and data breach.",
            mitigationTip: "Block the IP and reset affected credentials.",
            tactics: ["Initial Access", "Credential Access"],
            techniques: ["T1110 - Brute Force", "T1078 - Valid Accounts"]
        },
        traffic_spike: {
            attackVectorDescription: "Distributed Denial of Service (DDoS) attack suspected. High traffic volume may overwhelm servers.",
            impact: "Service downtime and degraded performance.",
            mitigationTip: "Implement rate limiting and contact ISP.",
            tactics: ["Impact"],
            techniques: ["T1498 - Network Denial of Service", "T1499 - Endpoint Denial of Service"]
        },
        dns_query: {
            attackVectorDescription: "Command and Control (C2) communication detected. Malicious domain query suggests botnet activity.",
            impact: "Data exfiltration or malware propagation.",
            mitigationTip: "Blacklist the domain and scan for infections.",
            tactics: ["Command and Control", "Exfiltration"],
            techniques: ["T1071 - Application Layer Protocol", "T1008 - Fallback Channels"]
        },
        http_error: {
            attackVectorDescription: "Web application attack (e.g., SQL injection) detected via error codes.",
            impact: "Database compromise or website defacement.",
            mitigationTip: "Patch vulnerabilities and monitor logs.",
            tactics: ["Initial Access", "Execution"],
            techniques: ["T1190 - Exploit Public-Facing Application", "T1059 - Command and Scripting Interpreter"]
        },
        unauthorized_access: {
            attackVectorDescription: "Unauthorized access to sensitive resource detected, likely an insider threat or exploit.",
            impact: "Data leakage or privilege escalation.",
            mitigationTip: "Revoke access and audit permissions.",
            tactics: ["Privilege Escalation", "Lateral Movement"],
            techniques: ["T1078 - Valid Accounts", "T1021 - Remote Services"]
        },
        service_failure: {
            attackVectorDescription: "Critical service disruption, possibly due to a ransomware or exploit attack.",
            impact: "System downtime and loss of availability.",
            mitigationTip: "Restore from backup and isolate affected systems.",
            tactics: ["Impact"],
            techniques: ["T1486 - Data Encrypted for Impact", "T1489 - Service Stop"]
        },
        process_spawn: {
            attackVectorDescription: "Malicious process execution detected, indicative of malware or rootkit activity.",
            impact: "System compromise and potential lateral movement.",
            mitigationTip: "Terminate the process and run antivirus scans.",
            tactics: ["Execution", "Persistence"],
            techniques: ["T1059 - Command and Scripting Interpreter", "T1053 - Scheduled Task/Job"]
        },
        sql_injection: {
            attackVectorDescription: "SQL injection attack detected targeting database through web application.",
            impact: "Data theft, database corruption, or unauthorized access.",
            mitigationTip: "Patch vulnerabilities, validate inputs, and audit database access.",
            tactics: ["Initial Access", "Credential Access"],
            techniques: ["T1190 - Exploit Public-Facing Application", "T1552 - Unsecured Credentials"]
        }
    },
    
    /**
     * Initialize the escalations controller
     */
    init: function() {
        // Subscribe to escalations events
        eventBus.subscribe('events:escalated', this.handleEscalatedEvents.bind(this));
    },
    
    /**
     * Handle escalated events
     * @param {object} data - Data from event bus
     */
    handleEscalatedEvents: function(data) {
        data.events.forEach(event => {
            // Generate escalation data
            const escalationData = this.generateEscalationData(event);
            
            // Publish escalation started event WITHOUT showing a modal
            // (The simulationController will handle displaying the visual)
            eventBus.publish('escalation:started', {
                event: event,
                escalationData: escalationData
            });
            
            // Reduce network uptime due to escalation
            this.applyEscalationImpact(event);
        });
    },
    
    /**
     * Generate escalation data for an event
     * @param {object} event - Event that escalated
     * @returns {object} Escalation data
     */
    generateEscalationData: function(event) {
        // Get scenario for this event type
        const scenario = this.getScenarioForEvent(event);
        
        // Create escalation object with sanitized data
        return {
            eventType: event.type,
            attackVector: sanitizeString(scenario.attackVectorDescription),
            impact: sanitizeString(scenario.impact),
            mitigationTip: sanitizeString(scenario.mitigationTip),
            tactics: scenario.tactics || [],
            techniques: scenario.techniques || [],
            timestamp: new Date().toISOString(),
            severity: event.severity || 5,
            affectedSystems: this.generateAffectedSystems(event.type),
            simulatedDamage: this.calculateSimulatedDamage(event)
        };
    },
    
    /**
     * Get escalation scenario for an event
     * @param {object} event - Event to get scenario for
     * @returns {object} Escalation scenario
     */
    getScenarioForEvent: function(event) {
        // Get predefined scenario or use default
        return this.escalationScenarios[event.type] || {
            attackVectorDescription: "Unknown attack vector detected.",
            impact: "Unspecified system compromise.",
            mitigationTip: "Investigate and apply general security measures.",
            tactics: ["Unknown"],
            techniques: ["Unknown"]
        };
    },
    
    /**
     * Generate list of affected systems based on event type
     * @param {string} eventType - Type of event
     * @returns {array} List of affected systems
     */
    generateAffectedSystems: function(eventType) {
        const systemsByEventType = {
            login_fail: ['Authentication Server', 'User Directory', 'VPN Gateway'],
            traffic_spike: ['Load Balancer', 'Web Server', 'Network Gateway'],
            dns_query: ['DNS Server', 'Edge Router', 'Proxy Server'],
            http_error: ['Web Application', 'API Gateway', 'Content Delivery'],
            unauthorized_access: ['File Server', 'Database', 'Admin Console'],
            service_failure: ['Application Server', 'Message Queue', 'Service Bus'],
            process_spawn: ['End User Workstation', 'Application Server', 'Development Environment'],
            sql_injection: ['Database Server', 'Web Application', 'Data Warehouse']
        };
        
        return systemsByEventType[eventType] || ['Unknown System'];
    },
    
    /**
     * Calculate simulated damage from an event
     * @param {object} event - Event to calculate damage for
     * @returns {object} Damage metrics
     */
    calculateSimulatedDamage: function(event) {
        // Base damage values
        const baseDamage = {
            uptimeImpact: event.severity * 2, // Percentage points of uptime loss
            dataBreach: event.severity > 5, // Data breach if high severity
            financialImpact: event.severity * 1000, // Simulated financial impact
            recoveryTimeHours: Math.ceil(event.severity / 2) // Simulated recovery time
        };
        
        // Adjust based on event type
        switch (event.type) {
            case 'traffic_spike':
                baseDamage.uptimeImpact *= 1.5;
                baseDamage.dataBreach = false;
                break;
                
            case 'unauthorized_access':
            case 'sql_injection':
                baseDamage.dataBreach = true;
                baseDamage.financialImpact *= 2;
                break;
                
            case 'service_failure':
                baseDamage.uptimeImpact *= 2;
                baseDamage.recoveryTimeHours *= 1.5;
                break;
        }
        
        return baseDamage;
    },
    
    /**
     * Apply impact of escalation to game state
     * @param {object} event - Escalated event
     */
    applyEscalationImpact: function(event) {
        // Calculate damage
        const damage = this.calculateSimulatedDamage(event);
        
        // Apply uptime impact
        gameModel.state.uptime = Math.max(0, 
            gameModel.state.uptime - damage.uptimeImpact);
        
        // Publish uptime updated event
        eventBus.publish('uptime:updated', {
            uptime: gameModel.state.uptime,
            cause: event.type
        });
        
        // If uptime reaches 0, game over
        if (gameModel.state.uptime <= 0) {
            eventBus.publish('game:over', {
                reason: 'network_down',
                event: event
            });
        }
        
        // Save state
        gameModel.saveGameState();
    }
};

export default escalationsController;