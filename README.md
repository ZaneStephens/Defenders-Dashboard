# Defender's Dashboard

A cybersecurity training game that simulates threat detection, incident response, and security operations center activities in an interactive dashboard environment.

![Defender's Dashboard](https://via.placeholder.com/800x400?text=Defender's+Dashboard)

## Table of Contents

Overview
Features
Game Mechanics
Technical Architecture
  Core Components
  Event Flow
  Module Structure
How to Play
Customization
  Adding Custom Threats
  Adding Custom Simulations
Future Improvements
Development
  Setup
  Structure
  Event Bus Architecture
Credits


## Overview

Defender's Dashboard is an interactive cybersecurity training simulation designed to help users develop skills in threat detection, security monitoring, and incident response. The game simulates a security operations center (SOC) environment where players must detect, analyze, and respond to various cybersecurity threats in real-time.

The application features a realistic dashboard interface that tracks network uptime, security events, and player performance through a gamified experience with levels, scores, and educational content based on the MITRE ATT&CK framework.

## Features

- **Real-time Event Simulation**: Generates security events ranging from benign system noise to critical security threats
- **Interactive Dashboard**: Monitor system health, threat timelines, and performance metrics
- **Rule Creation System**: Build custom detection rules to automatically identify and manage threats
- **Threat Intelligence Briefings**: In-game security advisories provide context and educational content
- **Attack Simulations**: Visualize how unmitigated threats could escalate into full attacks
- **Drag-and-Drop Controls**: Intuitive interface for applying security actions to events
- **Performance Tracking**: Score system with level progression based on threat handling speed and accuracy
- **MITRE ATT&CK Integration**: Educational content aligned with industry-standard frameworks
- **Responsive Design**: Works across desktop and tablet devices

## Game Mechanics

### Core Gameplay Loop

1. **Monitor Events**: Security events appear in the alert pane in real-time
2. **Analyze Threats**: Examine event details to determine severity and appropriate response
3. **Respond to Incidents**: Apply appropriate mitigation actions to security events
4. **Create Detection Rules**: Build automated rules to handle recurring threat patterns
5. **Prevent Escalations**: Address critical threats before they escalate and impact system uptime
6. **Advance Levels**: Progress through increasingly challenging scenarios as your skills improve

### Scoring System

Points are awarded based on:
- Successfully handling malicious events
- Response speed (faster responses earn more points)
- Maintaining high network uptime
- Avoiding false positive actions

### Levels

The game features progressive difficulty levels:
1. **Level 1: Basic Scan Detection** - Focus on recognizing basic reconnaissance attempts
2. **Level 2: Exploit Attempts** - Counter exploitation and malware execution attempts
3. **Level 3: Data Exfiltration** - Prevent data breaches and advanced persistent threats

## Technical Architecture

Defender's Dashboard is built using a modular JavaScript architecture with an event-driven design pattern. The application uses vanilla JavaScript and HTML5/CSS3 without external frameworks, making it lightweight and easy to deploy.

### Core Components

#### Game Model

The `gameModel.js` serves as the central state management system, storing:
- Current game state (running/paused)
- Player score and level progression
- Network uptime and health metrics
- Event history and pending threats
- Game settings and difficulty parameters

#### Event Generator

The `eventGenerator.js` module creates randomized security events based on:
- Event templates defined in `threats.js`
- Current level difficulty settings
- Event probability distributions
- Type-specific properties (IPs, usernames, error codes, etc.)

#### Controllers

Multiple controller modules handle specific game aspects:
- `gameController.js`: Main game loop and simulation control
- `ruleEngine.js`: Custom rule creation and evaluation
- `uiController.js`: DOM updates and user interface management
- `simulationController.js`: Attack path visualizations for escalated events 
- `briefsController.js`: Threat intelligence updates and educational content
- `escalationsController.js`: Handles consequences of unmitigated threats

#### Event Bus

The `eventBus.js` provides a central publish/subscribe system for inter-module communication, allowing loosely coupled components to react to game events without direct dependencies.

### Event Flow

1. **Event Generation**: The event generator creates security events based on templates and current level settings
2. **Event Processing**: Generated events are added to the game model and displayed in the UI
3. **Rule Evaluation**: The rule engine checks events against player-created detection rules
4. **Player Interaction**: The player can analyze events and apply mitigation actions
5. **Escalation Check**: Unhandled malicious events may escalate after a timeout period
6. **Consequence Application**: Escalated events affect game metrics like network uptime
7. **State Updates**: Game state changes trigger UI updates through the event bus

### Module Structure

```
- index.html            # Main application HTML
- style.css             # Core styles
- utils.css             # Utility styles and components
- main.js               # Application entry point
- eventBus.js           # Central event publish/subscribe system
- gameModel.js          # Game state and data management
- gameController.js     # Main game logic controller
- eventGenerator.js     # Security event creation
- threats.js            # Event type definitions and templates
- ruleEngine.js         # Custom rule creation and evaluation
- uiController.js       # DOM manipulation and UI updates
- simulationController.js # Attack visualization controller
- escalationsController.js # Threat escalation management
- briefsController.js   # Threat intelligence updates
- themeController.js    # UI theme customization
- utils.js              # Common utility functions
```

## How to Play

1. **Start the Simulation** by clicking the "Start Simulation" button at the bottom of the screen
2. **Monitor the Alert Pane** for incoming security events
3. **Examine Alert Details** by clicking on an alert to view more information
4. **Respond to Threats**:
   - Drag alerts to the Action Console
   - Select an appropriate action (Block IP, Reset Password, Reboot Server)
   - Alternatively, create rules to handle similar events automatically
5. **Create Detection Rules**:
   - Use the Rule Editor to define conditions
   - Test rules against recent events
   - Save effective rules to automate responses
6. **Review Threat Briefs** for intelligence updates and security advisories
7. **Monitor Performance** using the dashboard metrics
8. **Complete Levels** by reaching the target score for each difficulty tier

## Customization

### Adding Custom Threats

To add custom threat types to the game, modify the `threats.js` file by adding new event templates to the `possibleEvents` array:

```javascript
// Example custom threat
{
    type: "custom_threat_type",      // Unique identifier for event type
    category: "malicious",           // "malicious", "noise", or "false_positive"
    description: "Description of threat", // Human-readable description
    likelihood: 0.1,                 // Probability factor (0.0 to 1.0)
    baseSeverity: 5,                 // Severity level (1-10)
    domain: "category_area",         // Domain area (network, web, endpoint, etc.)
    escalation: "escalation_type",   // Escalation scenario identifier
    remediation: "action_type",      // Comma-separated list of effective actions
    education: "Educational context for this threat type" // Learning information
}
```

Important properties to include:
- **type**: Unique identifier used throughout the application
- **category**: Must be "malicious" for actual threats (or "noise"/"false_positive" for non-threats)
- **likelihood**: Controls frequency (higher values appear more often)
- **baseSeverity**: Affects scoring and escalation impact (1-10 scale)
- **escalation**: Must match a simulation type in simulationController.js
- **remediation**: List of actions that will be effective against this threat

### Adding Custom Simulations

To add visualizations for custom threat types, add a new simulation definition to the `simulationLibrary` object in `simulationController.js`:

```javascript
// Example custom simulation
custom_threat_type: {
    title: "Custom Threat Simulation",
    description: "Description of how this attack progresses.",
    icon: "🔍",  // Emoji icon for the simulation
    framework: "MITRE ATT&CK",
    steps: [
        {
            id: "step-one",
            title: "Initial Access",
            description: "Description of the first stage of attack.",
            technicalDetails: "Technical explanation of how this works.",
            mitreTactic: "TA0001: Initial Access",
            mitreTechnique: "T1566: Phishing",
            indicators: "Observable signs of this activity",
            prevention: "How to prevent this step",
            icon: "🚪"
        },
        // Add at least 3-5 steps to show attack progression
        {
            id: "step-two",
            title: "Execution",
            description: "Description of the second stage of attack.",
            technicalDetails: "Technical explanation of how this works.",
            mitreTactic: "TA0002: Execution",
            mitreTechnique: "T1059: Command and Scripting Interpreter",
            indicators: "Observable signs of this activity",
            prevention: "How to prevent this step",
            icon: "⚙️"
        },
        // Additional steps...
    ]
}
```

Important considerations:
- The key (e.g., `custom_threat_type`) must match the `type` field in your threat definition
- Include at least 3-5 steps to properly visualize the attack progression
- Use MITRE ATT&CK references when possible for educational value
- Provide tangible indicators and prevention tips for each step

## Future Improvements

### Gameplay Enhancements

1. **Campaigns and Scenarios**: Add structured attack campaigns with narrative elements and learning objectives
2. **Team Mode**: Allow multiple players to collaborate in handling events
3. **Challenge Modes**: Time-limited events or specific threat hunting exercises
4. **Skill Tracks**: Specialized learning paths (network defense, malware analysis, etc.)
5. **Achievement System**: Recognition for mastering specific security skills

### Technical Enhancements

1. **Real-world Data Integration**: Option to use sanitized real attack patterns
2. **Machine Learning Detection**: Add ML-based detection challenges that require tuning parameters
3. **Performance Optimization**: Improve DOM rendering for large numbers of events
4. **Network Topology Visualization**: Interactive network map showing affected systems
5. **Analysis Tools**: Built-in packet analysis, log search, and SIEM-like features
6. **Internationalization**: Multi-language support for global use
7. **Offline Mode**: Service worker implementation for offline functionality
8. **Account System**: Save player progress across sessions
9. **Customization Tools**: GUI for adding custom threats without editing code

### Educational Improvements

1. **Expanded MITRE Framework Content**: More detailed mappings to ATT&CK techniques
2. **Guided Tutorials**: Step-by-step tutorials for beginners
3. **Documentation Library**: In-game reference materials on security concepts
4. **Certification Training Alignment**: Scenarios mapped to industry certification objectives
5. **Assessment Tools**: Skills evaluation and personalized improvement suggestions

## Development

### Setup

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies required

### Structure

The application follows a modular design pattern with clear separation of concerns:
- **Model**: Game state and data management (`gameModel.js`)
- **View**: UI rendering and DOM manipulation (`uiController.js`)
- **Controller**: Game logic and event handling (various controller modules)

The event bus architecture allows for loose coupling between components, making the codebase more maintainable and extensible.

### Event Bus Architecture

The application uses a publish/subscribe pattern through the `eventBus.js` module:

```javascript
// Subscribe to an event
eventBus.subscribe('event:name', function(data) {
    // Handle event with data
});

// Publish an event
eventBus.publish('event:name', { 
    // Event data
});
```

This architecture makes it easy to extend the application with new features without modifying existing code.

## Credits

Defender's Dashboard was created as an educational tool for cybersecurity training, incorporating industry best practices and frameworks.

- Game mechanics and simulation based on real-world SOC operations
- Threat modeling aligned with MITRE ATT&CK framework
- Educational content drawn from industry security standards
