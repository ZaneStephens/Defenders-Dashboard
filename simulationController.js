// simulationController.js - Handles attack simulations when events are missed
import eventBus from './eventBus.js';
import { sanitizeString } from './utils.js';

/**
 * SimulationController handles visualizing attack paths when events are missed
 */
const simulationController = {
    // Currently running simulation
    currentSimulation: null,
    
    // Library of simulation definitions by event type
    simulationLibrary: {
        // Login failure attack path
        login_fail: {
            title: "Brute Force Attack Simulation",
            description: "This simulation shows how a brute force attack progresses when initial login failures are not addressed.",
            icon: "🔑",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "reconnaissance",
                    title: "Reconnaissance",
                    description: "Attacker identifies potential targets by scanning for exposed login portals.",
                    technicalDetails: "Automated tools scan IP ranges for common login pages (SSH, RDP, web applications, VPN).",
                    mitreTactic: "TA0043: Reconnaissance",
                    mitreTechnique: "T1592: Gather Victim Host Information",
                    indicators: "Multiple connection attempts from external IP addresses",
                    prevention: "Limit publicly exposed login interfaces and implement network monitoring",
                    icon: "🔍"
                },
                {
                    id: "credential-access",
                    title: "Credential Access",
                    description: "Attacker uses automated tools to attempt password guessing against known usernames.",
                    technicalDetails: "Dictionary and brute force attacks against common usernames, focusing on admin accounts.",
                    mitreTactic: "TA0006: Credential Access",
                    mitreTechnique: "T1110: Brute Force",
                    indicators: "Multiple failed login attempts for the same username",
                    prevention: "Implement account lockout policies and multi-factor authentication",
                    icon: "🔐"
                },
                {
                    id: "initial-access",
                    title: "Initial Access",
                    description: "After successful password guess, attacker gains initial access to the system.",
                    technicalDetails: "Attacker logs in with compromised credentials, establishing first foothold.",
                    mitreTactic: "TA0001: Initial Access",
                    mitreTechnique: "T1078: Valid Accounts",
                    indicators: "Successful login from unusual location or time",
                    prevention: "Monitor for unusual login patterns and enforce strong password policies",
                    icon: "🚪"
                },
                {
                    id: "privilege-escalation",
                    title: "Privilege Escalation",
                    description: "Attacker elevates privileges to gain greater system access.",
                    technicalDetails: "Using compromised account to exploit local vulnerabilities or access sensitive information.",
                    mitreTactic: "TA0004: Privilege Escalation",
                    mitreTechnique: "T1068: Exploitation for Privilege Escalation",
                    indicators: "Unusual permission changes or privilege use",
                    prevention: "Implement principle of least privilege and monitor privileged operations",
                    icon: "⬆️"
                },
                {
                    id: "impact",
                    title: "Impact",
                    description: "Attacker uses elevated access to achieve objectives - data theft, ransomware, or establishing persistence.",
                    technicalDetails: "Sensitive data exfiltration, deployment of additional malware, or system compromise.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1486: Data Encrypted for Impact",
                    indicators: "Unexpected data transfers, system changes, or performance issues",
                    prevention: "Implement data loss prevention and continuous monitoring",
                    icon: "💥"
                }
            ]
        },
        
        // DNS query attack path
        dns_query: {
            title: "Command & Control Communication Simulation",
            description: "This simulation shows how malware communicates with command and control servers using DNS.",
            icon: "📡",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "delivery",
                    title: "Initial Infection",
                    description: "System is infected with malware through phishing, drive-by download, or other infection vector.",
                    technicalDetails: "Malware executable or script is downloaded and executed on the victim system.",
                    mitreTactic: "TA0002: Execution",
                    mitreTechnique: "T1204: User Execution",
                    indicators: "Unusual process activity or file creation",
                    prevention: "Implement email filtering, content scanning, and user awareness training",
                    icon: "📧"
                },
                {
                    id: "command-and-control",
                    title: "Command & Control Establishment",
                    description: "Malware attempts to contact its command and control (C2) server to receive instructions.",
                    technicalDetails: "DNS queries to malicious domains are used to locate active C2 infrastructure.",
                    mitreTactic: "TA0011: Command and Control",
                    mitreTechnique: "T1071.004: Application Layer Protocol: DNS",
                    indicators: "DNS queries to unusual or newly registered domains",
                    prevention: "Implement DNS monitoring and filtering, use threat intelligence for domain reputation",
                    icon: "🌐"
                },
                {
                    id: "communication",
                    title: "Covert Communication",
                    description: "Malware establishes encrypted or obfuscated communication channel with C2 server.",
                    technicalDetails: "Data may be encoded in DNS queries or responses, or encrypted HTTP/HTTPS traffic.",
                    mitreTactic: "TA0011: Command and Control",
                    mitreTechnique: "T1132: Data Encoding",
                    indicators: "Unusual patterns in DNS traffic or encrypted communications",
                    prevention: "Deploy network monitoring and anomaly detection systems",
                    icon: "🔄"
                },
                {
                    id: "actions",
                    title: "Actions on Objectives",
                    description: "Attacker sends commands through C2 channel to perform malicious actions.",
                    technicalDetails: "Commands may include data theft, lateral movement, or further system compromise.",
                    mitreTactic: "TA0009: Collection",
                    mitreTechnique: "T1005: Data from Local System",
                    indicators: "Unusual system behavior, data access patterns, or outbound connections",
                    prevention: "Implement behavior monitoring and data loss prevention",
                    icon: "📤"
                },
                {
                    id: "exfiltration",
                    title: "Data Exfiltration",
                    description: "Stolen data is sent back to attacker through the C2 channel.",
                    technicalDetails: "Data may be chunked, compressed, and encrypted before exfiltration.",
                    mitreTactic: "TA0010: Exfiltration",
                    mitreTechnique: "T1048: Exfiltration Over Alternative Protocol",
                    indicators: "Large or unusual outbound data transfers",
                    prevention: "Implement egress filtering and data loss prevention systems",
                    icon: "💾"
                }
            ]
        },
        
        // Traffic spike attack path
        traffic_spike: {
            title: "DDoS Attack Simulation",
            description: "This simulation shows how a Distributed Denial of Service (DDoS) attack overwhelms systems and causes service disruption.",
            icon: "🌊",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "preparation",
                    title: "Attack Preparation",
                    description: "Attacker assembles resources for the attack, often using a botnet of compromised systems.",
                    technicalDetails: "Thousands of compromised devices are coordinated for simultaneous attack execution.",
                    mitreTactic: "TA0042: Resource Development",
                    mitreTechnique: "T1583: Acquire Infrastructure",
                    indicators: "Reconnaissance scanning or small probing attacks",
                    prevention: "Monitor for scanning activities and implement threat intelligence",
                    icon: "🤖"
                },
                {
                    id: "initial-surge",
                    title: "Initial Traffic Surge",
                    description: "Attack begins with increasing traffic directed at target systems.",
                    technicalDetails: "Traffic gradually increases to avoid triggering immediate detection thresholds.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1498: Network Denial of Service",
                    indicators: "Unusual traffic patterns or increasing network load",
                    prevention: "Implement baseline monitoring and traffic analysis",
                    icon: "📈"
                },
                {
                    id: "saturation",
                    title: "Resource Saturation",
                    description: "Target's resources become overwhelmed as attack reaches full intensity.",
                    technicalDetails: "Network bandwidth, server connections, or application resources are exhausted.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1499: Endpoint Denial of Service",
                    indicators: "System performance degradation, connection timeouts",
                    prevention: "Implement rate limiting and resource protection mechanisms",
                    icon: "⚠️"
                },
                {
                    id: "service-disruption",
                    title: "Service Disruption",
                    description: "Services become unavailable to legitimate users as systems fail under load.",
                    technicalDetails: "Web services crash, network connections fail, or applications become unresponsive.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1498: Network Denial of Service",
                    indicators: "Service outages, error responses, and user complaints",
                    prevention: "Implement DoS protection services and redundant infrastructure",
                    icon: "❌"
                },
                {
                    id: "persistence",
                    title: "Attack Persistence",
                    description: "Attack continues or adapts to bypass mitigation attempts.",
                    technicalDetails: "Attack methods may change to target different vulnerabilities or bypass defenses.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1498: Network Denial of Service",
                    indicators: "Changing attack patterns or continued service disruption",
                    prevention: "Work with ISP for upstream filtering and implement adaptive defenses",
                    icon: "🔄"
                }
            ]
        },
        
        // Process spawn attack path
        process_spawn: {
            title: "Malware Execution Simulation",
            description: "This simulation shows how malware executes and establishes persistence on a compromised system.",
            icon: "⚙️",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "initial-execution",
                    title: "Initial Execution",
                    description: "Malware binary or script is executed on the victim system.",
                    technicalDetails: "Process is spawned through user action, vulnerability exploitation, or scheduled task.",
                    mitreTactic: "TA0002: Execution",
                    mitreTechnique: "T1059: Command and Scripting Interpreter",
                    indicators: "Unusual process creation or unexpected child processes",
                    prevention: "Implement application whitelisting and behavior monitoring",
                    icon: "▶️"
                },
                {
                    id: "defense-evasion",
                    title: "Defense Evasion",
                    description: "Malware attempts to evade detection by security tools.",
                    technicalDetails: "May use obfuscation, encryption, or anti-analysis techniques to avoid detection.",
                    mitreTactic: "TA0005: Defense Evasion",
                    mitreTechnique: "T1027: Obfuscated Files or Information",
                    indicators: "Suspicious file operations or memory patterns",
                    prevention: "Use advanced endpoint protection with behavioral analysis",
                    icon: "🛡️"
                },
                {
                    id: "persistence",
                    title: "Persistence Establishment",
                    description: "Malware ensures it will continue running after system restarts.",
                    technicalDetails: "Creates registry entries, scheduled tasks, or service modifications.",
                    mitreTactic: "TA0003: Persistence",
                    mitreTechnique: "T1053: Scheduled Task/Job",
                    indicators: "Changes to autostart locations or scheduled tasks",
                    prevention: "Monitor system configuration changes and autostart locations",
                    icon: "🔄"
                },
                {
                    id: "privilege-escalation",
                    title: "Privilege Escalation",
                    description: "Malware attempts to gain higher-level permissions.",
                    technicalDetails: "Exploits vulnerabilities or misconfigurations to obtain elevated privileges.",
                    mitreTactic: "TA0004: Privilege Escalation",
                    mitreTechnique: "T1068: Exploitation for Privilege Escalation",
                    indicators: "Unexpected privilege changes or exploitation attempts",
                    prevention: "Implement principle of least privilege and keep systems patched",
                    icon: "⬆️"
                },
                {
                    id: "lateral-movement",
                    title: "Lateral Movement",
                    description: "Malware spreads to other systems in the network.",
                    technicalDetails: "Uses network shares, remote services, or stolen credentials to infect additional systems.",
                    mitreTactic: "TA0008: Lateral Movement",
                    mitreTechnique: "T1021: Remote Services",
                    indicators: "Unexpected network connections or authentication attempts",
                    prevention: "Implement network segmentation and monitor for unusual connections",
                    icon: "➡️"
                }
            ]
        },
        
        // Unauthorized access attack path
        unauthorized_access: {
            title: "Data Breach Simulation",
            description: "This simulation shows how an attacker accesses unauthorized resources leading to data theft.",
            icon: "🔓",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "initial-access",
                    title: "Initial Access",
                    description: "Attacker gains initial access to the network or system.",
                    technicalDetails: "May use stolen credentials, phishing, or exploiting vulnerabilities.",
                    mitreTactic: "TA0001: Initial Access",
                    mitreTechnique: "T1078: Valid Accounts",
                    indicators: "Login from unusual location or outside business hours",
                    prevention: "Implement multi-factor authentication and account monitoring",
                    icon: "🚪"
                },
                {
                    id: "discovery",
                    title: "Internal Reconnaissance",
                    description: "Attacker maps the network to identify valuable resources.",
                    technicalDetails: "Network scanning, directory services queries, and file system enumeration.",
                    mitreTactic: "TA0007: Discovery",
                    mitreTechnique: "T1083: File and Directory Discovery",
                    indicators: "Unusual directory queries or network scanning activity",
                    prevention: "Implement network monitoring and behavior analytics",
                    icon: "🔍"
                },
                {
                    id: "privilege-escalation",
                    title: "Access Elevation",
                    description: "Attacker obtains higher privileges to access protected resources.",
                    technicalDetails: "Privilege escalation or stealing credentials with resource access.",
                    mitreTactic: "TA0004: Privilege Escalation",
                    mitreTechnique: "T1068: Exploitation for Privilege Escalation",
                    indicators: "Unusual privilege changes or credential access",
                    prevention: "Implement least privilege principle and privileged access management",
                    icon: "⬆️"
                },
                {
                    id: "collection",
                    title: "Data Location & Access",
                    description: "Attacker identifies and accesses sensitive data repositories.",
                    technicalDetails: "Queries databases, accesses file shares, or reads email stores.",
                    mitreTactic: "TA0009: Collection",
                    mitreTechnique: "T1213: Data from Information Repositories",
                    indicators: "Unusual data access patterns or volume",
                    prevention: "Implement data access controls and monitoring",
                    icon: "📁"
                },
                {
                    id: "exfiltration",
                    title: "Data Exfiltration",
                    description: "Attacker transfers sensitive data outside the organization.",
                    technicalDetails: "Uses encrypted channels, cloud storage, or email to extract data.",
                    mitreTactic: "TA0010: Exfiltration",
                    mitreTechnique: "T1048: Exfiltration Over Alternative Protocol",
                    indicators: "Unusual outbound data transfers or connections",
                    prevention: "Implement data loss prevention and egress monitoring",
                    icon: "📤"
                }
            ]
        },
        
        // Service failure attack path
        service_failure: {
            title: "Ransomware Attack Simulation",
            description: "This simulation shows how a ransomware attack progresses, causing service disruptions and data encryption.",
            icon: "🔒",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "initial-access",
                    title: "Initial Access",
                    description: "Attacker gains entry through vulnerable services, phishing, or compromised credentials.",
                    technicalDetails: "Exploitation of public-facing applications or social engineering tactics.",
                    mitreTactic: "TA0001: Initial Access",
                    mitreTechnique: "T1190: Exploit Public-Facing Application",
                    indicators: "Unusual login attempts or exploitation signatures",
                    prevention: "Patch systems regularly and implement multi-factor authentication",
                    icon: "🚪"
                },
                {
                    id: "execution",
                    title: "Ransomware Deployment",
                    description: "Malicious code is executed on targeted systems.",
                    technicalDetails: "Ransomware binary executes and begins preparation for encryption.",
                    mitreTactic: "TA0002: Execution",
                    mitreTechnique: "T1204: User Execution",
                    indicators: "Unusual process execution or script activity",
                    prevention: "Implement application control and behavior monitoring",
                    icon: "⚙️"
                },
                {
                    id: "persistence",
                    title: "System Preparation",
                    description: "Ransomware ensures it can complete its encryption operation.",
                    technicalDetails: "Terminates security services, deletes backups, and disables recovery features.",
                    mitreTactic: "TA0003: Persistence",
                    mitreTechnique: "T1486: Data Encrypted for Impact",
                    indicators: "System service terminations or shadow copy deletion",
                    prevention: "Monitor for suspicious service operations and backup tampering",
                    icon: "🔨"
                },
                {
                    id: "impact",
                    title: "Data Encryption",
                    description: "Files are encrypted across accessible systems and shares.",
                    technicalDetails: "Strong encryption is applied to files with targeted extensions.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1486: Data Encrypted for Impact",
                    indicators: "High disk activity or file extension changes",
                    prevention: "Implement file activity monitoring and backup solutions",
                    icon: "🔒"
                },
                {
                    id: "ransom",
                    title: "Ransom Demand",
                    description: "Attacker demands payment in exchange for decryption keys.",
                    technicalDetails: "Ransom notes are displayed and services are unavailable.",
                    mitreTactic: "TA0040: Impact",
                    mitreTechnique: "T1491: Defacement",
                    indicators: "Ransom notes and inaccessible systems",
                    prevention: "Maintain offline backups and develop incident response plans",
                    icon: "💰"
                }
            ]
        },
        
        // HTTP error attack path
        http_error: {
            title: "Web Application Attack Simulation",
            description: "This simulation shows how attackers exploit web vulnerabilities to compromise applications and data.",
            icon: "🌐",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "reconnaissance",
                    title: "Web Reconnaissance",
                    description: "Attacker scans and probes the web application for vulnerabilities.",
                    technicalDetails: "Tests various inputs, parameters, and endpoints to identify potential flaws.",
                    mitreTactic: "TA0043: Reconnaissance",
                    mitreTechnique: "T1595: Active Scanning",
                    indicators: "Unusual HTTP requests or error responses",
                    prevention: "Implement web application firewall and request monitoring",
                    icon: "🔍"
                },
                {
                    id: "vulnerability-discovery",
                    title: "Vulnerability Identification",
                    description: "Attacker identifies specific vulnerabilities in the application.",
                    technicalDetails: "Discovers input validation flaws, misconfigurations, or outdated components.",
                    mitreTactic: "TA0043: Reconnaissance",
                    mitreTechnique: "T1592: Gather Victim Host Information",
                    indicators: "HTTP errors or anomalous response patterns",
                    prevention: "Regular vulnerability scanning and code review",
                    icon: "⚠️"
                },
                {
                    id: "exploitation",
                    title: "Exploitation",
                    description: "Attacker exploits identified vulnerabilities to gain system access.",
                    technicalDetails: "May use SQL injection, cross-site scripting, or other web attack techniques.",
                    mitreTactic: "TA0001: Initial Access",
                    mitreTechnique: "T1190: Exploit Public-Facing Application",
                    indicators: "Malformed requests or unexpected server behavior",
                    prevention: "Implement secure coding practices and input validation",
                    icon: "⚡"
                },
                {
                    id: "escalation",
                    title: "Privilege Escalation",
                    description: "Attacker expands access within the application or server.",
                    technicalDetails: "Exploits additional flaws or configuration weaknesses to gain higher privileges.",
                    mitreTactic: "TA0004: Privilege Escalation",
                    mitreTechnique: "T1068: Exploitation for Privilege Escalation",
                    indicators: "Unauthorized access to admin functions or files",
                    prevention: "Implement least privilege principle and application monitoring",
                    icon: "⬆️"
                },
                {
                    id: "data-access",
                    title: "Data Access & Extraction",
                    description: "Attacker accesses and exfiltrates sensitive data from the application.",
                    technicalDetails: "Queries databases, downloads files, or captures user information.",
                    mitreTactic: "TA0009: Collection",
                    mitreTechnique: "T1213: Data from Information Repositories",
                    indicators: "Unusual database queries or data transfers",
                    prevention: "Encrypt sensitive data and monitor database activity",
                    icon: "📤"
                }
            ]
        },
        
        // SQL injection attack path
        sql_injection: {
            title: "SQL Injection Attack Simulation",
            description: "This simulation shows how SQL injection attacks compromise database security and access sensitive data.",
            icon: "💉",
            framework: "MITRE ATT&CK",
            steps: [
                {
                    id: "discovery",
                    title: "Vulnerability Discovery",
                    description: "Attacker identifies SQL injection vulnerabilities in web applications.",
                    technicalDetails: "Tests input fields with SQL syntax to detect improper input handling.",
                    mitreTactic: "TA0043: Reconnaissance",
                    mitreTechnique: "T1595: Active Scanning",
                    indicators: "Unusual characters in web requests or database errors",
                    prevention: "Implement proper input validation and parameterized queries",
                    icon: "🔍"
                },
                {
                    id: "exploitation",
                    title: "Initial Exploitation",
                    description: "Attacker exploits the vulnerability to execute unauthorized SQL commands.",
                    technicalDetails: "Injects SQL commands that alter query logic to bypass authentication or reveal data.",
                    mitreTactic: "TA0001: Initial Access",
                    mitreTechnique: "T1190: Exploit Public-Facing Application",
                    indicators: "SQL syntax in request parameters or unexpected query results",
                    prevention: "Use prepared statements and ORM frameworks",
                    icon: "⚡"
                },
                {
                    id: "schema-mapping",
                    title: "Database Enumeration",
                    description: "Attacker maps the database structure to locate sensitive data.",
                    technicalDetails: "Queries information_schema or other metadata tables to discover tables and columns.",
                    mitreTactic: "TA0007: Discovery",
                    mitreTechnique: "T1082: System Information Discovery",
                    indicators: "Queries for database metadata or schema information",
                    prevention: "Implement least privilege database accounts and query monitoring",
                    icon: "🗺️"
                },
                {
                    id: "data-extraction",
                    title: "Data Extraction",
                    description: "Attacker extracts sensitive data from the database.",
                    technicalDetails: "Uses UNION or other SQL commands to retrieve and extract data records.",
                    mitreTactic: "TA0009: Collection",
                    mitreTechnique: "T1213: Data from Information Repositories",
                    indicators: "Large or unusual query results or data exfiltration",
                    prevention: "Encrypt sensitive data and implement data loss prevention",
                    icon: "📤"
                },
                {
                    id: "persistence",
                    title: "Advanced Attack",
                    description: "Attacker may attempt to gain further system access or maintain persistence.",
                    technicalDetails: "May use advanced SQL injection techniques to write files, execute code, or modify database content.",
                    mitreTactic: "TA0003: Persistence",
                    mitreTechnique: "T1505: Server Software Component",
                    indicators: "Database modifications or unexpected file operations",
                    prevention: "Implement database activity monitoring and web application firewall",
                    icon: "🔨"
                }
            ]
        }
    },
    
    /**
     * Initialize the simulation controller
     */
    init: function() {
        // Subscribe to event escalations
        eventBus.subscribe('events:escalated', this.handleEscalatedEvents.bind(this));
    },
    
    /**
     * Handle escalated events
     * @param {object} data - Escalated events data from event bus
     */
    handleEscalatedEvents: function(data) {
        // Get the first event to simulate (we'll only simulate one at a time)
        const event = data.events[0];
        if (!event) return;
        
        // Start simulation for the event
        this.startSimulation(event);
    },
    
    /**
     * Start a simulation for an event
     * @param {object} event - The event to simulate
     */
    startSimulation: function(event) {
        // Get simulation for event type
        const simulation = this.getSimulationForEvent(event);
        if (!simulation) {
            console.warn(`No simulation available for event type: ${event.type}`);
            return;
        }
        
        // Set as current simulation
        this.currentSimulation = {
            event: event,
            simulation: simulation,
            currentStep: 0
        };
        
        // Display simulation modal
        this.displaySimulationModal();
    },
    
    /**
     * Get simulation data for an event
     * @param {object} event - Event to get simulation for
     * @returns {object|null} Simulation data or null if not available
     */
    getSimulationForEvent: function(event) {
        // Get simulation for event type or use a default
        return this.simulationLibrary[event.type] || null;
    },
    
    /**
     * Display the simulation modal
     */
    displaySimulationModal: function() {
        if (!this.currentSimulation) return;
        
        const simulation = this.currentSimulation.simulation;
        
        // Create modal wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'simulation-modal-wrapper';
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        wrapper.style.zIndex = '10000';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'simulation-modal';
        modal.style.backgroundColor = '#1a1f2e';
        modal.style.borderRadius = '10px';
        modal.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        modal.style.width = '90%';
        modal.style.maxWidth = '900px';
        modal.style.maxHeight = '90vh';
        modal.style.overflow = 'auto';
        modal.style.padding = '20px';
        modal.style.color = '#e0e6ed';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'simulation-header';
        header.style.borderBottom = '1px solid #4a5270';
        header.style.paddingBottom = '15px';
        header.style.marginBottom = '20px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        const title = document.createElement('h2');
        title.textContent = `${simulation.icon} ${sanitizeString(simulation.title)}`;
        title.style.margin = '0';
        title.style.color = '#e0e6ed';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#e0e6ed';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.setAttribute('aria-label', 'Close simulation');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(wrapper);
            eventBus.publish('ui:startGame');
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create description
        const description = document.createElement('p');
        description.textContent = sanitizeString(simulation.description);
        description.style.fontSize = '16px';
        description.style.marginBottom = '20px';
        
        // Create steps container
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'simulation-steps';
        stepsContainer.style.display = 'flex';
        stepsContainer.style.flexDirection = 'column';
        stepsContainer.style.gap = '15px';
        
        // Add steps indicators
        const stepIndicators = document.createElement('div');
        stepIndicators.className = 'step-indicators';
        stepIndicators.style.display = 'flex';
        stepIndicators.style.justifyContent = 'space-between';
        stepIndicators.style.marginBottom = '20px';
        
        simulation.steps.forEach((step, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'step-indicator';
            indicator.dataset.step = index;
            indicator.style.flex = '1';
            indicator.style.textAlign = 'center';
            indicator.style.padding = '10px';
            indicator.style.borderBottom = '3px solid #4a5270';
            indicator.style.cursor = 'pointer';
            indicator.style.transition = 'all 0.3s ease';
            
            if (index === this.currentSimulation.currentStep) {
                indicator.style.borderBottom = '3px solid #007bff';
                indicator.style.color = '#ffffff';
            }
            
            indicator.innerHTML = `${step.icon}<br>${sanitizeString(step.title)}`;
            
            indicator.addEventListener('click', () => {
                this.goToStep(index);
            });
            
            stepIndicators.appendChild(indicator);
        });
        
        // Create current step content
        const stepContent = document.createElement('div');
        stepContent.className = 'step-content';
        this.updateStepContent(stepContent);
        
        // Create navigation buttons
        const navButtons = document.createElement('div');
        navButtons.className = 'navigation-buttons';
        navButtons.style.display = 'flex';
        navButtons.style.justifyContent = 'space-between';
        navButtons.style.marginTop = '20px';
        
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous Step';
        prevButton.className = 'nav-button prev-button';
        prevButton.style.padding = '10px 15px';
        prevButton.style.backgroundColor = '#3a4060';
        prevButton.style.color = '#e0e6ed';
        prevButton.style.border = 'none';
        prevButton.style.borderRadius = '5px';
        prevButton.style.cursor = 'pointer';
        
        if (this.currentSimulation.currentStep === 0) {
            prevButton.disabled = true;
            prevButton.style.opacity = '0.5';
            prevButton.style.cursor = 'not-allowed';
        }
        
        prevButton.addEventListener('click', () => {
            this.previousStep(stepContent, stepIndicators, prevButton, nextButton);
        });
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next Step →';
        nextButton.className = 'nav-button next-button';
        nextButton.style.padding = '10px 15px';
        nextButton.style.backgroundColor = '#007bff';
        nextButton.style.color = '#ffffff';
        nextButton.style.border = 'none';
        nextButton.style.borderRadius = '5px';
        nextButton.style.cursor = 'pointer';
        
        if (this.currentSimulation.currentStep === simulation.steps.length - 1) {
            nextButton.textContent = 'Finish Simulation';
        }
        
        nextButton.addEventListener('click', () => {
            if (this.currentSimulation.currentStep === simulation.steps.length - 1) {
                document.body.removeChild(wrapper);
                eventBus.publish('ui:startGame');
                return;
            }
            
            this.nextStep(stepContent, stepIndicators, prevButton, nextButton);
        });
        
        navButtons.appendChild(prevButton);
        navButtons.appendChild(nextButton);
        
        // Assemble modal content
        modal.appendChild(header);
        modal.appendChild(description);
        modal.appendChild(stepIndicators);
        modal.appendChild(stepContent);
        modal.appendChild(navButtons);
        
        // Add to DOM
        wrapper.appendChild(modal);
        document.body.appendChild(wrapper);
        
        // Pause the game while showing simulation
        eventBus.publish('ui:pauseGame');
    },
    
    /**
     * Update the step content in the modal
     * @param {Element} stepContent - Step content element to update
     */
    updateStepContent: function(stepContent) {
        if (!this.currentSimulation || !stepContent) return;
        
        const step = this.currentSimulation.simulation.steps[this.currentSimulation.currentStep];
        
        // Clear current content
        stepContent.innerHTML = '';
        
        // Create step details
        stepContent.style.backgroundColor = '#2d3345';
        stepContent.style.borderRadius = '8px';
        stepContent.style.padding = '20px';
        
        const stepTitle = document.createElement('h3');
        stepTitle.textContent = `${step.icon} ${sanitizeString(step.title)}`;
        stepTitle.style.color = '#ffffff';
        stepTitle.style.marginTop = '0';
        
        const stepDescription = document.createElement('p');
        stepDescription.textContent = sanitizeString(step.description);
        stepDescription.style.fontSize = '16px';
        
        const detailsGrid = document.createElement('div');
        detailsGrid.className = 'details-grid';
        detailsGrid.style.display = 'grid';
        detailsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        detailsGrid.style.gap = '15px';
        detailsGrid.style.marginTop = '20px';
        
        // Add details
        const details = [
            { label: 'MITRE Tactic', content: sanitizeString(step.mitreTactic) },
            { label: 'MITRE Technique', content: sanitizeString(step.mitreTechnique) },
            { label: 'Indicators', content: sanitizeString(step.indicators) },
            { label: 'Prevention', content: sanitizeString(step.prevention) }
        ];
        
        details.forEach(detail => {
            const detailBox = document.createElement('div');
            detailBox.className = 'detail-box';
            detailBox.style.backgroundColor = '#1a1f2e';
            detailBox.style.borderRadius = '5px';
            detailBox.style.padding = '10px';
            
            const detailLabel = document.createElement('div');
            detailLabel.className = 'detail-label';
            detailLabel.textContent = detail.label;
            detailLabel.style.fontWeight = 'bold';
            detailLabel.style.color = '#b0b7c3';
            detailLabel.style.marginBottom = '5px';
            
            const detailContent = document.createElement('div');
            detailContent.className = 'detail-content';
            detailContent.textContent = detail.content;
            
            detailBox.appendChild(detailLabel);
            detailBox.appendChild(detailContent);
            detailsGrid.appendChild(detailBox);
        });
        
        // Add technical details section
        const technicalDetails = document.createElement('div');
        technicalDetails.className = 'technical-details';
        technicalDetails.style.backgroundColor = '#1a1f2e';
        technicalDetails.style.borderRadius = '5px';
        technicalDetails.style.padding = '15px';
        technicalDetails.style.marginTop = '20px';
        
        const techLabel = document.createElement('div');
        techLabel.className = 'tech-label';
        techLabel.textContent = 'Technical Details';
        techLabel.style.fontWeight = 'bold';
        techLabel.style.color = '#b0b7c3';
        techLabel.style.marginBottom = '10px';
        
        const techContent = document.createElement('div');
        techContent.className = 'tech-content';
        techContent.textContent = sanitizeString(step.technicalDetails);
        
        technicalDetails.appendChild(techLabel);
        technicalDetails.appendChild(techContent);
        
        // Assemble step content
        stepContent.appendChild(stepTitle);
        stepContent.appendChild(stepDescription);
        stepContent.appendChild(detailsGrid);
        stepContent.appendChild(technicalDetails);
    },
    
    /**
     * Go to a specific step
     * @param {number} stepIndex - Index of step to go to
     */
    goToStep: function(stepIndex) {
        if (!this.currentSimulation) return;
        
        // Ensure step index is valid
        const totalSteps = this.currentSimulation.simulation.steps.length;
        if (stepIndex < 0 || stepIndex >= totalSteps) return;
        
        // Update current step
        this.currentSimulation.currentStep = stepIndex;
        
        // Update UI
        const stepContent = document.querySelector('.step-content');
        const stepIndicators = document.querySelectorAll('.step-indicator');
        const prevButton = document.querySelector('.prev-button');
        const nextButton = document.querySelector('.next-button');
        
        if (stepContent) this.updateStepContent(stepContent);
        
        // Update step indicators
        stepIndicators.forEach((indicator, index) => {
            if (index === stepIndex) {
                indicator.style.borderBottom = '3px solid #007bff';
                indicator.style.color = '#ffffff';
            } else {
                indicator.style.borderBottom = '3px solid #4a5270';
                indicator.style.color = '#b0b7c3';
            }
        });
        
        // Update navigation buttons
        if (prevButton) {
            prevButton.disabled = stepIndex === 0;
            prevButton.style.opacity = stepIndex === 0 ? '0.5' : '1';
            prevButton.style.cursor = stepIndex === 0 ? 'not-allowed' : 'pointer';
        }
        
        if (nextButton) {
            nextButton.textContent = stepIndex === totalSteps - 1 ? 'Finish Simulation' : 'Next Step →';
        }
    },
    
    /**
     * Go to next step
     * @param {Element} stepContent - Step content element
     * @param {NodeList} stepIndicators - Step indicator elements
     * @param {Element} prevButton - Previous button element
     * @param {Element} nextButton - Next button element
     */
    nextStep: function(stepContent, stepIndicators, prevButton, nextButton) {
        if (!this.currentSimulation) return;
        
        const totalSteps = this.currentSimulation.simulation.steps.length;
        const newStep = this.currentSimulation.currentStep + 1;
        
        if (newStep < totalSteps) {
            this.goToStep(newStep);
        }
    },
    
    /**
     * Go to previous step
     * @param {Element} stepContent - Step content element
     * @param {NodeList} stepIndicators - Step indicator elements
     * @param {Element} prevButton - Previous button element
     * @param {Element} nextButton - Next button element
     */
    previousStep: function(stepContent, stepIndicators, prevButton, nextButton) {
        if (!this.currentSimulation) return;
        
        const newStep = this.currentSimulation.currentStep - 1;
        
        if (newStep >= 0) {
            this.goToStep(newStep);
        }
    },
    
    /**
     * Add a new simulation to the library
     * @param {string} eventType - Type of event
     * @param {object} simulation - Simulation data
     */
    addSimulation: function(eventType, simulation) {
        this.simulationLibrary[eventType] = simulation;
    }
};

export default simulationController;