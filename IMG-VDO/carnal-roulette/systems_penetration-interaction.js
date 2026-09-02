/**
 * CARNAL ROULETTE VR — Penetration Interaction Bridge
 * 
 * Maps user input (VR controller, keyboard, buttons) to IK penetration commands.
 * Handles multi-partner targeting and hole selection.
 */

class PenetrationInteraction {
  constructor() {
    this.activeTarget = null; // Current penetration key being controlled
    this.inputSmoothing = 0.85; // Low-pass filter for controller input
    this.lastInput = 0;
    
    // Listen for input events
    EventBus.on('input:thrust', (data) => this.handleThrustInput(data));
    EventBus.on('input:depth', (data) => this.handleDepthInput(data));
    EventBus.on('input:select-hole', (data) => this.handleHoleSelection(data));
    EventBus.on('input:switch-partner', (data) => this.handlePartnerSwitch(data));
  }

  /**
   * Handle a thrust input (discrete action)
   */
  handleThrustInput(data) {
    if (!this.activeTarget) return;
    
    const { impulse = 0.5, duration = 0 } = data;
    
    IKPenetration.applyThrust(this.activeTarget, impulse);
    
    // Emit reaction event for animation system
    const state = IKPenetration.getState(
      this.getPartnerId(this.activeTarget),
      this.getPlayerId(this.activeTarget)
    );
    
    if (state) {
      EventBus.emit('body:react', {
        entityId: state.partnerEntityId,
        reactionType: 'thrust',
        intensity: impulse,
        depth: state.depth,
      });
    }
  }

  /**
   * Handle continuous depth input (from controller trigger / slider)
   */
  handleDepthInput(data) {
    if (!this.activeTarget) return;
    
    // Apply smoothing
    this.lastInput = this.lastInput * this.inputSmoothing + data.depth * (1 - this.inputSmoothing);
    
    const velocity = Math.abs(this.lastInput - (data.depth || 0)) * 60;
    IKPenetration.setDepth(this.activeTarget, this.lastInput, velocity);
  }

  /**
   * Switch which hole is being penetrated
   */
  handleHoleSelection(data) {
    if (!this.activeTarget) return;
    
    const state = IKPenetration.getState(
      this.getPartnerId(this.activeTarget),
      this.getPlayerId(this.activeTarget)
    );
    
    if (!state) return;
    
    // Unregister current
    IKPenetration.unregisterPenetration(this.activeTarget);
    
    // Re-register with new hole
    this.activeTarget = IKPenetration.registerPenetration(
      state.partnerEntityId,
      state.playerEntityId,
      data.holeType,
      { smoothSpeed: 6 }
    );
    
    EventBus.emit('penetration:hole-switched', {
      key: this.activeTarget,
      holeType: data.holeType,
    });
  }

  /**
   * Switch which partner is being penetrated
   */
  handlePartnerSwitch(data) {
    const { partnerEntityId, playerEntityId } = data;
    
    // Unregister current
    if (this.activeTarget) {
      const oldState = IKPenetration.getState(
        this.getPartnerId(this.activeTarget),
        this.getPlayerId(this.activeTarget)
      );
      if (oldState) {
        IKPenetration.unregisterPenetration(this.activeTarget);
      }
    }
    
    // Register new
    this.activeTarget = IKPenetration.registerPenetration(
      partnerEntityId,
      playerEntityId,
      data.holeType || 'vaginal',
      { smoothSpeed: 8 }
    );
    
    EventBus.emit('penetration:partner-switched', {
      key: this.activeTarget,
      partnerEntityId,
    });
  }

  /**
   * Set active target directly
   */
  setActiveTarget(key) {
    this.activeTarget = key;
  }

  getPartnerId(key) {
    if (!key) return null;
    const parts = key.split(':');
    return parseInt(parts[0]);
  }

  getPlayerId(key) {
    if (!key) return null;
    const parts = key.split(':');
    return parseInt(parts[1]);
  }
}

window.PenetrationInteraction = new PenetrationInteraction();

// Auto-register penetration when a character is spawned near the player
EventBus.on('character:spawned', (data) => {
  const { entityId, playerEntityId } = data;
  
  // Auto-register basic penetration with vagina as default
  const key = IKPenetration.registerPenetration(entityId, playerEntityId, 'vaginal', {
    smoothSpeed: 6,
    autoRhythm: false,
  });
  
  PenetrationInteraction.setActiveTarget(key);
});
