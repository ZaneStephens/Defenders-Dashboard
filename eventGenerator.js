// eventGenerator.js - Generates game events
import possibleEvents from './threats.js';
import gameModel from './gameModel.js';
import { sanitizeString } from './utils.js';

const eventGenerator = {
    /**
     * Collection of functions for generating random event data
     */
    generators: {
        ip: function() { 
            return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`; 
        },
        
        username: function() { 
            const usernames = ["user1", "admin", "testuser", "attacker", "system"]; 
            return usernames[Math.floor(Math.random() * usernames.length)]; 
        },
        
        processName: function() {
            const processes = ["malware.exe", "suspicious.sh", "trojan.dll", "miner.bin", "unusual_script.py"];
            return processes[Math.floor(Math.random() * processes.length)];
        },
        
        domain: function() {
            const domains = [
                "badsite.com", 
                "malicious-domain.net", 
                "phishing.info", 
                "command-and-control.org", 
                "data-exfiltration.biz"
            ];
            return domains[Math.floor(Math.random() * domains.length)];
        },
        
        httpErrorCode: function() {
            const errorCodes = [400, 401, 403, 404, 500, 503];
            return errorCodes[Math.floor(Math.random() * errorCodes.length)];
        },
        
        url: function() {
            const urls = [
                "/admin/config.php", 
                "/api/data-export", 
                "/login.jsp", 
                "/hidden/backdoor.html", 
                "/logs/error.log"
            ];
            return urls[Math.floor(Math.random() * urls.length)];
        },
        
        resource: function() {
            const resources = [
                "/sensitive/customer_data.csv", 
                "/config/secrets.json", 
                "/database/credentials.txt", 
                "/api/admin_endpoints", 
                "/internal/system_logs"
            ];
            return resources[Math.floor(Math.random() * resources.length)];
        },
        
        service: function() {
            const services = [
                "database-service", 
                "authentication-service", 
                "web-application", 
                "monitoring-agent", 
                "firewall"
            ];
            return services[Math.floor(Math.random() * services.length)];
        }
    },
    
    /**
     * Choose an event template based on level settings
     * @param {object} levelSettings - Current level settings
     * @returns {object} Selected event template
     */
    chooseEventTemplate: function(levelSettings) {
        const weightedTemplates = possibleEvents.map(template => {
            let weight = template.likelihood;
            
            // Apply level-specific modifiers
            if (template.isNoise) {
                weight *= levelSettings.noiseEventProbability || 1;
            } else if (template.level_scaling && template.level_scaling.frequency) {
                weight *= levelSettings.eventFrequencyMultiplier * template.level_scaling.frequency;
            } else {
                weight *= levelSettings.eventFrequencyMultiplier;
            }
            
            return { template, weight };
        });
        
        // Calculate total weight
        let totalWeight = weightedTemplates.reduce((sum, wt) => sum + wt.weight, 0);
        let randomNum = Math.random() * totalWeight;
        let weightSum = 0;
        
        // Select template based on weight
        for (let i = 0; i < weightedTemplates.length; i++) {
            weightSum += weightedTemplates[i].weight;
            if (randomNum <= weightSum) {
                return weightedTemplates[i].template;
            }
        }
        
        // Default fallback
        return possibleEvents[0];
    },
    
    /**
     * Generate a new event based on current level settings
     * @returns {object} Generated event
     */
    generateEvent: function() {
        const levelSettings = gameModel.getCurrentLevel();
        const eventTemplate = this.chooseEventTemplate(levelSettings);
        
        // Create base event
        const event = {
            timestamp: new Date().toLocaleTimeString(),
            type: eventTemplate.type,
            description: sanitizeString(eventTemplate.description),
            severity: eventTemplate.baseSeverity,
            isNoise: eventTemplate.isNoise || false,
            category: eventTemplate.category,
            domain: eventTemplate.domain,
            escalation: eventTemplate.escalation,
            remediation: eventTemplate.remediation,
            education: sanitizeString(eventTemplate.education)
        };
        
        // Add type-specific properties
        this.addTypeSpecificProperties(event, eventTemplate);
        
        return event;
    },
    
    /**
     * Add type-specific properties to an event
     * @param {object} event - Event to modify
     * @param {object} template - Event template
     */
    addTypeSpecificProperties: function(event, template) {
        // Add IP to all events by default (for block_ip action)
        event.ip = this.generators.ip();
        
        // Add type-specific properties
        switch (event.type) {
            case "login_fail":
                event.user = this.generators.username();
                event.count = Math.floor(Math.random() * 10) + 1; // 1-10 failures
                break;
                
            case "traffic_spike":
                event.volume = Math.floor(Math.random() * 500) + 100; // 100-599 volume
                break;
                
            case "process_spawn":
                event.process = this.generators.processName();
                event.user = this.generators.username();
                break;
                
            case "dns_query":
                event.domain = this.generators.domain();
                break;
                
            case "http_error":
                event.code = this.generators.httpErrorCode();
                event.url = this.generators.url();
                break;
                
            case "unauthorized_access":
                event.user = this.generators.username();
                event.resource = this.generators.resource();
                event.action = "read";
                break;
                
            case "service_failure":
                event.service = this.generators.service();
                event.status = "down";
                break;
                
            case "normal_activity":
            case "false_positive_scan":
                // Already added IP by default
                break;
                
            case "sql_injection":
                event.user = this.generators.username();
                event.url = template.url ? template.url() : this.generators.url();
                break;
                
            default:
                // No additional properties for unknown event types
        }
    }
};

export default eventGenerator;