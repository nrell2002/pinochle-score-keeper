import { DOM } from '../utils/helpers.js';
import eventService, { EVENTS } from '../services/EventService.js';

/**
 * Controller for managing UI navigation and tabs
 */
class UIController {
    constructor() {
        this.currentTab = 'players';
        this.elements = {};
        this.init();
    }

    /**
     * Initialize the controller
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.showTab(this.currentTab);
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            playersTab: DOM.getById('players-tab'),
            gameTab: DOM.getById('game-tab'),
            statsTab: DOM.getById('stats-tab'),
            playersSection: DOM.getById('players-section'),
            gameSection: DOM.getById('game-section'),
            statsSection: DOM.getById('stats-section')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.elements.playersTab) {
            DOM.on(this.elements.playersTab, 'click', () => this.showTab('players'));
        }

        if (this.elements.gameTab) {
            DOM.on(this.elements.gameTab, 'click', () => this.showTab('game'));
        }

        if (this.elements.statsTab) {
            DOM.on(this.elements.statsTab, 'click', () => this.showTab('stats'));
        }
    }

    /**
     * Show a specific tab
     * @param {string} tabName - Name of the tab to show
     */
    showTab(tabName) {
        if (this.currentTab === tabName) return;

        try {
            // Hide all tabs
            DOM.queryAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            DOM.queryAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab
            const section = DOM.getById(`${tabName}-section`);
            const button = DOM.getById(`${tabName}-tab`);

            if (section) section.classList.add('active');
            if (button) button.classList.add('active');

            this.currentTab = tabName;

            // Emit tab change event
            eventService.emit(EVENTS.TAB_CHANGED, tabName);

        } catch (error) {
            console.error('Failed to show tab:', error);
        }
    }

    /**
     * Get current active tab
     * @returns {string} Current tab name
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Enable or disable a tab
     * @param {string} tabName - Tab name
     * @param {boolean} enabled - Whether to enable the tab
     */
    setTabEnabled(tabName, enabled) {
        const button = DOM.getById(`${tabName}-tab`);
        if (button) {
            if (enabled) {
                button.removeAttribute('disabled');
                button.classList.remove('disabled');
            } else {
                button.setAttribute('disabled', 'true');
                button.classList.add('disabled');
            }
        }
    }

    /**
     * Add a badge or indicator to a tab
     * @param {string} tabName - Tab name
     * @param {string} text - Badge text
     */
    addTabBadge(tabName, text) {
        const button = DOM.getById(`${tabName}-tab`);
        if (button) {
            // Remove existing badge
            const existingBadge = button.querySelector('.tab-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add new badge
            const badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.textContent = text;
            button.appendChild(badge);
        }
    }

    /**
     * Remove badge from a tab
     * @param {string} tabName - Tab name
     */
    removeTabBadge(tabName) {
        const button = DOM.getById(`${tabName}-tab`);
        if (button) {
            const badge = button.querySelector('.tab-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.elements = {};
        this.currentTab = 'players';
    }
}

export default UIController;