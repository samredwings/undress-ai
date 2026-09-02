/**
 * CARNAL ROULETTE VR — Penetration Physics
 * 
 * Handles depth limiting based on body colliders, resistance simulation,
 * and realistic "bottoming out" at maximum depth.
 * Uses simple capsule/sphere collision against the body mesh.
 */

class PenetrationPhysics {
  constructor() {
    // Depth resistance curve: maps depth 0-1 to resistance force 0-1
    this.resistanceCurve = [
      { depth: 0.0, resistance: 0.0,  label: 'no resistance' },
      { depth: 0.1, resistance: 0.02, label: 'labia resistance' },
      { depth: 0.3, resistance: 0.05, label: 'inner walls' },
      { depth: 0.5, resistance: 0.1,  label: 'mid depth' },
      { depth: 0.7, resistance: 0.2,  label: 'deep resistance' },
      { depth: 0.85, resistance: 0.4, label: 'cervix approach' },
      { depth: 0.95, resistance: 0.7, label: 'cervix contact' },
      { depth: 1.0, resistance: 1.0,  label: 'bottomed out' },
    ];

    // Collision bodies keyed by entity ID (simple sphere colliders)
    this.colliders = new Map();
  }

  /**
   * Register body colliders for a character
   */
  setupColliders(entityId, mesh) {
    const colliderData = {
      // Collision spheres for depth limiting
      entrance: new THREE.Vector3(0, 0.15, 0.08), // Vaginal entrance
      cervix: new THREE.Vector3(0, 0.15, 0.22),  // Cervix position
      analEntrance: new THREE.Vector3(0, 0.12, -0.06),
      analEnd: new THREE.Vector3(0, 0.12, -0.18),
      
      // Body wall spheres (for lateral collision)
      walls: [
        { pos: new THREE.Vector3(-0.03, 0.15, 0.12), radius: 0.02 },
        { pos: new THREE.Vector3(0.03, 0.15, 0.12), radius: 0.02 },
      ],
    };

    this.colliders.set(entityId, colliderData);
  }

  /**
   * Calculate maximum allowed depth based on colliders
   * Returns a depth modifier 0.0-1.0
   */
  getDepthLimit(entityId, holeType, currentDepth) {
    const colliders = this.colliders.get(entityId);
    if (!colliders) return 1.0;

    // Get resistance at current depth
    const resistance = this.sampleResistance(currentDepth);
    
    // Apply resistance as a depth limiter
    const maxAllowed = 1.0 - (resistance * 0.3);
    
    return THREE.MathUtils.clamp(maxAllowed, 0.1, 1.0);
  }

  /**
   * Sample the resistance curve at a given depth
   */
  sampleResistance(depth) {
    const curve = this.resistanceCurve;
    
    if (depth <= curve[0].depth) return curve[0].resistance;
    if (depth >= curve[curve.length - 1].depth) return curve[curve.length - 1].resistance;

    // Interpolate
    for (let i = 0; i < curve.length - 1; i++) {
      if (depth >= curve[i].depth && depth < curve[i + 1].depth) {
        const t = (depth - curve[i].depth) / (curve[i + 1].depth - curve[i].depth);
        return curve[i].resistance + t * (curve[i + 1].resistance - curve[i].resistance);
      }
    }

    return 0;
  }

  /**
   * Get resistance label for HUD
   */
  getResistanceLabel(depth) {
    const curve = this.resistanceCurve;
    for (let i = curve.length - 1; i >= 0; i--) {
      if (depth >= curve[i].depth) return curve[i].label;
    }
    return curve[0].label;
  }

  /**
   * Apply physics to a penetration state
   * Called from the IK system update
   */
  applyPhysics(state) {
    const depthLimit = this.getDepthLimit(
      state.partnerEntityId,
      state.holeType,
      state.depth
    );

    // Clamp target depth based on physics
    state.targetDepth = Math.min(state.targetDepth, depthLimit);

    // Apply resistance-based damping
    const resistance = this.sampleResistance(state.depth);
    state.velocity *= (1 - resistance * 0.1);

    return depthLimit;
  }
}

window.PenetrationPhysics = new PenetrationPhysics();
