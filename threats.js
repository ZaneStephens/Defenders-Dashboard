// threats.js - Definitions of all possible threat events
const possibleEvents = [
    // Malicious events with lower likelihood
    {
        type: "login_fail",
        category: "malicious",
        description: "Failed login attempt",
        likelihood: 0.06, // Reduced from 0.1
        baseSeverity: 3,
        domain: "authentication",
        escalation: "account_lockout_simulation",
        remediation: "block_ip, reset_password",
        education: "MITRE ATT&CK T1110: Brute Force. Multiple failed logins suggest credential guessing. Check for unusual IP patterns."
    },
    {
        type: "traffic_spike",
        category: "malicious",
        description: "Sudden traffic spike",
        likelihood: 0.08, // Reduced from 0.15
        baseSeverity: 5,
        domain: "network",
        escalation: "ddos_simulation",
        remediation: "block_ip, rate_limit",
        education: "MITRE ATT&CK T1498: Network Denial of Service. High traffic may indicate a DDoS attack. Monitor bandwidth usage."
    },
    {
        type: "process_spawn",
        category: "malicious",
        description: "Suspicious process spawned",
        likelihood: 0.06, // Reduced from 0.1
        baseSeverity: 7,
        domain: "endpoint",
        escalation: "malware_propagation",
        remediation: "terminate_process, block_ip",
        education: "MITRE ATT&CK T1059: Command and Scripting Interpreter. Indicates potential malware. Investigate process origins."
    },
    {
        type: "dns_query",
        category: "malicious",
        description: "DNS query for unusual domain",
        likelihood: 0.07, // Reduced from 0.12
        baseSeverity: 4,
        domain: "network",
        escalation: "c2_communication",
        remediation: "block_ip, blacklist_domain",
        education: "MITRE ATT&CK T1071: Application Layer Protocol. Suggests command and control. Check domain reputation."
    },
    {
        type: "http_error",
        category: "malicious",
        description: "Elevated HTTP errors",
        likelihood: 0.09, // Reduced from 0.18
        baseSeverity: 3,
        domain: "web",
        escalation: "sql_injection_simulation",
        remediation: "patch_vulnerability, block_ip",
        education: "CVE-2021-44228: Log4j vulnerability. HTTP errors may indicate injection attacks. Patch and monitor."
    },
    {
        type: "unauthorized_access",
        category: "malicious",
        description: "Unauthorized resource access",
        likelihood: 0.05, // Reduced from 0.08
        baseSeverity: 6,
        domain: "access_control",
        escalation: "privilege_escalation",
        remediation: "revoke_access, reset_password",
        education: "MITRE ATT&CK T1078: Valid Accounts. Suggests insider threat or exploit. Audit permissions."
    },
    {
        type: "service_failure",
        category: "malicious",
        description: "Critical service failure",
        likelihood: 0.03, // Reduced from 0.05
        baseSeverity: 8,
        domain: "infrastructure",
        escalation: "ransomware_simulation",
        remediation: "restore_backup, reboot_server",
        education: "MITRE ATT&CK T1486: Data Encrypted for Impact. Indicates ransomware. Isolate and recover."
    },
    {
        type: "sql_injection",
        category: "malicious",
        description: "Potential SQL injection attempt",
        url: () => `/vulnerable-page-${Math.floor(Math.random() * 10)}.php`,
        likelihood: 0.04, // Reduced from 0.07
        baseSeverity: 6,
        domain: "web",
        escalation: "database_compromise",
        remediation: "patch_vulnerability, block_ip",
        education: "MITRE ATT&CK T1190: Exploit Public-Facing Application. SQL injection targets web apps. Patch immediately."
    },
    
    // Noise events with higher likelihood
    {
        type: "normal_activity",
        category: "noise",
        description: "Normal network activity",
        likelihood: 0.3, // Was 0.4
        baseSeverity: 1,
        isNoise: true,
        domain: "network",
        education: "Noise: Routine traffic logged for monitoring. Typically benign unless patterns change."
    },
    {
        type: "routine_login",
        category: "noise",
        description: "Routine user login",
        likelihood: 0.25, // New noise event
        baseSeverity: 1,
        isNoise: true,
        domain: "authentication",
        education: "Noise: Regular user authentication activity. No unusual patterns detected."
    },
    {
        type: "scheduled_backup",
        category: "noise",
        description: "Scheduled system backup",
        likelihood: 0.2, // New noise event
        baseSeverity: 1,
        isNoise: true,
        domain: "infrastructure",
        education: "Noise: Automated backup process running as scheduled. Normal maintenance activity."
    },
    {
        type: "system_update",
        category: "noise",
        description: "System update check",
        likelihood: 0.18, // New noise event
        baseSeverity: 1,
        isNoise: true,
        domain: "infrastructure",
        education: "Noise: Routine check for system updates. Part of normal maintenance cycle."
    },
    
    // False positive events
    {
        type: "false_positive_scan",
        category: "false_positive",
        description: "Port scan from internal testing IP",
        likelihood: 0.1, // Reduced from 0.15
        baseSeverity: 2,
        isFalsePositive: true,
        domain: "network",
        education: "False Positive: Internal vulnerability scan. Logged due to security testing, not a threat."
    },
    {
        type: "dev_testing",
        category: "false_positive",
        description: "Developer testing new feature",
        likelihood: 0.08, // New false positive
        baseSeverity: 2,
        isFalsePositive: true,
        domain: "web",
        education: "False Positive: Developer is testing new features in the staging environment. Expected activity."
    },
    {
        type: "maintenance_restart",
        category: "false_positive",
        description: "Scheduled maintenance restart",
        likelihood: 0.07, // New false positive
        baseSeverity: 2,
        isFalsePositive: true,
        domain: "infrastructure",
        education: "False Positive: Scheduled service restart as part of maintenance window. Expected activity."
    }
];

export default possibleEvents;