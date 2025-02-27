// main.js - Application entry point
import gameController from './gameController.js';
import uiController from './uiController.js';
import themeController from './themeController.js';
import escalationsController from './escalationsController.js';
import simulationController from './simulationController.js';
import { showErrorModal } from './utils.js';

/**
 * Initialize the application
 */
function initializeApplication() {
    try {
        console.log('Initializing Defender\'s Dashboard application...');
        
        // Add CSS variables for theme configuration
        document.documentElement.style.setProperty('--app-version', '"1.0.0"');
        
        // Initialize theme controller first (for UI consistency)
        themeController.init();
        
        // Initialize other controllers
        escalationsController.init();
        simulationController.init();
        uiController.init();
        gameController.init();
        
        console.log('Application initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorModal('Application Initialization Failed', 
            'There was an error starting the application. Please refresh the page and try again.');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApplication);

// Add keyboard shortcuts for accessibility
document.addEventListener('keydown', (event) => {
    // Ctrl+P to pause/resume simulation
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        
        if (gameController.getGameState().isRunning) {
            gameController.pauseSimulation();
        } else {
            gameController.startSimulation();
        }
    }
    
    // Ctrl+R to reset simulation
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        
        // Confirm reset if game is running
        if (gameController.getGameState().isRunning) {
            if (confirm('Are you sure you want to reset the simulation? All progress will be lost.')) {
                gameController.resetGame();
            }
        } else {
            gameController.resetGame();
        }
    }
    
    // Esc to close modals
    if (event.key === 'Escape') {
        // Find any open modal and close it
        const modals = document.querySelectorAll('.popup-wrapper');
        if (modals.length > 0) {
            event.preventDefault();
            modals.forEach(modal => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
        }
    }
});