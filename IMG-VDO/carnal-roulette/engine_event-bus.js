/**
 * CARNAL ROULETTE VR — Event Bus
 * 
 * Decoupled publish/subscribe system for all inter-system communication.
 * All systems communicate through this bus — no direct references.
 * This enables the plugin architecture and makes testing trivial.
 */

class EventBus {
  static #listeners = new Map();
  static #onceListeners = new Map();
  static #history = new Map();
  static maxHistory = 50;

  /**
   * Subscribe to an event
   * @param {string} event - Event name (namespaced, e.g., 'character:assigned')
   * @param {Function} callback - Handler function
   * @param {Object} [context] - Optional binding context
   * @returns {Function} Unsubscribe function
   */
  static on(event, callback, context = null) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }

    const entry = { callback, context };
    this.#listeners.get(event).push(entry);

    // Return unsubscribe function
    return () => {
      const listeners = this.#listeners.get(event);
      if (listeners) {
        const idx = listeners.indexOf(entry);
        if (idx >= 0) listeners.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  static once(event, callback, context = null) {
    if (!this.#onceListeners.has(event)) {
      this.#onceListeners.set(event, []);
    }
    this.#onceListeners.get(event).push({ callback, context });
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Event payload
   */
  static emit(event, data = null) {
    // Store in history
    if (!this.#history.has(event)) {
      this.#history.set(event, []);
    }
    const hist = this.#history.get(event);
    hist.push({ timestamp: Date.now(), data });
    if (hist.length > this.maxHistory) hist.shift();

    // Notify regular listeners
    const listeners = this.#listeners.get(event);
    if (listeners) {
      for (const entry of listeners) {
        try {
          entry.callback.call(entry.context, data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${event}":`, err);
        }
      }
    }

    // Notify once listeners
    const onceListeners = this.#onceListeners.get(event);
    if (onceListeners) {
      for (const entry of onceListeners) {
        try {
          entry.callback.call(entry.context, data);
        } catch (err) {
          console.error(`[EventBus] Error in once-handler for "${event}":`, err);
        }
      }
      this.#onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  static clear(event) {
    if (event) {
      this.#listeners.delete(event);
      this.#onceListeners.delete(event);
    } else {
      this.#listeners.clear();
      this.#onceListeners.clear();
    }
  }

  /**
   * Get event history for debugging
   */
  static getHistory(event) {
    if (event) return this.#history.get(event) || [];
    return Object.fromEntries(this.#history);
  }

  /**
   * Get number of listeners for an event
   */
  static listenerCount(event) {
    return (this.#listeners.get(event) || []).length +
           (this.#onceListeners.get(event) || []).length;
  }
}

// Make globally available
window.EventBus = EventBus;
