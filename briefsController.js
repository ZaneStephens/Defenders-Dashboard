// briefsController.js - Manages threat intelligence briefings
import eventBus from './eventBus.js';
import { sanitizeString } from './utils.js';

/**
 * BriefsController manages timely threat intelligence updates
 * to educate users on current cybersecurity developments
 */
const briefsController = {
    briefInterval: null,
    lastBriefTimes: {},
    
    // Comprehensive threat intelligence briefs library
    briefLibrary: {
        // Network Threats
        botnet_activity: {
            id: 'botnet',
            title: "Botnet Activity Alert",
            category: "Network Threats",
            severity: "high",
            message: "Intelligence sources report new botnet targeting port 445 (SMB).",
            details: {
                threat: "Emerging botnet infrastructure targeting SMB services",
                impact: "Potential for lateral movement and data exfiltration if compromised",
                tactics: ["Command & Control", "Lateral Movement"],
                indicators: ["Unusual outbound traffic on port 445", "Multiple connection attempts from external IPs"],
                mitigation: "Block unnecessary SMB traffic at perimeter, patch systems against SMB vulnerabilities"
            },
            reference: "CVE-2020-0796 (SMBGhost)",
            moreInfo: "https://www.cisa.gov/news-events/cybersecurity-advisories",
            trigger: { type: "time", interval: 360000 } // Trigger every 6 minutes
        },
        
        eastern_europe_activity: {
            id: 'eastern_europe',
            title: "Geographic Threat Activity",
            category: "Network Threats",
            severity: "medium",
            message: "Increased network scanning activity detected from Eastern Europe.",
            details: {
                threat: "Coordinated scanning campaign targeting critical infrastructure",
                impact: "Reconnaissance could precede targeted attacks against vulnerable systems",
                tactics: ["Reconnaissance", "Initial Access"],
                indicators: ["Port scans from specific IP ranges", "Probing of uncommon service ports"],
                mitigation: "Review firewall rules, implement geographic-based blocking where appropriate"
            },
            reference: "Multiple threat intelligence feeds corroborate this activity",
            moreInfo: "https://www.cisecurity.org/resources/",
            trigger: { type: "time", interval: 480000 } // Trigger every 8 minutes
        },
        
        unusual_dns: {
            id: 'unusual_dns',
            title: "DNS Tunneling Alert",
            category: "Network Threats",
            severity: "high",
            message: "High volume of DNS queries to unusual TLDs observed across multiple organizations.",
            details: {
                threat: "Possible DNS tunneling or domain generation algorithm (DGA) activity",
                impact: "Potential data exfiltration via DNS or command & control communication",
                tactics: ["Command & Control", "Exfiltration"],
                indicators: ["High volume of DNS queries", "Unusual domain length or entropy", "Queries to newly registered domains"],
                mitigation: "Implement DNS filtering, monitor for unusual DNS patterns, deploy DNS security solutions"
            },
            reference: "MITRE ATT&CK T1071.004 - Application Layer Protocol: DNS",
            moreInfo: "https://attack.mitre.org/techniques/T1071/004/",
            trigger: { type: "event_category", category: "dns_query" }
        },
        
        // Malware Threats
        ransomware_campaign: {
            id: 'ransomware',
            title: "Ransomware Campaign Alert",
            category: "Malware Threats",
            severity: "critical",
            message: "Intelligence sources report new ransomware campaign targeting your industry sector.",
            details: {
                threat: "Sophisticated ransomware using zero-day exploits and double extortion tactics",
                impact: "Potential for complete operational disruption and data breach",
                tactics: ["Initial Access", "Impact"],
                indicators: ["Phishing emails with specific industry terminology", "PowerShell obfuscation techniques", "Shadow copy deletion"],
                mitigation: "Ensure offline backups, patch critical systems, implement application whitelisting"
            },
            reference: "Similar to Ryuk/Conti TTPs (Tactics, Techniques, and Procedures)",
            moreInfo: "https://www.cisa.gov/stopransomware",
            trigger: { type: "time", interval: 600000 } // Trigger every 10 minutes
        },
        
        malware_detection: {
            id: 'malware',
            title: "Malware Analysis Report",
            category: "Malware Threats",
            severity: "high",
            message: "New strain of polymorphic malware identified in the wild evading traditional detection.",
            details: {
                threat: "Advanced persistent threat using fileless malware techniques",
                impact: "Long-term compromise with data theft capabilities",
                tactics: ["Defense Evasion", "Persistence"],
                indicators: ["Memory-only payloads", "Registry modifications", "Scheduled task creation"],
                mitigation: "Deploy EDR solutions, enable PowerShell logging, implement memory scanning"
            },
            reference: "MITRE ATT&CK T1027 - Obfuscated Files or Information",
            moreInfo: "https://attack.mitre.org/techniques/T1027/",
            trigger: { type: "event_category", category: "process_spawn" }
        },
        
        // Vulnerability Alerts
        zero_day_vulnerability: {
            id: 'zero_day',
            title: "Zero-Day Vulnerability Alert",
            category: "Vulnerability Alerts",
            severity: "critical",
            message: "Critical zero-day vulnerability announced affecting web servers. Patch immediately.",
            details: {
                threat: "Remote code execution vulnerability in popular web server software",
                impact: "Complete system compromise if exploited",
                tactics: ["Initial Access", "Execution"],
                indicators: ["Exploitation attempts visible in web server logs", "Unusual process spawning from web server process"],
                mitigation: "Apply emergency patch, implement WAF rules, or isolate vulnerable systems"
            },
            reference: "CVE-2023-XXXXX - Under active exploitation",
            moreInfo: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
            trigger: { type: "time", interval: 540000 } // Trigger every 9 minutes
        },
        
        supply_chain: {
            id: 'supply_chain',
            title: "Supply Chain Security Alert",
            category: "Vulnerability Alerts",
            severity: "high",
            message: "Compromised software supply chain affecting development libraries identified.",
            details: {
                threat: "Malicious code insertion in third-party dependencies",
                impact: "Potential backdoor in applications using affected libraries",
                tactics: ["Persistence", "Defense Evasion"],
                indicators: ["Unexpected network connections from applications", "Unusual API calls"],
                mitigation: "Audit software dependencies, implement software composition analysis"
            },
            reference: "Similar to SolarWinds/Log4Shell compromise techniques",
            moreInfo: "https://www.ncsc.gov.uk/collection/supply-chain-security",
            trigger: { type: "time", interval: 420000 } // Trigger every 7 minutes
        },
        
        // Credential Threats
        credential_leak: {
            id: 'credential_leak',
            title: "Credential Exposure Alert",
            category: "Credential Threats",
            severity: "medium",
            message: "Credentials from your organization's domain found in recent dark web data leak.",
            details: {
                threat: "Exposed credentials that could be used for unauthorized access",
                impact: "Account takeover and initial access vector for attacks",
                tactics: ["Initial Access", "Credential Access"],
                indicators: ["Login attempts from unusual locations", "Password spraying attempts"],
                mitigation: "Force password resets, implement MFA, monitor for suspicious logins"
            },
            reference: "MITRE ATT&CK T1589.001 - Gather Victim Identity Information: Credentials",
            moreInfo: "https://attack.mitre.org/techniques/T1589/001/",
            trigger: { type: "event_category", category: "login_fail" }
        },
        
        password_spray: {
            id: 'password_spray',
            title: "Password Spray Campaign",
            category: "Credential Threats",
            severity: "high",
            message: "Reports indicate a surge in credential stuffing attacks across the industry.",
            details: {
                threat: "Coordinated password spraying campaign targeting cloud services",
                impact: "Potential unauthorized access to cloud resources and data",
                tactics: ["Initial Access", "Credential Access"],
                indicators: ["Multiple failed logins across different accounts", "Login attempts from unexpected geographic locations"],
                mitigation: "Implement account lockout policies, deploy MFA, use sign-in risk policies"
            },
            reference: "MITRE ATT&CK T1110.003 - Brute Force: Password Spraying",
            moreInfo: "https://attack.mitre.org/techniques/T1110/003/",
            trigger: { type: "event_category", category: "login_fail" }
        },
        
        // Web Application Threats
        web_attack: {
            id: 'web_attack',
            title: "Web Application Attack Campaign",
            category: "Web Application Threats",
            severity: "high",
            message: "New campaign targeting web application vulnerabilities detected.",
            details: {
                threat: "Sophisticated actors exploiting common web vulnerabilities",
                impact: "Data theft, service disruption, or full application compromise",
                tactics: ["Initial Access", "Credential Access"],
                indicators: ["Specific attack patterns in web logs", "Unusual database queries", "File upload attempts"],
                mitigation: "Update WAF rules, patch applications, implement input validation"
            },
            reference: "OWASP Top 10 vulnerabilities being actively targeted",
            moreInfo: "https://owasp.org/Top10/",
            trigger: { type: "event_category", category: "http_error" }
        },
        
        sql_injection_campaign: {
            id: 'sql_injection',
            title: "SQL Injection Campaign",
            category: "Web Application Threats",
            severity: "high",
            message: "Targeted SQL injection campaign affecting organizations in your sector.",
            details: {
                threat: "Sophisticated SQL injection techniques bypassing common protections",
                impact: "Database theft, authentication bypass, or data manipulation",
                tactics: ["Initial Access", "Collection"],
                indicators: ["SQL syntax in HTTP parameters", "Database errors in logs", "Unusual query patterns"],
                mitigation: "Implement prepared statements, update WAF rules, audit database permissions"
            },
            reference: "MITRE ATT&CK T1190 - Exploit Public-Facing Application",
            moreInfo: "https://attack.mitre.org/techniques/T1190/",
            trigger: { type: "event_category", category: "sql_injection" }
        },
        
        // Insider Threats
        insider_threat: {
            id: 'insider_threat',
            title: "Insider Threat Advisory",
            category: "Insider Threats",
            severity: "medium",
            message: "Increased insider threat activity observed across multiple sectors.",
            details: {
                threat: "Privileged users abusing access for data theft or sabotage",
                impact: "Data exfiltration, intellectual property theft, or system sabotage",
                tactics: ["Collection", "Exfiltration"],
                indicators: ["Unusual access patterns", "Access outside normal hours", "Bulk data downloads"],
                mitigation: "Implement least privilege, user activity monitoring, and data loss prevention"
            },
            reference: "MITRE ATT&CK T1078 - Valid Accounts",
            moreInfo: "https://attack.mitre.org/techniques/T1078/",
            trigger: { type: "event_category", category: "unauthorized_access" }
        },
        
        // Infrastructure Threats
        infrastructure: {
            id: 'infrastructure',
            title: "Critical Infrastructure Alert",
            category: "Infrastructure Threats",
            severity: "critical",
            message: "Critical infrastructure targeting campaign identified against your industry.",
            details: {
                threat: "Nation-state sponsored campaign targeting critical systems",
                impact: "Potential for service disruption, safety concerns, or operational impact",
                tactics: ["Impact", "Inhibit Response Function"],
                indicators: ["Targeting of specific industrial systems", "Reconnaissance of operational technology networks"],
                mitigation: "Network segmentation, enhanced monitoring, incident response planning"
            },
            reference: "Similar to TRITON/TRISIS industrial control system attacks",
            moreInfo: "https://www.cisa.gov/critical-infrastructure-sectors",
            trigger: { type: "event_category", category: "service_failure" }
        },
        
        // Maintenance and System
        maintenance: {
            id: 'maintenance',
            title: "System Maintenance Notice",
            category: "System Updates",
            severity: "info",
            message: "System admins are performing routine maintenance. Expect some benign alerts.",
            details: {
                activity: "Scheduled system updates and maintenance",
                impact: "Minimal - possible temporary increase in system alerts",
                schedule: "Current maintenance window",
                affected: "Various network and server systems",
                actions: "No action required - advisable to avoid making system changes during this period"
            },
            trigger: { type: "event_category", category: "benign" }
        },
        
        security_update: {
            id: 'security_update',
            title: "Security Posture Update",
            category: "System Updates",
            severity: "info",
            message: "Security team has deployed new detection capabilities for emerging threats.",
            details: {
                update: "Enhanced detection rules implemented",
                impact: "Improved security posture against current threats",
                coverage: "Network traffic analysis, endpoint protection, and cloud services",
                changes: "May result in increased alert volume during initial tuning phase",
                actions: "Review new alert types and provide feedback on any false positives"
            },
            trigger: { type: "time", interval: 300000 } // Trigger every 5 minutes
        }
    },
    
    /**
     * Initialize the briefs controller
     */
    init: function() {
        // Subscribe to relevant events
        eventBus.subscribe('event:added', this.handleEventForBrief.bind(this));
        
        // Initialize last brief times
        Object.keys(this.briefLibrary).forEach(briefId => {
            this.lastBriefTimes[this.briefLibrary[briefId].id] = 0;
        });
    },
    
    /**
     * Start generating briefs
     */
    startBriefs: function() {
        // Check for briefs every minute
        this.briefInterval = setInterval(() => {
            this.generateTimedBriefs();
        }, 60000);
    },
    
    /**
     * Stop generating briefs
     */
    stopBriefs: function() {
        clearInterval(this.briefInterval);
        this.briefInterval = null;
    },
    
    /**
     * Generate briefs based on time triggers
     */
    generateTimedBriefs: function() {
        const now = Date.now();
        
        // Check all briefs in library
        Object.values(this.briefLibrary).forEach(brief => {
            if (brief.trigger && brief.trigger.type === "time") {
                // Check if it's time to show this brief (considering cooldown)
                if (now - this.lastBriefTimes[brief.id] >= brief.trigger.interval) {
                    this.displayBrief(brief);
                    this.lastBriefTimes[brief.id] = now;
                }
            }
        });
    },
    
    /**
     * Handle an event that might trigger a brief
     * @param {object} data - Event data from the event bus
     */
    handleEventForBrief: function(data) {
        const event = data.event;
        
        // Check for event category briefs
        Object.values(this.briefLibrary).forEach(brief => {
            if (brief.trigger && 
                brief.trigger.type === "event_category" && 
                brief.trigger.category === event.type) {
                
                // Don't show the same brief too frequently (3 min cooldown)
                const now = Date.now();
                if (now - this.lastBriefTimes[brief.id] >= 180000) {
                    this.displayBrief(brief);
                    this.lastBriefTimes[brief.id] = now;
                }
            }
        });
    },
    
    /**
     * Display a brief to the user
     * @param {object} brief - Brief to display
     */
    displayBrief: function(brief) {
        // Basic brief message for brief area
        const shortMessage = `${this.getSeverityIcon(brief.severity)} ${sanitizeString(brief.title)}: ${sanitizeString(brief.message)}`;
        
        // Publish brief message event
        eventBus.publish('brief:new', {
            id: brief.id,
            title: brief.title,
            message: shortMessage,
            briefData: brief, // Include full brief data for modal
            timestamp: new Date().toLocaleTimeString()
        });
    },
    
    /**
     * Get icon for severity level
     * @param {string} severity - Severity level
     * @returns {string} Icon representing severity
     */
    getSeverityIcon: function(severity) {
        switch (severity) {
            case 'critical':
                return '🔴';
            case 'high':
                return '🟠';
            case 'medium':
                return '🟡';
            case 'low':
                return '🔵';
            case 'info':
                return 'ℹ️';
            default:
                return '⚪';
        }
    },
    
    /**
     * Display a custom brief message
     * @param {string} message - Message to display
     * @param {string} title - Title for the brief
     * @param {string} severity - Severity level (critical, high, medium, low, info)
     */
    displayCustomBrief: function(message, title = 'Custom Alert', severity = 'info') {
        // Create a custom brief object
        const customBrief = {
            id: 'custom_' + Date.now(),
            title: title,
            category: "Custom Alert",
            severity: severity,
            message: message,
            details: {
                information: "This is a custom alert generated by the system.",
                actions: "Review the information and take appropriate action if needed."
            }
        };
        
        // Display the brief
        this.displayBrief(customBrief);
    },
    
    /**
     * Get all briefs in a specific category
     * @param {string} category - Category to filter by
     * @returns {array} Briefs in the category
     */
    getBriefsByCategory: function(category) {
        return Object.values(this.briefLibrary).filter(brief => 
            brief.category === category
        );
    },
    
    /**
     * Add a new brief to the library
     * @param {string} briefId - Unique ID for the brief
     * @param {object} brief - Brief definition
     */
    addBrief: function(briefId, brief) {
        this.briefLibrary[briefId] = brief;
        this.lastBriefTimes[brief.id] = 0;
    }
};

export default briefsController;