# Defender's Dashboard Game - Readme

## Overview

Defender's Dashboard is an educational game designed to simulate the experience of monitoring a cybersecurity dashboard and responding to network events. The game presents a stream of real-time events, including normal network activity, potential threats, and false positives. Players must analyze these events, create and manage security rules, and react effectively to protect the simulated network. Unhandled threats can escalate, leading to simulated attack consequences and game penalties. The game is designed to teach basic cybersecurity concepts, threat recognition, and incident response in an engaging and interactive way.

## File Structure and Descriptions

The game is structured using separate JavaScript files to manage different aspects of the simulation and user interface. Here's a breakdown of each file:

- **`index.html`**: The main HTML file.
    - Structures the entire game layout, including all dashboard sections like the Traffic Monitor, Alert Feed, Rule Editor, and Debrief Screen.
    - Links to `style.css` for styling and all JavaScript files to run the game logic.
    - Contains the HTML elements that the JavaScript code manipulates to display game information and receive user input.
    - Includes the modal structure for displaying escalation simulations.

- **`style.css`**:  Cascading Style Sheet file.
    - Handles the visual presentation of the dashboard.
    - Defines styles for layout, colors, fonts, responsiveness across different screen sizes, and animations.
    - Ensures the dashboard is visually appealing and easy to use.

- **`script.js`**:  Main game script.
    - Serves as the entry point for the game's JavaScript logic.
    - Handles game initialization when the page loads.
    - Sets up global event listeners for user interactions (e.g., button clicks).
    - May contain high-level game flow control logic and orchestrates interactions between different modules.
    - Currently, much of the core game logic is distributed across other specialized `.js` files for better modularity.

- **`simulator.js`**:  Event simulation engine.
    - Core logic for generating and managing game events.
    - Uses `events.js` to get the definitions of possible game events (noise, false positives, malicious).
    - Generates a stream of events at set intervals, influenced by game level and event properties.
    - Manages the game's simulation loop using `setInterval`.
    - Implements the escalation timer and logic: tracks malicious events, and if they are not "handled" (currently defined as triggering a rule), initiates an escalation sequence after a set time (e.g., 30 seconds).
    - Calls `escalations.js` to trigger and display attack simulations when events escalate.
    - Interacts with `ui.js` to display alerts and update the traffic graph with generated events.
    - Interacts with `progress.js` to get level settings that influence event frequency and other simulation parameters.

- **`rules.js`**:  Rule Engine.
    - Manages the security rules created by the player.
    - Stores and allows modification of rule sets.
    - Contains the logic to check incoming events against the defined rules.
    - Determines if any rule conditions are met by the current event.
    - Returns a list of triggered rules for each event, which is then used by `simulator.js` to determine if an event is "handled".

- **`ui.js`**:  User Interface Management.
    - Responsible for all dynamic updates to the game's user interface.
    - Contains functions to:
        - `displayAlert()`: Show new events in the alert feed.
        - `updateTrafficGraph()`: Update the visual traffic graph with event data.
        - `displayThreatBrief()`: Display pop-up threat briefs to provide contextual game information.
        - `displayDebriefScreen()`: Show the end-game debrief screen with game statistics.
        - `displayEscalationModal()`: Display a modal window to show simulated attack visualizations when threats escalate.
    - Handles the creation and removal of UI elements, updating text content, and controlling the visibility of different dashboard sections.
    - Interacts with `briefs.js` to display threat briefs.

- **`progress.js`**: Game Progression and State Management.
    - Manages the game's levels, player score, uptime, and overall game progression.
    - Defines level configurations, including event frequency multipliers, noise event probabilities, and target scores for level completion.
    - Tracks the player's score and updates it based on game actions (e.g., rule creation, handling threats).
    - Manages game state, including the current level, score, and potentially saved rules.
    - May use `localStorage` (or similar mechanisms) to save and load game state, allowing players to resume progress.
    - Provides functions to reset the game state to the initial conditions.

- **`threats.js`**: Threat and Event Definitions.
    - **[NEW FILE]**  Specifically defines all possible game events.
    - Contains the `possibleEvents` array, which is a list of objects. Each object represents a type of event that can occur in the game.
    - Each event definition includes properties such as:
        - `type`: Unique identifier for the event (e.g., "login_fail", "sql_injection").
        - `category`: Categorization of the event (e.g., "malicious", "noise", "false_positive").
        - `phase`: (Optional) Attack phase(s) the event relates to (e.g., `["recon", "exploit"]`).
        - `description`: User-friendly text describing the event.
        - `dynamic properties`: Functions to generate dynamic values for event-specific properties (e.g., `ip: () => generateIP()`).
        - `probability`: Base probability of the event occurring.
        - `level_scaling`: (Optional)  Defines how the event's frequency and/or intensity scales with the game level.

- **`briefs.js`**: Threat Brief Management.
    - **[NEW FILE]** Manages the threat briefs that appear during the game to provide context and hints.
    - Contains `threatBriefs.briefMessages` array, which defines the messages and their trigger conditions.
    - Brief messages can be triggered based on:
        - `time`:  Appears at specific time intervals.
        - `event_category`: Triggered when an event of a certain category occurs (e.g., "context", "benign").
        - `attack_phase_start`: Triggered at the start of a specific attack phase (feature to be implemented).
    - Includes functions to `startBriefs()`, `stopBriefs()`, and `generateBrief()` to control the display of briefs during the simulation.

- **`events.js`**: Event Generation Logic.
    - **[NEW FILE]**  Contains the core logic for generating game events.
    - Imports `possibleEvents` from `threats.js` to access event definitions.
    - Exports functions:
        - `generateEvent()`:  Chooses an event template based on level settings and probabilities and generates a new event object with dynamic properties.
        - `chooseEventTemplate()`: Selects an event template from `possibleEvents` based on weighted probabilities, considering level settings and event-specific scaling.
        - `eventGenerators`: An object containing functions to generate dynamic values for event properties (e.g., `generateIP()`, `generateUsername()`, etc.). These functions are used to add variety and realism to generated events.

- **`escalations.js`**: Escalation Simulation Management.
    - **[NEW FILE]** Manages the escalation of unhandled malicious events and the display of simulated attack consequences.
    - Contains `escalationScenarios` object: Defines escalation scenarios for each malicious event type. Each scenario includes:
        - `attackVectorDescription`: Text description of the simulated attack vector, displayed in the escalation modal.
        - *(Planned)* Future extensions may include functions for more complex visualizations or animations of the attack simulation.
    - Exports `escalations` object with:
        - `startEscalationSimulation(event)`:  Function called by `simulator.js` when an event escalates. It retrieves the appropriate escalation scenario from `escalationScenarios` based on the event type and calls `ui.displayEscalationModal()` to show the attack simulation to the player.


## Game Workflow

The Defender's Dashboard game follows this workflow:

1.  **Initialization (`script.js`, `ui.js`, `progress.js`, `rules.js`)**:
    - When `index.html` loads, `script.js` initializes the game.
    - `ui.js` sets up the user interface elements and initial display state.
    - `progress.js` loads or initializes the game state (level, score, rules from previous sessions if available).
    - `rules.js` initializes any default rules or loads saved rules.

2.  **Simulation Start (`simulator.js`, `briefs.js`, `progress.js`)**:
    - When the player starts the simulation:
        - `simulator.js` starts the simulation loop using `setInterval`.
        - `simulator.js` retrieves the current level settings from `progress.js` to determine event frequency and other parameters.
        - `briefs.js` starts generating threat briefs at intervals using `threatBriefs.startBriefs()`.

3.  **Event Generation (`events.js`, `threats.js`, `progress.js`)**:
    - In each interval of the simulation loop in `simulator.js`:
        - `simulator.js` calls `eventManager.generateEvent()` from `events.js`.
        - `events.js` uses `eventManager.chooseEventTemplate()` to select an event template from `eventManager.possibleEvents` (defined in `threats.js`), considering level settings from `progress.js` and event probabilities/scaling.
        - `events.js`'s `generateEvent()` function creates a new event object, populating it with properties based on the chosen template and using dynamic value generator functions (e.g., `generateIP()`).

4.  **Event Display and Handling (`ui.js`, `rules.js`, `simulator.js`)**:
    - The generated event is passed to `ui.js` to:
        - `ui.displayAlert()`: Show the event in the alert feed.
        - `ui.updateTrafficGraph()`: Update the traffic graph with the event data.
    - `simulator.js` checks for false positives based on `event.isNoise` and a `falsePositiveChance` probability, displaying a "potential false positive" alert if needed.
    - `simulator.js` passes the event to `rules.js`'s rule engine (`ruleEngine.checkEventsAgainstRules([event])`).
    - `rules.js` checks the event against all defined rules and returns a list of triggered rules.
    - If rules are triggered, `simulator.js` calls `ui.displayThreatBrief()` to show rule trigger briefs and marks the event as "handled".

5.  **Escalation Logic (`simulator.js`, `escalations.js`, `ui.js`)**:
    - `simulator.js` tracks malicious events (events with `category: "malicious"`) in `pendingMaliciousEvents`.
    - For each interval, `simulator.js`'s `checkEscalations()` function checks the time elapsed for each pending malicious event.
    - If 30 seconds pass and a malicious event is still pending (not "handled" by a rule), `simulator.js` calls `this.escalateEvent(event)`.
    - `escalateEvent()` in `simulator.js`:
        - Stops the main simulation.
        - Calls `escalations.startEscalationSimulation(event)` from `escalations.js`, passing the escalated event.
        - `escalations.js` retrieves the escalation scenario for the event type and calls `ui.displayEscalationModal()` to show the attack simulation modal to the player, pausing the game and providing educational feedback on the consequences of the missed threat.

6.  **Game Progression and End (`progress.js`, `ui.js`, `simulator.js`)**:
    - `progress.js` manages the player's score, level, and game state based on their actions (rule creation, handling threats, allowing escalations).
    - `progress.js` determines when the player progresses to the next level based on score or other criteria.
    - When the simulation is stopped (manually by the player or due to escalation), `simulator.js` calls `ui.displayDebriefScreen()` to show game statistics and allow for game reset or restart.
    - `progress.js` may save game state to `localStorage` periodically or at the end of a session.

## Extending Game Content

### Extending Threats in `threats.js`

To add new threats or modify existing ones, edit the `threats.js` file.

1.  Open `threats.js`.
2.  Locate the `possibleEvents` array.
3.  To add a new threat, add a new object to this array. Each threat object should have the following properties:

    -   `type`: (String) Unique identifier for the event type (e.g., `"new_threat_type"`). **Must be unique across all events.**
    -   `category`: (String)  Categorize the event as `"malicious"`, `"noise"`, or `"false_positive"`.
    -   `phase`: (Array of Strings, optional)  Specify the attack phases this threat is relevant to (e.g., `["recon", "exploit"]`). This is for informational purposes and potential future rule/brief triggers.
    -   `description`: (String) User-friendly description of the event that will be displayed in the alert feed.
    -   **Dynamic Properties (Optional):** To make events more varied, you can include functions that generate dynamic values for event properties. For example:
        ```javascript
        url: () => `/vulnerable-page-${Math.floor(Math.random() * 10)}.php`,
        ip: () => eventGenerators.generateIP(), // Using exported generator function from events.js
        ```
        Use the generator functions exported from `events.js` (e.g., `generateIP()`, `generateUsername()`, etc.) to ensure consistency and reusability.
    -   `probability`: (Number, 0 to 1)  Set the base probability of this event occurring in each simulation interval.  Adjust probabilities to control the frequency of different events.
    -   `level_scaling`: (Object, optional) Define how the event's frequency and/or intensity should scale with the game level. Use an object like:
        ```javascript
        level_scaling: { frequency: 1.1, intensity: 1.2 }
        ```
        `frequency`: Multiplier to increase the event's probability at higher levels (e.g., `1.1` means 10% more frequent per level).
        `intensity`: *(Future Feature)*  Multiplier to increase the event's severity or other properties at higher levels. Currently, only `frequency` scaling is actively used.

**Example of adding a new threat to `threats.js`:**

```javascript
    {
        type: "sql_injection",
        category: "malicious",
        phase: ["exploit"],
        description: "Potential SQL injection attempt",
        url: () => `/vulnerable-page-${Math.floor(Math.random() * 10)}.php`,
        probability: 0.07,
        level_scaling: { frequency: 1.1, intensity: 1.1 }
    },