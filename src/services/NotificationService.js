/**
 * Notification service for displaying toast messages
 */
class NotificationService {
    constructor() {
        this.toastElement = null;
        this.timeoutId = null;
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of notification ('info', 'success', 'error', 'warning')
     * @param {number} duration - Duration in milliseconds (default: 2200)
     */
    show(message, type = 'info', duration = 2200) {
        this.createToastElement();
        
        this.toastElement.textContent = message;
        this.toastElement.className = `toast toast-${type}`;
        
        // Set background color based on type
        const colors = {
            error: '#e74c3c',
            success: '#27ae60',
            warning: '#f39c12',
            info: '#333'
        };
        
        this.toastElement.style.background = colors[type] || colors.info;
        this.toastElement.style.color = '#fff';
        this.toastElement.style.opacity = '1';
        
        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        // Auto-hide after duration
        this.timeoutId = setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     */
    success(message) {
        this.show(message, 'success');
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    error(message) {
        this.show(message, 'error');
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     */
    warning(message) {
        this.show(message, 'warning');
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     */
    info(message) {
        this.show(message, 'info');
    }

    /**
     * Hide the current toast
     */
    hide() {
        if (this.toastElement) {
            this.toastElement.style.opacity = '0';
        }
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Create the toast element if it doesn't exist
     */
    createToastElement() {
        if (!this.toastElement) {
            this.toastElement = document.createElement('div');
            this.toastElement.id = 'toast';
            this.toastElement.className = 'toast';
            
            // Set base styles
            Object.assign(this.toastElement.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '9999',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '1.1em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                opacity: '0',
                transition: 'opacity 0.3s ease',
                maxWidth: '300px',
                textAlign: 'center',
                fontWeight: '500',
                pointerEvents: 'none'
            });
            
            document.body.appendChild(this.toastElement);
        }
    }

    /**
     * Remove the toast element
     */
    destroy() {
        if (this.toastElement) {
            this.toastElement.remove();
            this.toastElement = null;
        }
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Show a confirmation dialog with custom styling
     * @param {string} message - Confirmation message
     * @param {string} title - Dialog title (optional)
     * @returns {boolean} User's choice
     */
    confirm(message, title = 'Confirm') {
        // For now, use native confirm. Could be enhanced with custom modal
        return confirm(title + '\n\n' + message);
    }

    /**
     * Show game win notification with special styling
     * @param {string} playerName - Name of winning player
     * @param {number} score - Winning score
     */
    gameWin(playerName, score) {
        this.show(`🎉 ${playerName} wins with ${score} points!`, 'success', 4000);
    }

    /**
     * Show hand completion notification
     * @param {number} handNumber - Hand number completed
     */
    handComplete(handNumber) {
        this.show(`Hand ${handNumber} recorded`, 'success');
    }

    /**
     * Show player operation notifications
     * @param {string} playerName - Player name
     * @param {string} operation - Operation performed ('added', 'removed')
     */
    playerOperation(playerName, operation) {
        const messages = {
            added: `Player ${playerName} added successfully`,
            removed: 'Player removed'
        };
        
        this.show(messages[operation] || `Player ${operation}`, 'success');
    }

    /**
     * Show validation error
     * @param {string} field - Field that failed validation
     * @param {string} requirement - Validation requirement
     */
    validationError(field, requirement) {
        this.error(`${field}: ${requirement}`);
    }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;