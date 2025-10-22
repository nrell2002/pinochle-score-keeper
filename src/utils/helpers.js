/**
 * Utility functions for common operations
 */

/**
 * DOM utility functions
 */
export const DOM = {
    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null if not found
     */
    getById(id) {
        return document.getElementById(id);
    },

    /**
     * Get elements by class name
     * @param {string} className - Class name
     * @returns {NodeList} List of elements
     */
    getByClass(className) {
        return document.getElementsByClassName(className);
    },

    /**
     * Get element by selector
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} Element or null if not found
     */
    query(selector) {
        return document.querySelector(selector);
    },

    /**
     * Get elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} List of elements
     */
    queryAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Add event listener with automatic cleanup
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    on(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    },

    /**
     * Show element by removing hidden class
     * @param {HTMLElement} element - Element to show
     */
    show(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    },

    /**
     * Hide element by adding hidden class
     * @param {HTMLElement} element - Element to hide
     */
    hide(element) {
        if (element) {
            element.classList.add('hidden');
        }
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     */
    toggle(element) {
        if (element) {
            element.classList.toggle('hidden');
        }
    },

    /**
     * Set element text content safely
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content
     */
    setText(element, text) {
        if (element) {
            element.textContent = text;
        }
    },

    /**
     * Set element HTML content safely
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML content
     */
    setHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    },

    /**
     * Clear all child elements
     * @param {HTMLElement} element - Parent element
     */
    clear(element) {
        if (element) {
            element.innerHTML = '';
        }
    }
};

/**
 * Validation utility functions
 */
export const Validation = {
    /**
     * Validate player name
     * @param {string} name - Player name to validate
     * @returns {Object} Validation result
     */
    playerName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Name is required' };
        }

        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Name cannot be empty' };
        }

        if (trimmed.length > 50) {
            return { valid: false, error: 'Name is too long (max 50 characters)' };
        }

        if (!/^[a-zA-Z0-9\s\-_'\.]+$/.test(trimmed)) {
            return { valid: false, error: 'Name contains invalid characters' };
        }

        return { valid: true, value: trimmed };
    },

    /**
     * Validate meld value
     * @param {number} meld - Meld value to validate
     * @returns {Object} Validation result
     */
    meld(meld) {
        if (typeof meld !== 'number' || isNaN(meld)) {
            return { valid: false, error: 'Meld must be a number' };
        }

        if (meld < 0) {
            return { valid: false, error: 'Meld cannot be negative' };
        }

        if (meld % 10 !== 0) {
            return { valid: false, error: 'Meld must be divisible by 10' };
        }

        if (meld > 1000) {
            return { valid: false, error: 'Meld value is too high' };
        }

        return { valid: true, value: meld };
    },

    /**
     * Validate trick count
     * @param {number} tricks - Number of tricks
     * @returns {Object} Validation result
     */
    tricks(tricks) {
        if (typeof tricks !== 'number' || isNaN(tricks)) {
            return { valid: false, error: 'Tricks must be a number' };
        }

        if (tricks < 0) {
            return { valid: false, error: 'Tricks cannot be negative' };
        }

        if (tricks > 25) {
            return { valid: false, error: 'Tricks cannot exceed 25' };
        }

        return { valid: true, value: tricks };
    },

    /**
     * Validate bid amount
     * @param {number} bid - Bid amount
     * @param {number} minBid - Minimum bid for game type
     * @returns {Object} Validation result
     */
    bid(bid, minBid = 150) {
        if (typeof bid !== 'number' || isNaN(bid)) {
            return { valid: false, error: 'Bid must be a number' };
        }

        if (bid < minBid) {
            return { valid: false, error: `Bid must be at least ${minBid}` };
        }

        if (bid % 10 !== 0) {
            return { valid: false, error: 'Bid must be divisible by 10' };
        }

        if (bid > 2000) {
            return { valid: false, error: 'Bid is too high' };
        }

        return { valid: true, value: bid };
    },

    /**
     * Validate total tricks across all players
     * @param {Array} trickCounts - Array of trick counts
     * @returns {Object} Validation result
     */
    totalTricks(trickCounts) {
        const total = trickCounts.reduce((sum, count) => sum + count, 0);
        
        if (total > 25) {
            return { 
                valid: false, 
                error: `Total tricks (${total}) cannot exceed 25` 
            };
        }

        return { valid: true, value: total };
    }
};

/**
 * Formatting utility functions
 */
export const Format = {
    /**
     * Format a number with proper commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    number(num) {
        return new Intl.NumberFormat().format(num);
    },

    /**
     * Format a percentage
     * @param {number} value - Value to format (0-100)
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage
     */
    percentage(value, decimals = 0) {
        return `${value.toFixed(decimals)}%`;
    },

    /**
     * Format a date
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date
     */
    date(date) {
        const d = new Date(date);
        return d.toLocaleDateString();
    },

    /**
     * Format a time duration in minutes
     * @param {number} minutes - Duration in minutes
     * @returns {string} Formatted duration
     */
    duration(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    },

    /**
     * Format player statistics
     * @param {Object} player - Player object
     * @returns {string} Formatted stats string
     */
    playerStats(player) {
        const winRate = player.getWinRate();
        return `Games: ${player.gamesPlayed} | Wins: ${player.gamesWon} | Win Rate: ${winRate}%`;
    }
};

/**
 * Math utility functions
 */
export const Math = {
    /**
     * Calculate percentage
     * @param {number} value - Value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-100)
     */
    percentage(value, total) {
        return total > 0 ? (value / total) * 100 : 0;
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return globalThis.Math.min(globalThis.Math.max(value, min), max);
    },

    /**
     * Round to nearest multiple
     * @param {number} value - Value to round
     * @param {number} multiple - Multiple to round to
     * @returns {number} Rounded value
     */
    roundToMultiple(value, multiple) {
        return globalThis.Math.round(value / multiple) * multiple;
    }
};

/**
 * Array utility functions
 */
export const Arrays = {
    /**
     * Remove item from array by value
     * @param {Array} array - Source array
     * @param {any} item - Item to remove
     * @returns {Array} New array without the item
     */
    remove(array, item) {
        return array.filter(x => x !== item);
    },

    /**
     * Remove item from array by index
     * @param {Array} array - Source array
     * @param {number} index - Index to remove
     * @returns {Array} New array without the item
     */
    removeAt(array, index) {
        return array.filter((_, i) => i !== index);
    },

    /**
     * Find item by property value
     * @param {Array} array - Source array
     * @param {string} property - Property name
     * @param {any} value - Property value to find
     * @returns {any} Found item or undefined
     */
    findByProperty(array, property, value) {
        return array.find(item => item[property] === value);
    },

    /**
     * Group array items by property
     * @param {Array} array - Source array
     * @param {string} property - Property to group by
     * @returns {Object} Grouped items
     */
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }
};

/**
 * Object utility functions
 */
export const Objects = {
    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} True if empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Pick specific properties from object
     * @param {Object} obj - Source object
     * @param {Array<string>} keys - Keys to pick
     * @returns {Object} New object with picked properties
     */
    pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }
};

export default {
    DOM,
    Validation,
    Format,
    Math,
    Arrays,
    Objects
};