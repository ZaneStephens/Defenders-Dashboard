// uiController.js - Handles UI updates and interactions
import eventBus from './eventBus.js';
import gameModel from './gameModel.js';
import ruleEngine from './ruleEngine.js';
import { sanitizeString, debounce, throttle } from './utils.js';

const uiController = {
    // DOM element references
    elements: {
        alertList: null,
        briefArea: null,
        trafficGraph: {
            canvas: null,
            context: null
        },
        logDetails: null,
        logDetailContent: null,
        ruleForm: null,
        debriefScreen: null,
        actionButtons: null,
        draggedAlert: null,
        notifications: null
    },
    
    /**
     * Initialize the UI controller
     */
    init: function() {
        // Cache DOM elements
        this.cacheElements();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Subscribe to event bus events
        this.subscribeToEvents();
        
        // Initialize security dashboard
        this.initSecurityDashboard();
        
        console.log('UI controller initialized.');
    },
    
    /**
     * Cache all required DOM elements
     */
    cacheElements: function() {
        // Main UI sections
        this.elements.alertList = document.getElementById('alert-list');
        this.elements.briefArea = document.getElementById('brief-area');
        this.elements.logDetails = document.getElementById('log-details');
        this.elements.logDetailContent = document.getElementById('log-detail-content');
        this.elements.debriefScreen = document.getElementById('debrief-screen');
        this.elements.debriefStatsArea = document.getElementById('debrief-stats');
        
        // Security Dashboard Elements
        this.elements.dashboard = {
            uptimeValue: document.getElementById('uptime-value'),
            uptimeIndicator: document.getElementById('uptime-indicator'),
            handledEventsCount: document.getElementById('handled-events-count'),
            pendingThreatsCount: document.getElementById('pending-threats-count'),
            activeThreatsContainer: document.getElementById('active-threats-container'),
            currentScore: document.getElementById('current-score'),
            currentLevel: document.getElementById('current-level'),
            levelProgressBar: document.getElementById('level-progress-bar'),
            levelProgressLabel: document.getElementById('level-progress-label'),
            recentActionsList: document.getElementById('recent-actions-list')
        };
        
        // Rule editor
        this.elements.ruleForm = {
            form: document.getElementById('rule-form'),
            conditionType: document.getElementById('rule-condition-type'),
            threshold: document.getElementById('rule-threshold-input'),
            processName: document.getElementById('rule-process-name-input'),
            domainKeyword: document.getElementById('rule-domain-keyword-input'),
            errorCode: document.getElementById('rule-error-code-threshold-input'),
            resourceKeyword: document.getElementById('rule-resource-keyword-input'),
            serviceName: document.getElementById('rule-service-name-input'),
            combinator: document.getElementById('rule-combinator'),
            testButton: document.getElementById('rule-test-button'),
            saveButton: document.getElementById('rule-save-button'),
            testOutput: document.getElementById('rule-test-output')
        };
        
        // Action panel
        this.elements.actionButtons = document.querySelectorAll('#actions .action-button, #manual-actions .action-button');
        this.elements.actionDropzone = document.getElementById('action-dropzone');
        
        // Game controls
        this.elements.gameControls = {
            startButton: document.getElementById('start-simulation-btn'),
            resetButton: document.getElementById('reset-game-btn')
        };
        
        // Case builder
        this.elements.caseBuilderDropZone = document.getElementById('case-builder-dropzone');
        
        // Create notifications container if it doesn't exist
        if (!document.getElementById('notifications-container')) {
            const notificationsContainer = document.createElement('div');
            notificationsContainer.id = 'notifications-container';
            notificationsContainer.style.position = 'fixed';
            notificationsContainer.style.top = '20px';
            notificationsContainer.style.right = '20px';
            notificationsContainer.style.zIndex = '1000';
            document.body.appendChild(notificationsContainer);
        }
        
        this.elements.notifications = document.getElementById('notifications-container');
    },
    
    /**
     * Set up UI event handlers
     */
    setupEventHandlers: function() {
        // Game control buttons
        if (this.elements.gameControls.startButton) {
            this.elements.gameControls.startButton.addEventListener('click', () => {
                eventBus.publish('ui:startGame');
            });
        }
        
        if (this.elements.gameControls.resetButton) {
            this.elements.gameControls.resetButton.addEventListener('click', () => {
                eventBus.publish('ui:resetGame');
            });
        }
        
        // Rule form
        if (this.elements.ruleForm.form) {
            // Condition type change handler
            this.elements.ruleForm.conditionType.addEventListener('change', 
                this.updateRuleInputFields.bind(this));
            
            // Test rule button
            this.elements.ruleForm.testButton.addEventListener('click', () => {
                const rule = this.getRuleFromForm();
                if (rule) {
                    eventBus.publish('ui:testRule', { rule });
                }
            });
            
            // Save rule button
            this.elements.ruleForm.saveButton.addEventListener('click', () => {
                const rule = this.getRuleFromForm();
                if (rule) {
                    eventBus.publish('ui:saveRule', { rule });
                }
            });
        }
        
        // Alert list events
        if (this.elements.alertList) {
            this.elements.alertList.addEventListener('click', (e) => {
                const alertItem = e.target.closest('li');
                if (alertItem && alertItem.dataset.event) {
                    // Prevent default to avoid accidental clicks during drag
                    e.preventDefault();
                    this.displayLogDetails(alertItem.dataset.event);
                } else if (alertItem) {
                    console.warn('Alert item clicked but no event data found:', alertItem);
                    this.showNotification('warning', 'Could not display event details: missing data');
                }
            });
        }
        
        // Close log details
        if (this.elements.logDetails) {
            const closeButton = document.getElementById('close-log-details-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.elements.logDetails.hidden = true;
                });
            }
        }
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Action buttons
        this.elements.actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                
                if (!action) {
                    console.error('Action button clicked but no action defined:', button);
                    this.showNotification('error', 'Action button missing configuration');
                    return;
                }
                
                if (this.elements.draggedAlert) {
                    try {
                        const eventData = JSON.parse(this.elements.draggedAlert.dataset.event);
                        if (!eventData) {
                            throw new Error('No event data found');
                        }
                        
                        eventBus.publish('ui:handleEvent', {
                            event: eventData,
                            action: action
                        });
                    } catch (e) {
                        console.error('Error processing action:', e);
                        this.showNotification('error', 'Could not process action: Invalid event data');
                    }
                } else {
                    this.showNotification('warning', 'Drag an alert to the action area first.');
                }
            });
        });
        
        // Window resize handler
        window.addEventListener('resize', debounce(() => {
            this.resizeTrafficGraph();
            this.drawTrafficGraph();
        }, 250));
    },
    
    /**
     * Subscribe to event bus events
     */
    subscribeToEvents: function() {
        eventBus.subscribe('event:added', this.handleNewEvent.bind(this));
        eventBus.subscribe('events:escalated', this.handleEscalatedEvents.bind(this));
        eventBus.subscribe('brief:new', this.displayBrief.bind(this));
        eventBus.subscribe('rule:testResults', this.displayRuleTestResults.bind(this));
        eventBus.subscribe('rule:added', this.handleRuleAdded.bind(this));
        eventBus.subscribe('game:started', this.handleGameStarted.bind(this));
        eventBus.subscribe('game:paused', this.handleGamePaused.bind(this));
        eventBus.subscribe('game:reset', this.handleGameReset.bind(this));
        eventBus.subscribe('game:completed', this.handleGameCompleted.bind(this));
        eventBus.subscribe('level:changed', this.handleLevelChanged.bind(this));
        eventBus.subscribe('notification:success', data => 
            this.showNotification('success', data.message));
        eventBus.subscribe('notification:warning', data => 
            this.showNotification('warning', data.message));
        eventBus.subscribe('notification:error', data => 
            this.showNotification('error', data.message));
        
        // Dashboard-specific events
        eventBus.subscribe('uptime:updated', this.updateDashboardUptime.bind(this));
        eventBus.subscribe('score:updated', this.updateDashboardScore.bind(this));
        eventBus.subscribe('event:handled', this.addActionToDashboard.bind(this));
    },
    
    /**
     * Initialize the security dashboard
     */
    initSecurityDashboard: function() {
        const dashboard = this.elements.dashboard;
        
        // Check if elements exist
        if (!dashboard.uptimeValue || !dashboard.currentScore) {
            console.warn('Security dashboard elements not found');
            return;
        }
        
        // Initialize values
        this.updateDashboardUptime({ uptime: 100 });
        this.updateDashboardScore({ totalScore: 0 });
        this.updateDashboardLevel({ level: 1, targetScore: 1000 });
        this.updatePendingThreats([]);
        
        // Set up interval to update dashboard
        setInterval(() => {
            this.updateSecurityDashboard();
        }, 5000);
    },
    
    /**
     * Update the entire security dashboard
     */
    updateSecurityDashboard: function() {
        try {
            const gameState = eventBus.publish('request:gameState');
            
            if (gameState) {
                this.updateDashboardUptime({ uptime: gameState.uptime });
                this.updateDashboardScore({ totalScore: gameState.score });
                this.updatePendingThreats(gameState.pendingThreats || []);
                
                const currentLevel = gameState.level;
                if (currentLevel) {
                    this.updateDashboardLevel(currentLevel);
                }
            }
        } catch (error) {
            console.error('Error updating security dashboard:', error);
        }
    },
    
    /**
     * Update dashboard uptime display
     * @param {object} data - Uptime data
     */
    updateDashboardUptime: function(data) {
        const dashboard = this.elements.dashboard;
        
        if (dashboard.uptimeValue && dashboard.uptimeIndicator) {
            const uptime = Math.max(0, Math.min(100, data.uptime));
            
            // Update text value
            dashboard.uptimeValue.textContent = `${Math.round(uptime)}%`;
            
            // Update indicator
            dashboard.uptimeIndicator.style.setProperty('--percent', `${uptime}%`);
            
            // Set color based on uptime
            let color = 'var(--success-color)';
            if (uptime < 30) {
                color = 'var(--danger-color)';
            } else if (uptime < 70) {
                color = 'var(--warning-color)';
            }
            
            dashboard.uptimeIndicator.style.background = 
                `conic-gradient(${color} 0% ${uptime}%, var(--dark-bg) ${uptime}% 100%)`;
        }
    },
    
    /**
     * Update dashboard score display
     * @param {object} data - Score data
     */
    updateDashboardScore: function(data) {
        const dashboard = this.elements.dashboard;
        
        if (dashboard.currentScore) {
            // Update with animation
            const currentValue = parseInt(dashboard.currentScore.textContent) || 0;
            const targetValue = data.totalScore;
            
            if (currentValue !== targetValue) {
                this.animateCounter(dashboard.currentScore, currentValue, targetValue, 1000);
            }
        }
        
        // Update handled events count
        if (dashboard.handledEventsCount) {
            const handledEvents = data.handledEvents || Math.floor(data.totalScore / 100);
            dashboard.handledEventsCount.textContent = handledEvents;
        }
    },
    
    /**
     * Update dashboard level display
     * @param {object} data - Level data
     */
    updateDashboardLevel: function(data) {
        const dashboard = this.elements.dashboard;
        
        if (dashboard.currentLevel) {
            dashboard.currentLevel.textContent = `Level ${data.level || 1}`;
        }
        
        if (dashboard.levelProgressBar && dashboard.levelProgressLabel) {
            const currentScore = parseInt(dashboard.currentScore.textContent) || 0;
            const targetScore = data.targetScore || 1000;
            const progressPercent = Math.min(100, Math.round((currentScore / targetScore) * 100));
            
            dashboard.levelProgressBar.style.setProperty('--progress', `${progressPercent}%`);
            dashboard.levelProgressLabel.textContent = `${progressPercent}%`;
        }
    },
    
    /**
     * Update pending threats display
     * @param {array} pendingThreats - Array of pending threats
     */
    updatePendingThreats: function(pendingThreats) {
        const dashboard = this.elements.dashboard;
        
        if (!dashboard.activeThreatsContainer || !dashboard.pendingThreatsCount) {
            return;
        }
        
        // Update count
        dashboard.pendingThreatsCount.textContent = pendingThreats.length;
        
        // No threats to display
        if (pendingThreats.length === 0) {
            dashboard.activeThreatsContainer.innerHTML = `
                <div class="no-threats-message">No active threats detected</div>
            `;
            return;
        }
        
        // Update threats container
        dashboard.activeThreatsContainer.innerHTML = '';
        
        // Add each threat
        pendingThreats.forEach(threat => {
            const threatItem = document.createElement('div');
            threatItem.className = 'threat-item';
            
            // Format name from type
            const threatName = threat.event.type.replace('_', ' ');
            const formattedName = threatName.charAt(0).toUpperCase() + threatName.slice(1);
            
            // Calculate time remaining
            const maxTime = 60000; // 60 seconds
            const elapsed = threat.timeElapsed || 0;
            const remaining = Math.max(0, maxTime - elapsed);
            const remainingSeconds = Math.ceil(remaining / 1000);
            
            // Calculate progress percentage
            const progressPercent = Math.min(100, Math.round((elapsed / maxTime) * 100));
            
            threatItem.innerHTML = `
                <div class="threat-info">
                    <div class="threat-name">${formattedName}</div>
                    <div class="threat-time">${remainingSeconds}s until escalation</div>
                </div>
                <div class="threat-progress">
                    <div class="threat-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            `;
            
            dashboard.activeThreatsContainer.appendChild(threatItem);
        });
    },
    
    /**
     * Add an action to the recent actions list
     * @param {object} data - Event data from event bus
     */
    addActionToDashboard: function(data) {
        const dashboard = this.elements.dashboard;
        
        if (!dashboard.recentActionsList) {
            return;
        }
        
        // Remove no actions message if present
        const noActionsMsg = dashboard.recentActionsList.querySelector('.no-actions-message');
        if (noActionsMsg) {
            noActionsMsg.remove();
        }
        
        // Create action item
        const actionItem = document.createElement('li');
        actionItem.className = 'action-item';
        
        // Determine action icon
        let actionIcon = '✓';
        let actionName = 'Handled Event';
        
        if (data.action) {
            actionName = data.action.replace('_', ' ');
            actionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);
            
            // Set icon based on action
            if (data.action.includes('block')) actionIcon = '🛑';
            else if (data.action.includes('password')) actionIcon = '🔑';
            else if (data.action.includes('reboot')) actionIcon = '🔄';
            else if (data.action.includes('rule')) actionIcon = '📋';
        }
        
        // Format event type
        const eventType = data.event.type.replace('_', ' ');
        const formattedType = eventType.charAt(0).toUpperCase() + eventType.slice(1);
        
        // Get current time
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        actionItem.innerHTML = `
            <div class="action-icon">${actionIcon}</div>
            <div class="action-details">
                <div class="action-name">${actionName}</div>
                <div class="action-target">${formattedType}</div>
            </div>
            <div class="action-time">${currentTime}</div>
        `;
        
        // Add to list and limit to 5 recent actions
        dashboard.recentActionsList.insertBefore(actionItem, dashboard.recentActionsList.firstChild);
        
        while (dashboard.recentActionsList.children.length > 5) {
            dashboard.recentActionsList.removeChild(dashboard.recentActionsList.lastChild);
        }
    },
    
    /**
     * Animate a counter from start to end value
     * @param {Element} element - Element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateCounter: function(element, start, end, duration) {
        if (!element) return;
        
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        
        let current = start;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    },
    
    /**
     * Handle a new event
     * @param {object} data - Event data from the event bus
     */
    handleNewEvent: function(data) {
        const event = data.event;
        
        // Display alert in UI
        this.displayAlert(event);
        
        // Update traffic graph
        this.drawTrafficGraph();
    },
    
    /**
     * Display an alert in the UI
     * @param {object} alert - Alert data
     */
    displayAlert: function(alert) {
        if (!this.elements.alertList) return;
        
        // Create list item
        const li = document.createElement('li');
        li.dataset.event = JSON.stringify(alert);
        li.setAttribute('draggable', true);
        
        // Add CSS class based on severity
        if (alert.severity >= 7) {
            li.classList.add('high-severity');
        } else if (alert.severity >= 4) {
            li.classList.add('medium-severity');
        } else {
            li.classList.add('low-severity');
        }
        
        // Build alert text
        let alertText = `${alert.timestamp} - ${alert.type}: `;
        if (alert.ip) alertText += `IP: ${alert.ip} `;
        if (alert.port) alertText += `Port: ${alert.port} `;
        if (alert.process) alertText += `Process: ${alert.process} `;
        if (alert.volume) alertText += `Vol: ${alert.volume} `;
        if (alert.domain) alertText += `Domain: ${alert.domain} `;
        if (alert.url) alertText += `URL: ${alert.url} `;
        if (alert.user) alertText += `User: ${alert.user} `;
        if (alert.resource) alertText += `Resource: ${alert.resource} `;
        if (alert.service) alertText += `Service: ${alert.service} `;
        if (alert.description) alertText += `${alert.description} `;
        
        // Set text content for safety
        li.textContent = alertText;
        
        // Add drag event listeners
        li.addEventListener('dragstart', this.handleDragStart.bind(this));
        
        // Add to list (at beginning)
        this.elements.alertList.prepend(li);
        
        // Limit number of alerts shown (performance)
        while (this.elements.alertList.children.length > 100) {
            this.elements.alertList.removeChild(this.elements.alertList.lastChild);
        }
    },
    
    /**
     * Display a threat brief
     * @param {object} data - Brief data from the event bus
     */
    displayBrief: function(data) {
        if (!this.elements.briefArea) return;
        
        // Create brief element
        const brief = document.createElement('div');
        brief.className = 'brief-item';
        brief.dataset.briefId = data.id;
        
        // Add severity class if available
        if (data.briefData && data.briefData.severity) {
            brief.classList.add(`severity-${data.briefData.severity}`);
        }
        
        brief.textContent = `${data.timestamp}: ${data.message}`;
        
        // Add click handler to show detailed modal
        brief.addEventListener('click', () => {
            if (data.briefData) {
                this.displayDetailedBriefModal(data.briefData);
            } else {
                this.displaySimpleBriefModal(data.message);
            }
        });
        
        // Add to brief area
        this.elements.briefArea.appendChild(brief);
        
        // Limit number of briefs shown
        while (this.elements.briefArea.children.length > 10) {
            this.elements.briefArea.removeChild(this.elements.briefArea.lastChild);
        }
    },
    
    /**
     * Display a simple brief modal (for legacy briefs)
     * @param {string} message - Brief message
     */
    displaySimpleBriefModal: function(message) {
        // Pause simulation
        eventBus.publish('ui:pauseGame');
        
        // Create modal wrapper
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.background = 'rgba(0, 0, 0, 0.5)';
        wrapper.style.zIndex = '1000';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        
        // Create modal
        const modal = document.createElement('div');
        modal.classList.add('popup');
        modal.style.position = 'center';
        modal.style.transform = 'none';
        
        // Set modal content
        modal.innerHTML = `
            <h3>Cyber Threat Update</h3>
            <p>${sanitizeString(message)}</p>
            <button id="close-brief-modal-btn">Close</button>
        `;
        
        // Add to DOM
        wrapper.appendChild(modal);
        document.body.appendChild(wrapper);
        
        // Add close button handler
        document.getElementById('close-brief-modal-btn').addEventListener('click', () => {
            document.body.removeChild(wrapper);
            eventBus.publish('ui:startGame');
        });
    },
    
    /**
     * Display a detailed brief modal for enhanced briefs
     * @param {object} briefData - Complete brief data
     */
    displayDetailedBriefModal: function(briefData) {
        // Pause simulation
        eventBus.publish('ui:pauseGame');
        
        // Create modal wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'threat-brief-modal-wrapper';
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        wrapper.style.zIndex = '1000';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'threat-brief-modal';
        modal.style.backgroundColor = 'var(--dark-bg)';
        modal.style.borderRadius = '10px';
        modal.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        modal.style.width = '90%';
        modal.style.maxWidth = '800px';
        modal.style.maxHeight = '90vh';
        modal.style.overflow = 'auto';
        modal.style.padding = '25px';
        modal.style.color = 'var(--text-light)';
        modal.style.position = 'relative';
        
        // Get severity indicator
        const severityClass = `severity-${briefData.severity || 'info'}`;
        const severityText = briefData.severity ? briefData.severity.charAt(0).toUpperCase() + briefData.severity.slice(1) : 'Info';
        
        // Build modal content
        let content = `
            <div class="brief-header">
                <div class="brief-title-area">
                    <span class="brief-severity ${severityClass}">${severityText}</span>
                    <h2>${sanitizeString(briefData.title)}</h2>
                    <div class="brief-category">${sanitizeString(briefData.category)}</div>
                </div>
                <button class="brief-close-btn" aria-label="Close">✕</button>
            </div>
            
            <div class="brief-message">
                ${sanitizeString(briefData.message)}
            </div>
            
            <div class="brief-details">
        `;
        
        // Add details based on brief type
        if (briefData.details) {
            if (briefData.category === "System Updates") {
                // System update format
                content += `
                    <div class="details-item">
                        <div class="details-label">Activity:</div>
                        <div class="details-value">${sanitizeString(briefData.details.activity || briefData.details.update || '')}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Impact:</div>
                        <div class="details-value">${sanitizeString(briefData.details.impact || '')}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">${briefData.details.schedule ? 'Schedule:' : 'Coverage:'}</div>
                        <div class="details-value">${sanitizeString(briefData.details.schedule || briefData.details.coverage || '')}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">${briefData.details.affected ? 'Affected Systems:' : 'Changes:'}</div>
                        <div class="details-value">${sanitizeString(briefData.details.affected || briefData.details.changes || '')}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Recommended Actions:</div>
                        <div class="details-value">${sanitizeString(briefData.details.actions || '')}</div>
                    </div>
                `;
            } else {
                // Threat brief format
                content += `
                    <div class="details-item">
                        <div class="details-label">Threat:</div>
                        <div class="details-value">${sanitizeString(briefData.details.threat || '')}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Potential Impact:</div>
                        <div class="details-value">${sanitizeString(briefData.details.impact || '')}</div>
                    </div>
                `;
                
                // Add tactics if available
                if (briefData.details.tactics && briefData.details.tactics.length) {
                    content += `
                        <div class="details-item">
                            <div class="details-label">MITRE ATT&CK Tactics:</div>
                            <div class="details-value tactics-list">
                                ${briefData.details.tactics.map(tactic => `<span class="tactic-badge">${sanitizeString(tactic)}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
                
                // Add indicators and mitigation
                content += `
                    <div class="details-item">
                        <div class="details-label">Indicators:</div>
                        <div class="details-value">
                            <ul class="indicators-list">
                                ${Array.isArray(briefData.details.indicators) ? 
                                    briefData.details.indicators.map(indicator => 
                                        `<li>${sanitizeString(indicator)}</li>`
                                    ).join('') : ''}
                            </ul>
                        </div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Mitigation:</div>
                        <div class="details-value">
                            <ul class="mitigation-list">
                                ${Array.isArray(briefData.details.mitigation) ? 
                                    briefData.details.mitigation.map(mitigation => 
                                        `<li>${sanitizeString(mitigation)}</li>`
                                    ).join('') : 
                                    `<li>${sanitizeString(briefData.details.mitigation || '')}</li>`}
                            </ul>
                        </div>
                    </div>
                `;
                
                // Add reference if available
                if (briefData.reference) {
                    content += `
                        <div class="details-item">
                            <div class="details-label">Reference:</div>
                            <div class="details-value reference">${sanitizeString(briefData.reference)}</div>
                        </div>
                    `;
                }
            }
        }
        
        // Close details container and add action buttons
        content += `
            </div>
            
            <div class="brief-actions">
                <button class="brief-action-btn close-btn">Close</button>
                ${briefData.moreInfo ? 
                    `<button class="brief-action-btn more-info-btn" data-url="${sanitizeString(briefData.moreInfo)}">More Information</button>` : ''}
            </div>
        `;
        
        // Set modal content
        modal.innerHTML = content;
        
        // Add to DOM
        wrapper.appendChild(modal);
        document.body.appendChild(wrapper);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.brief-close-btn');
        const closeBtnAction = modal.querySelector('.close-btn');
        
        const closeModal = () => {
            document.body.removeChild(wrapper);
            eventBus.publish('ui:startGame');
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnAction.addEventListener('click', closeModal);
        
        // Add more info button handler
        const moreInfoBtn = modal.querySelector('.more-info-btn');
        if (moreInfoBtn) {
            moreInfoBtn.addEventListener('click', () => {
                // Just show a notification since we can't open URLs
                this.showNotification('info', 'In a real environment, this would open more information in your browser.');
            });
        }
    },
    
    /**
     * Display escalation modal
     * @param {object} data - Escalation data
     */
    displayEscalationModal: function(data) {
        // Pause simulation
        eventBus.publish('ui:pauseGame');
        
        // Create modal wrapper
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.background = 'rgba(0, 0, 0, 0.5)';
        wrapper.style.zIndex = '1000';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        
        // Create modal
        const modal = document.createElement('div');
        modal.classList.add('popup');
        modal.style.position = 'inherit';
        modal.style.transform = 'none';
        
        // Set modal content safely
        modal.innerHTML = `
            <h3>Threat Escalated! (${sanitizeString(data.eventType)})</h3>
            <p><strong>Attack Vector:</strong> ${sanitizeString(data.attackVector)}</p>
            <p><strong>Impact:</strong> ${sanitizeString(data.impact)}</p>
            <p><strong>Mitigation Tip:</strong> ${sanitizeString(data.mitigationTip)}</p>
            <button id="close-escalation-btn">Close</button>
        `;
        
        // Add to DOM
        wrapper.appendChild(modal);
        document.body.appendChild(wrapper);
        
        // Add close button handler
        document.getElementById('close-escalation-btn').addEventListener('click', () => {
            document.body.removeChild(wrapper);
            eventBus.publish('ui:startGame');
        });
    },
    
    /**
     * Handle escalated events
     * @param {object} data - Escalated events data from the event bus
     */
    handleEscalatedEvents: function(data) {
        data.events.forEach(event => {
            // Display escalated alert
            this.displayAlert({
                ...event,
                type: `escalated_${event.type}`,
                description: `ESCALATED: ${event.description} - Attack Simulation Starting...`
            });
            
            // Show escalation modal for the first event
            if (event === data.events[0]) {
                const eventType = event.type;
                const scenario = this.getEscalationScenario(eventType);
                
                this.displayEscalationModal({
                    eventType: eventType,
                    attackVector: scenario.attackVectorDescription,
                    impact: scenario.impact,
                    mitigationTip: scenario.mitigationTip
                });
            }
        });
    },
    
    /**
     * Get escalation scenario for event type
     * @param {string} eventType - Type of event
     * @returns {object} Escalation scenario
     */
    getEscalationScenario: function(eventType) {
        const scenarios = {
            login_fail: {
                attackVectorDescription: "Brute force attack detected. Unauthorized access attempt may lead to account compromise.",
                impact: "Potential account takeover and data breach.",
                mitigationTip: "Block the IP and reset affected credentials."
            },
            traffic_spike: {
                attackVectorDescription: "Distributed Denial of Service (DDoS) attack suspected. High traffic volume may overwhelm servers.",
                impact: "Service downtime and degraded performance.",
                mitigationTip: "Implement rate limiting and contact ISP."
            },
            dns_query: {
                attackVectorDescription: "Command and Control (C2) communication detected. Malicious domain query suggests botnet activity.",
                impact: "Data exfiltration or malware propagation.",
                mitigationTip: "Blacklist the domain and scan for infections."
            },
            http_error: {
                attackVectorDescription: "Web application attack (e.g., SQL injection) detected via error codes.",
                impact: "Database compromise or website defacement.",
                mitigationTip: "Patch vulnerabilities and monitor logs."
            },
            unauthorized_access: {
                attackVectorDescription: "Unauthorized access to sensitive resource detected, likely an insider threat or exploit.",
                impact: "Data leakage or privilege escalation.",
                mitigationTip: "Revoke access and audit permissions."
            },
            service_failure: {
                attackVectorDescription: "Critical service disruption, possibly due to a ransomware or exploit attack.",
                impact: "System downtime and loss of availability.",
                mitigationTip: "Restore from backup and isolate affected systems."
            },
            process_spawn: {
                attackVectorDescription: "Malicious process execution detected, indicative of malware or rootkit activity.",
                impact: "System compromise and potential lateral movement.",
                mitigationTip: "Terminate the process and run antivirus scans."
            },
            sql_injection: {
                attackVectorDescription: "SQL injection attack detected targeting database through web application.",
                impact: "Data theft, database corruption, or unauthorized access.",
                mitigationTip: "Patch vulnerabilities, validate inputs, and audit database access."
            }
        };
        
        return scenarios[eventType] || {
            attackVectorDescription: "Unknown attack vector detected.",
            impact: "Unspecified system compromise.",
            mitigationTip: "Investigate and apply general security measures."
        };
    },
    
    /**
     * Display log details
     * @param {string} eventJson - JSON string of event data
     */
    displayLogDetails: function(eventJson) {
        if (!this.elements.logDetails || !this.elements.logDetailContent) {
            return;
        }
        
        try {
            const event = JSON.parse(eventJson);
            
            // Build HTML content safely
            let content = '';
            content += `<p><strong>Timestamp:</strong> ${sanitizeString(event.timestamp)}</p>`;
            content += `<p><strong>Type:</strong> ${sanitizeString(event.type)}</p>`;
            content += `<p><strong>Severity:</strong> ${event.severity}</p>`;
            content += `<p><strong>Category:</strong> ${sanitizeString(event.category)}</p>`;
            
            // Add type-specific fields
            if (event.ip) content += `<p><strong>IP:</strong> ${sanitizeString(event.ip)}</p>`;
            if (event.user) content += `<p><strong>User:</strong> ${sanitizeString(event.user)}</p>`;
            if (event.process) content += `<p><strong>Process:</strong> ${sanitizeString(event.process)}</p>`;
            if (event.domain) content += `<p><strong>Domain:</strong> ${sanitizeString(event.domain)}</p>`;
            if (event.url) content += `<p><strong>URL:</strong> ${sanitizeString(event.url)}</p>`;
            if (event.resource) content += `<p><strong>Resource:</strong> ${sanitizeString(event.resource)}</p>`;
            if (event.service) content += `<p><strong>Service:</strong> ${sanitizeString(event.service)}</p>`;
            
            // Add description and education info
            content += `<p><strong>Description:</strong> ${sanitizeString(event.description)}</p>`;
            if (event.education) {
                content += `<p><strong>Education:</strong> ${sanitizeString(event.education)}</p>`;
            }
            
            // Set content and show
            this.elements.logDetailContent.innerHTML = content;
            this.elements.logDetails.hidden = false;
        } catch (e) {
            console.error('Error parsing event JSON:', e);
            this.showNotification('error', 'Error displaying log details.');
        }
    },
    
    /**
     * Set up rule editor UI
     */
    updateRuleInputFields: function() {
        // Hide all input fields first
        this.hideAllRuleInputFields();
        
        // Get selected condition type
        const conditionType = this.elements.ruleForm.conditionType.value;
        
        // Show appropriate fields based on condition type
        switch (conditionType) {
            case "login_fail":
            case "traffic_spike":
                document.getElementById('threshold-group').hidden = false;
                break;
                
            case "process_spawn":
                document.getElementById('process-name-group').hidden = false;
                break;
                
            case "dns_query":
                document.getElementById('domain-keyword-group').hidden = false;
                break;
                
            case "http_error":
                document.getElementById('error-code-group').hidden = false;
                break;
                
            case "unauthorized_access":
                document.getElementById('resource-keyword-group').hidden = false;
                break;
                
            case "service_failure":
                document.getElementById('service-name-group').hidden = false;
                break;
        }
    },
    
    /**
     * Hide all rule input fields
     */
    hideAllRuleInputFields: function() {
        document.getElementById('threshold-group').hidden = true;
        document.getElementById('process-name-group').hidden = true;
        document.getElementById('domain-keyword-group').hidden = true;
        document.getElementById('error-code-group').hidden = true;
        document.getElementById('resource-keyword-group').hidden = true;
        document.getElementById('service-name-group').hidden = true;
    },
    
    /**
     * Get rule configuration from form
     * @returns {object|null} Rule configuration or null if invalid
     */
    getRuleFromForm: function() {
        const conditionType = this.elements.ruleForm.conditionType.value;
        const combinator = this.elements.ruleForm.combinator.value;
        
        let rule = {
            conditionType: conditionType,
            combinator: combinator
        };
        
        switch (conditionType) {
            case "login_fail":
            case "traffic_spike":
                rule.threshold = this.elements.ruleForm.threshold.value;
                if (!rule.threshold) {
                    this.showNotification('error', 'Threshold value is required for this rule.');
                    return null;
                }
                break;
                
            case "process_spawn":
                rule.processName = this.elements.ruleForm.processName.value;
                if (!rule.processName) {
                    this.showNotification('error', 'Process name is required for this rule.');
                    return null;
                }
                break;
                
            case "dns_query":
                rule.domainKeyword = this.elements.ruleForm.domainKeyword.value;
                if (!rule.domainKeyword) {
                    this.showNotification('error', 'Domain keyword is required for this rule.');
                    return null;
                }
                break;
                
            case "http_error":
                rule.errorCodeThreshold = this.elements.ruleForm.errorCode.value;
                if (!rule.errorCodeThreshold) {
                    this.showNotification('error', 'HTTP Error Code Threshold is required for this rule.');
                    return null;
                }
                break;
                
            case "unauthorized_access":
                rule.resourceKeyword = this.elements.ruleForm.resourceKeyword.value;
                if (!rule.resourceKeyword) {
                    this.showNotification('error', 'Resource keyword is required for this rule.');
                    return null;
                }
                break;
                
            case "service_failure":
                rule.serviceName = this.elements.ruleForm.serviceName.value;
                if (!rule.serviceName) {
                    this.showNotification('error', 'Service Name is required for this rule.');
                    return null;
                }
                break;
                
            default:
                return null;
        }
        
        return rule;
    },
    
    /**
     * Display rule test results
     * @param {object} data - Test results data from the event bus
     */
    displayRuleTestResults: function(data) {
        const testOutput = this.elements.ruleForm.testOutput;
        if (!testOutput) return;
        
        const results = data.results;
        
        testOutput.innerHTML = '';
        
        if (results.length === 0) {
            testOutput.textContent = 'No events matched the rule.';
        } else {
            const summary = document.createElement('div');
            summary.innerHTML = `<p><strong>Total Matches: ${results.length}</strong></p>`;
            
            // Group results by user
            const groupedByUser = {};
            results.forEach(result => {
                const user = result.event.user || 'Unknown';
                if (!groupedByUser[user]) groupedByUser[user] = [];
                groupedByUser[user].push(result.event);
            });
            
            // Display grouped results
            Object.entries(groupedByUser).forEach(([user, events]) => {
                const userSummary = document.createElement('div');
                userSummary.innerHTML = `<p>User: ${sanitizeString(user)} - Matches: ${events.length}</p>`;
                
                const details = document.createElement('ul');
                details.style.marginLeft = '20px';
                
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.textContent = `${event.timestamp}: IP ${event.ip}, Type ${event.type}`;
                    details.appendChild(li);
                });
                
                userSummary.appendChild(details);
                summary.appendChild(userSummary);
            });
            
            // Add show details button
            const showDetails = document.createElement('button');
            showDetails.textContent = 'Show Full Details';
            showDetails.dataset.expanded = 'false';
            
            showDetails.addEventListener('click', () => {
                if (showDetails.dataset.expanded === 'false') {
                    // Create details content
                    const detailsContent = document.createElement('div');
                    detailsContent.innerHTML = '<hr><h4>Full Event Details</h4>';
                    
                    results.forEach(result => {
                        const eventDetails = document.createElement('p');
                        eventDetails.textContent = `Rule matched event: ${JSON.stringify(result.event)}`;
                        detailsContent.appendChild(eventDetails);
                    });
                    
                    // Add after button
                    showDetails.parentNode.insertBefore(detailsContent, showDetails.nextSibling);
                    
                    // Update button
                    showDetails.textContent = 'Hide Details';
                    showDetails.dataset.expanded = 'true';
                } else {
                    // Remove details
                    const detailsDiv = showDetails.nextSibling;
                    if (detailsDiv) {
                        detailsDiv.remove();
                    }
                    
                    // Update button
                    showDetails.textContent = 'Show Full Details';
                    showDetails.dataset.expanded = 'false';
                }
            });
            
            summary.appendChild(showDetails);
            testOutput.appendChild(summary);
        }
        
        testOutput.hidden = false;
    },
    
    /**
     * Handle rule added
     * @param {object} data - Rule data from the event bus
     */
    handleRuleAdded: function(data) {
        const rule = data.rule;
        this.addRuleToLibrary(rule);
    },
    
    /**
     * Add a rule to the rule library
     * @param {object} rule - Rule configuration
     */
    addRuleToLibrary: function(rule) {
        const activeRules = document.getElementById('active-rules');
        if (!activeRules) return;
        
        // Remove the "no rules" message if it exists
        const noRulesMsg = activeRules.querySelector('.no-rules-message');
        if (noRulesMsg) {
            noRulesMsg.remove();
        }
        
        // Create rule item
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item';
        ruleItem.dataset.rule = JSON.stringify(rule);
        
        // Format rule display name
        let ruleName = rule.conditionType.replace('_', ' ');
        ruleName = ruleName.charAt(0).toUpperCase() + ruleName.slice(1);
        
        // Format condition
        let condition = '';
        if (rule.threshold) condition = `Threshold: ${rule.threshold}`;
        if (rule.processName) condition = `Process: ${rule.processName}`;
        if (rule.domainKeyword) condition = `Domain: ${rule.domainKeyword}`;
        if (rule.errorCodeThreshold) condition = `Error Code: ${rule.errorCodeThreshold}`;
        if (rule.resourceKeyword) condition = `Resource: ${rule.resourceKeyword}`;
        if (rule.serviceName) condition = `Service: ${rule.serviceName}`;
        
        // Rule info
        const ruleInfo = document.createElement('div');
        ruleInfo.className = 'rule-info';
        
        const ruleNameElement = document.createElement('div');
        ruleNameElement.className = 'rule-name';
        ruleNameElement.textContent = ruleName;
        
        const ruleCondition = document.createElement('div');
        ruleCondition.className = 'rule-condition';
        ruleCondition.textContent = condition;
        
        ruleInfo.appendChild(ruleNameElement);
        ruleInfo.appendChild(ruleCondition);
        
        // Rule actions
        const ruleActions = document.createElement('div');
        ruleActions.className = 'rule-actions';
        
        const enableButton = document.createElement('button');
        enableButton.textContent = 'Enabled';
        enableButton.className = 'rule-enabled';
        enableButton.setAttribute('aria-pressed', 'true');
        enableButton.addEventListener('click', () => {
            if (enableButton.getAttribute('aria-pressed') === 'true') {
                enableButton.setAttribute('aria-pressed', 'false');
                enableButton.textContent = 'Disabled';
                ruleItem.classList.add('rule-disabled');
            } else {
                enableButton.setAttribute('aria-pressed', 'true');
                enableButton.textContent = 'Enabled';
                ruleItem.classList.remove('rule-disabled');
            }
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            // Delete rule from model
            eventBus.publish('ui:deleteRule', { rule });
            
            // Remove from UI
            ruleItem.remove();
            
            // Show no rules message if no rules left
            if (!activeRules.querySelector('.rule-item')) {
                const noRulesMsg = document.createElement('p');
                noRulesMsg.className = 'no-rules-message';
                noRulesMsg.textContent = 'No active rules. Create rules using the Rule Editor.';
                activeRules.appendChild(noRulesMsg);
            }
        });
        
        ruleActions.appendChild(enableButton);
        ruleActions.appendChild(deleteButton);
        
        // Assemble rule item
        ruleItem.appendChild(ruleInfo);
        ruleItem.appendChild(ruleActions);
        
        // Add to rules list
        activeRules.appendChild(ruleItem);
    },
    
    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop: function() {
        // Set up action dropzone
        if (this.elements.actionDropzone) {
            this.elements.actionDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.actionDropzone.classList.add('dragover');
            });
            
            this.elements.actionDropzone.addEventListener('dragleave', () => {
                this.elements.actionDropzone.classList.remove('dragover');
            });
            
            this.elements.actionDropzone.addEventListener('drop', this.handleDrop.bind(this));
        }
        
        // Set up case builder dropzone
        if (this.elements.caseBuilderDropZone) {
            this.elements.caseBuilderDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.caseBuilderDropZone.classList.add('dragover');
            });
            
            this.elements.caseBuilderDropZone.addEventListener('dragleave', () => {
                this.elements.caseBuilderDropZone.classList.remove('dragover');
            });
            
            this.elements.caseBuilderDropZone.addEventListener('drop', this.handleDrop.bind(this));
        }
    },
    
    /**
     * Handle drag start
     * @param {Event} event - DOM event
     */
    handleDragStart: function(event) {
        this.elements.draggedAlert = event.target;
        event.dataTransfer.setData('text/plain', event.target.dataset.event);
        event.dataTransfer.effectAllowed = 'move';
    },
    
    /**
     * Handle drop
     * @param {Event} event - DOM event
     */
    handleDrop: function(event) {
        event.preventDefault();
        
        // Get drop target
        const dropTarget = event.currentTarget;
        dropTarget.classList.remove('dragover');
        
        // Get event data
        const eventData = event.dataTransfer.getData('text/plain');
        
        if (this.elements.draggedAlert && eventData) {
            // Move the element
            dropTarget.appendChild(this.elements.draggedAlert);
            
            // Handle action dropzone
            if (dropTarget === this.elements.actionDropzone) {
                // Show message to select an action
                this.showNotification('info', 'Now select an action to apply to this event.');
            }
        }
    },
    
    /**
     * Handle game started
     */
    handleGameStarted: function() {
        // Update UI state
        if (this.elements.gameControls.startButton) {
            this.elements.gameControls.startButton.disabled = true;
        }
        
        if (this.elements.gameControls.resetButton) {
            this.elements.gameControls.resetButton.disabled = false;
        }
        
        // Hide debrief screen if visible
        if (this.elements.debriefScreen) {
            this.elements.debriefScreen.hidden = true;
        }
        
        this.showNotification('success', 'Simulation started.');
    },
    
    /**
     * Handle game paused
     */
    handleGamePaused: function() {
        // Update UI state
        if (this.elements.gameControls.startButton) {
            this.elements.gameControls.startButton.disabled = false;
        }
        
        this.showNotification('info', 'Simulation paused.');
    },
    
    /**
     * Handle game reset
     */
    handleGameReset: function() {
        // Update UI state
        if (this.elements.gameControls.startButton) {
            this.elements.gameControls.startButton.disabled = false;
        }
        
        if (this.elements.gameControls.resetButton) {
            this.elements.gameControls.resetButton.disabled = true;
        }
        
        // Clear alerts
        if (this.elements.alertList) {
            this.elements.alertList.innerHTML = '';
        }
        
        // Clear briefs
        if (this.elements.briefArea) {
            this.elements.briefArea.innerHTML = '';
        }
        
        // Hide debrief screen
        if (this.elements.debriefScreen) {
            this.elements.debriefScreen.hidden = true;
        }
        
        // Clear action buttons (except default ones)
        const actionsContainer = document.querySelector('#actions');
        if (actionsContainer) {
            const defaultButtons = document.querySelectorAll('#actions [data-action]');
            const customButtons = document.querySelectorAll('#actions [data-rule]');
            
            customButtons.forEach(button => button.remove());
        }
        
        this.showNotification('success', 'Game reset successful.');
    },
    
    /**
     * Handle game completed
     */
    handleGameCompleted: function() {
        this.showNotification('success', 'Congratulations! You have completed all levels!');
        this.displayDebriefScreen();
    },
    
    /**
     * Handle level changed
     * @param {object} data - Level data from the event bus
     */
    handleLevelChanged: function(data) {
        const level = data.level;
        
        this.showNotification('success', `Starting ${level.name}: ${level.description}`);
    },
    
    /**
     * Display debrief screen
     */
    displayDebriefScreen: function() {
        if (!this.elements.debriefScreen || !this.elements.debriefStatsArea) {
            return;
        }
        
        // Get stats
        const stats = gameModel.getDebriefStats();
        
        // Show debrief screen
        this.elements.debriefScreen.hidden = false;
        
        // Update stats
        this.elements.debriefStatsArea.innerHTML = `
            <h3>Mission Debrief</h3>
            <p><strong>Level:</strong> ${sanitizeString(stats.levelName)}</p>
            <p><strong>Score:</strong> ${stats.currentScore} / ${stats.levelTargetScore}</p>
            <p><strong>Threats Handled:</strong> ${stats.eventsHandled} / ${stats.totalMalicious} (${stats.handlePercentage}%)</p>
            <p><strong>Network Uptime:</strong> ${stats.uptime}%</p>
            
            <div class="progress-container">
                <div class="progress-label">Level Progress</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, (stats.currentScore / stats.levelTargetScore) * 100)}%"></div>
                </div>
                <div class="progress-value">${Math.floor((stats.currentScore / stats.levelTargetScore) * 100)}%</div>
            </div>
            
            <div class="debrief-actions">
                ${stats.currentScore >= stats.levelTargetScore ? 
                    '<button id="next-level-btn">Advance to Next Level</button>' : 
                    '<button id="continue-btn">Continue Current Level</button>'}
                <button id="reset-level-btn">Reset Level</button>
            </div>
        `;
        
        // Add button event listeners
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                gameModel.startNextLevel();
                this.elements.debriefScreen.hidden = true;
                eventBus.publish('ui:startGame');
            });
        }
        
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.elements.debriefScreen.hidden = true;
                eventBus.publish('ui:startGame');
            });
        }
        
        const resetLevelBtn = document.getElementById('reset-level-btn');
        if (resetLevelBtn) {
            resetLevelBtn.addEventListener('click', () => {
                eventBus.publish('ui:resetGame');
            });
        }
    },
    
    /**
     * Show a notification
     * @param {string} type - Notification type (success, warning, error, info)
     * @param {string} message - Notification message
     */
    showNotification: function(type, message) {
        if (!this.elements.notifications) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.padding = '10px 15px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '5px';
        notification.style.animation = 'fadeIn 0.3s ease-out';
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = 'black';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                notification.style.color = 'white';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#17a2b8';
                notification.style.color = 'white';
                break;
        }
        
        // Add to container
        this.elements.notifications.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in';
            notification.addEventListener('animationend', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }, 5000);
    }
};

export default uiController;