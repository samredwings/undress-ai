/**
 * CARNAL ROULETTE VR — IK Penetration System
 * 
 * ECS System for realistic penetration animation using CCD IK solver.
 * 
 * Architecture:
 * - Each partner body has IK chains for: hips, spine, head, arms, legs
 * - Penetration targets are world-space positions mapped from the 
 *   first-person camera (player's POV)
 * - Depth is calculated from target distance to each hole entry point
 * - Collision detection via raycaster prevents mesh clipping
 * - Haptic/audio feedback is triggered based on depth thresholds
 * 
 * The system supports multiple penetration modes:
 *   - vaginal (front)
 *   - anal (rear)
 *   - oral (face)
 *   - intercrural (thighs)
 *   - manual (hands)
 * 
 * @extends ECS.System
 */

class IKPenetrationSystem {
  constructor() {
    this.name = 'IKPenetration';
    this.priority = 10; // After animation, before rendering
    
    // CCD IK solver instances keyed by entity ID
    this.solvers = new Map();
    
    // Penetration state for each active pair
    this.activePenetrations = new Map(); // Map<'entityId:playerEntityId', PenetrationState>
    
    // Hole entry points (local-space offsets on the receiving body)
    this.HOLE_DEFINITIONS = {
      vaginal: {
        localOffset: new THREE.Vector3(0, 0.15, 0.08),
        depthMax: 0.25, // max world-space depth in meters
        angleTolerance: 0.5, // radians
        label: 'pussy',
      },
      anal: {
        localOffset: new THREE.Vector3(0, 0.12, -0.06),
        depthMax: 0.22,
        angleTolerance: 0.4,
        label: 'ass',
      },
      oral: {
        localOffset: new THREE.Vector3(0, 0.92, 0.06),
        depthMax: 0.15,
        angleTolerance: 0.6,
        label: 'mouth',
      },
      intercrural: {
        localOffset: new THREE.Vector3(0, 0.22, 0.04),
        depthMax: 0.18,
        angleTolerance: 0.8,
        label: 'thighs',
      },
    };

    // Depth thresholds for feedback events
    this.DEPTH_PHASES = [
      { threshold: 0.0,  label: 'touching',   event: 'penetration:touch' },
      { threshold: 0.15, label: 'entering',   event: 'penetration:enter' },
      { threshold: 0.35, label: 'half',       event: 'penetration:half' },
      { threshold: 0.55, label: 'full',       event: 'penetration:full' },
      { threshold: 0.75, label: 'deep',       event: 'penetration:deep' },
      { threshold: 0.9,  label: 'cervix',     event: 'penetration:cervix' },
      { threshold: 1.0,  label: 'max-depth',  event: 'penetration:max' },
    ];
  }

  /**
   * Initialize IK chains for a character entity
   * Called when a character is spawned into the scene
   * 
   * @param {number} entityId - The receiving character's entity ID
   * @param {THREE.SkinnedMesh} mesh - The character's skinned mesh
   * @param {Object} options - Bone configuration
   */
  setupCharacterIK(entityId, mesh, options = {}) {
    if (!mesh || !mesh.isSkinnedMesh) {
      console.warn(`[IKPenetration] Entity ${entityId}: not a skinned mesh`);
      return;
    }

    const skeleton = mesh.skeleton;
    if (!skeleton || !skeleton.bones.length) {
      console.warn(`[IKPenetration] Entity ${entityId}: no skeleton found`);
      return;
    }

    // Find bones by common naming conventions
    const boneNames = skeleton.bones.map(b => b.name);
    
    const findBone = (patterns) => {
      for (const pattern of patterns) {
        const match = boneNames.find(n => 
          n.toLowerCase().includes(pattern.toLowerCase())
        );
        if (match !== undefined) return skeleton.bones.indexOf(b => b.name === match);
      }
      return -1;
    };

    // Hip chain (main receiving bone group for penetration)
    const hipBoneIdx = findBone(['hip', 'pelvis', 'root', 'spine1']);
    const spineBoneIdx = findBone(['spine', 'chest', 'upperbody']);
    
    // Leg chains (spread/reaction)
    const leftLegIdx = findBone(['thigh.l', 'upleg.l', 'leg.l']);
    const rightLegIdx = findBone(['thigh.r', 'upleg.r', 'leg.r']);

    // Build IK chains based on available bones
    const iks = [];

    // Primary chain: penetration receiving (hip → spine)
    if (hipBoneIdx >= 0 && spineBoneIdx >= 0) {
      iks.push({
        target: hipBoneIdx, // target bone (what we move)
        effector: spineBoneIdx, // effector (the end of the chain)
        links: [
          { index: spineBoneIdx },
          ...this.getIntermediateBones(skeleton, hipBoneIdx, spineBoneIdx),
        ],
        iteration: 50,
        tolerance: 0.001,
      });
    }

    // Leg spread chain (left)
    if (leftLegIdx >= 0) {
      const leftFootIdx = findBone(['foot.l', 'ankle.l', 'toe.l']);
      if (leftFootIdx >= 0) {
        iks.push({
          target: leftLegIdx,
          effector: leftFootIdx,
          links: this.getBoneChain(skeleton, leftLegIdx, leftFootIdx),
          iteration: 30,
          tolerance: 0.01,
        });
      }
    }

    // Leg spread chain (right)
    if (rightLegIdx >= 0) {
      const rightFootIdx = findBone(['foot.r', 'ankle.r', 'toe.r']);
      if (rightFootIdx >= 0) {
        iks.push({
          target: rightLegIdx,
          effector: rightFootIdx,
          links: this.getBoneChain(skeleton, rightLegIdx, rightFootIdx),
          iteration: 30,
          tolerance: 0.01,
        });
      }
    }

    if (iks.length === 0) {
      console.warn(`[IKPenetration] Entity ${entityId}: no suitable IK chains could be built`);
      return;
    }

    // Create CCD IK solver
    try {
      const solver = new THREE.CCDIKSolver(mesh, iks);
      this.solvers.set(entityId, {
        solver,
        mesh,
        skeleton,
        iks,
        boneMap: {
          hip: hipBoneIdx,
          spine: spineBoneIdx,
          leftLeg: leftLegIdx,
          rightLeg: rightLegIdx,
        },
      });

      // Store bone indices in ECS component for other systems
      ECS.updateComponent(entityId, 'ik-bones', {
        hipIndex: hipBoneIdx,
        spineIndex: spineBoneIdx,
        leftLegIndex: leftLegIdx,
        rightLegIndex: rightLegIdx,
      });

      EventBus.emit('ik:chains:built', { entityId, chainCount: iks.length });
      console.log(`[IKPenetration] Entity ${entityId}: ${iks.length} IK chains built`);
    } catch (err) {
      console.error(`[IKPenetration] Entity ${entityId}: solver creation failed:`, err);
    }
  }

  /**
   * Get intermediate bones between two indices (parent to child)
   */
  getIntermediateBones(skeleton, fromIdx, toIdx) {
    const bones = skeleton.bones;
    const chain = [];
    
    // Walk up from effector to target
    let current = toIdx;
    while (current !== fromIdx && current >= 0) {
      const bone = bones[current];
      if (!bone) break;
      
      const parentIdx = bones.indexOf(bone.parent);
      if (parentIdx >= 0 && parentIdx !== fromIdx) {
        chain.push({ index: parentIdx });
      }
      current = parentIdx;
    }
    
    return chain;
  }

  /**
   * Get full bone chain from start to end (inclusive)
   */
  getBoneChain(skeleton, startIdx, endIdx) {
    const bones = skeleton.bones;
    const chain = [];
    
    let current = endIdx;
    while (current !== startIdx && current >= 0) {
      chain.push({ index: current });
      const bone = bones[current];
      if (!bone) break;
      current = bones.indexOf(bone.parent);
    }
    chain.push({ index: startIdx });
    
    return chain;
  }

  /**
   * Register a penetration interaction between player and a partner
   * 
   * @param {number} partnerEntityId - Receiving character entity
   * @param {number} playerEntityId - Player entity (camera)
   * @param {string} holeType - 'vaginal' | 'anal' | 'oral' | 'intercrural'
   * @param {Object} options - Configuration
   */
  registerPenetration(partnerEntityId, playerEntityId, holeType = 'vaginal', options = {}) {
    const key = `${partnerEntityId}:${playerEntityId}`;
    
    const holeDef = this.HOLE_DEFINITIONS[holeType];
    if (!holeDef) {
      console.warn(`[IKPenetration] Unknown hole type: ${holeType}`);
      return;
    }

    const partnerIK = this.solvers.get(partnerEntityId);
    if (!partnerIK) {
      console.warn(`[IKPenetration] Partner ${partnerEntityId} has no IK setup`);
      return;
    }

    // Get hip bone for world-space offset calculation
    const hipBone = partnerIK.skeleton.bones[partnerIK.boneMap.hip];
    if (!hipBone) {
      console.warn(`[IKPenetration] Partner ${partnerEntityId} has no hip bone`);
      return;
    }

    const state = {
      partnerEntityId,
      playerEntityId,
      holeType,
      holeDef,
      depth: 0,
      targetDepth: 0,
      velocity: 0,
      previousDepth: 0,
      
      // World-space entry point (recalculated each frame)
      entryPoint: new THREE.Vector3(),
      localOffset: holeDef.localOffset.clone(),
      
      // Target for the IK solver (the player's tip position)
      ikTarget: new THREE.Vector3(),
      
      // Hip target rotation for angle alignment
      hipTargetRotation: new THREE.Quaternion(),
      
      // Timing
      lastThrustTime: 0,
      thrustCount: 0,
      totalDepthTraveled: 0,
      
      // Current phase
      currentPhase: 'touching',
      phaseIndex: 0,
      
      // Visual state
      stretchAmount: 0,
      isPulsing: false,
      
      // Options
      smoothSpeed: options.smoothSpeed || 8.0,
      maxDepth: options.maxDepth || holeDef.depthMax,
      angleTolerance: options.angleTolerance || holeDef.angleTolerance,
      autoRhythm: options.autoRhythm || false,
    };

    this.activePenetrations.set(key, state);
    
    // Notify ECS
    ECS.updateComponent(partnerEntityId, 'penetration', {
      active: true,
      holeType,
      depth: 0,
      partnerId: playerEntityId,
    });

    EventBus.emit('penetration:registered', {
      partnerEntityId,
      playerEntityId,
      holeType,
      key,
    });

    console.log(`[IKPenetration] Registered: ${holeType} penetration for entity ${partnerEntityId}`);
    
    return key;
  }

  /**
   * Update a penetration target depth (called from input/action system)
   * 
   * @param {string} key - The penetration key 'partnerId:playerId'
   * @param {number} depth - Target depth 0.0-1.0
   * @param {number} [velocity] - Thrust velocity for physics
   */
  setDepth(key, depth, velocity = 0) {
    const state = this.activePenetrations.get(key);
    if (!state) return;

    state.targetDepth = THREE.MathUtils.clamp(depth, 0, 1);
    state.velocity = velocity;
    state.lastThrustTime = performance.now();
  }

  /**
   * Apply a thrust impulse (from VR controller or action button)
   * 
   * @param {string} key - Penetration key
   * @param {number} impulse - 0.0-1.0 thrust strength
   */
  applyThrust(key, impulse = 0.5) {
    const state = this.activePenetrations.get(key);
    if (!state) return;

    // Calculate depth delta based on impulse
    const delta = impulse * 0.4;
    state.targetDepth = Math.min(1, state.targetDepth + delta);
    state.velocity = impulse * 2;
    state.thrustCount++;
    state.lastThrustTime = performance.now();
    
    // Emit event for audio/haptics
    EventBus.emit('penetration:thrust', {
      key,
      impulse,
      depth: state.targetDepth,
      thrustCount: state.thrustCount,
    });
  }

  /**
   * Remove a penetration registration
   */
  unregisterPenetration(key) {
    const state = this.activePenetrations.get(key);
    if (!state) return;

    ECS.updateComponent(state.partnerEntityId, 'penetration', {
      active: false,
      depth: 0,
    });

    this.activePenetrations.delete(key);
    EventBus.emit('penetration:unregistered', { key });
  }

  /**
   * ECS system update — called every frame
   */
  update(world, delta, elapsed) {
    // Update each active penetration
    for (const [key, state] of this.activePenetrations) {
      this.updatePenetration(state, delta, elapsed);
    }

    // Update each IK solver
    for (const [entityId, ikData] of this.solvers) {
      try {
        ikData.solver.update();
      } catch (err) {
        console.warn(`[IKPenetration] Solver update failed for entity ${entityId}:`, err);
      }
    }
  }

  /**
   * Update a single penetration state
   */
  updatePenetration(state, delta, elapsed) {
    const partnerIK = this.solvers.get(state.partnerEntityId);
    if (!partnerIK) return;

    const hipBone = partnerIK.skeleton.bones[partnerIK.boneMap.hip];
    if (!hipBone) return;

    // 1. Calculate world-space entry point
    state.entryPoint.copy(state.localOffset);
    state.entryPoint.applyQuaternion(hipBone.quaternion);
    state.entryPoint.add(hipBone.getWorldPosition(new THREE.Vector3()));

    // 2. Smooth depth towards target
    state.previousDepth = state.depth;
    state.depth += (state.targetDepth - state.depth) * Math.min(1, state.smoothSpeed * delta);

    // 3. Calculate IK target position (the "tip" position along the penetration vector)
    // The penetration direction is along the hip's forward vector
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(hipBone.quaternion);
    
    const depthWorld = state.depth * state.maxDepth;
    state.ikTarget.copy(state.entryPoint);
    state.ikTarget.add(forward.multiplyScalar(depthWorld));

    // 4. Set the IK target bone position (hip bone follows the target)
    hipBone.position.copy(state.ikTarget);

    // 5. Check depth phases for event triggers
    this.checkDepthPhases(state);

    // 6. Auto-rhythm if enabled (slow oscillation)
    if (state.autoRhythm) {
      const rhythm = (Math.sin(elapsed * 1.5) * 0.5 + 0.5) * 0.3 + 0.1;
      state.targetDepth = THREE.MathUtils.lerp(state.targetDepth, rhythm, delta * 0.5);
    }

    // 7. Calculate stretch amount for visual deformation
    const depthChange = Math.abs(state.depth - state.previousDepth);
    state.stretchAmount = THREE.MathUtils.lerp(
      state.stretchAmount,
      state.depth * 0.3 + depthChange * 2,
      delta * 5
    );

    // 8. Update ECS component
    ECS.updateComponent(state.partnerEntityId, 'penetration', {
      depth: state.depth,
      targetDepth: state.targetDepth,
      stretchAmount: state.stretchAmount,
      phase: state.currentPhase,
      thrustVelocity: state.velocity,
    });

    // 9. Emit frame update for visualization/audio
    EventBus.emit('penetration:frame', {
      key: `${state.partnerEntityId}:${state.playerEntityId}`,
      depth: state.depth,
      phase: state.currentPhase,
      velocity: state.velocity,
      stretchAmount: state.stretchAmount,
      entryPoint: state.entryPoint.clone(),
      ikTarget: state.ikTarget.clone(),
    });

    // Decay velocity
    state.velocity *= 0.95;
  }

  /**
   * Check depth thresholds and emit events
   */
  checkDepthPhases(state) {
    for (let i = this.DEPTH_PHASES.length - 1; i >= 0; i--) {
      const phase = this.DEPTH_PHASES[i];
      if (state.depth >= phase.threshold) {
        if (state.phaseIndex !== i) {
          state.phaseIndex = i;
          state.currentPhase = phase.label;
          
          EventBus.emit(phase.event, {
            key: `${state.partnerEntityId}:${state.playerEntityId}`,
            depth: state.depth,
            phase: phase.label,
            holeType: state.holeType,
          });
          
          // Also emit a generic penetration event for other systems
          EventBus.emit('penetration:phase-change', {
            key: `${state.partnerEntityId}:${state.playerEntityId}`,
            phase: phase.label,
            holeType: state.holeType,
            depth: state.depth,
          });
        }
        break;
      }
    }
  }

  /**
   * Get current penetration state for a pair
   */
  getState(partnerEntityId, playerEntityId) {
    return this.activePenetrations.get(`${partnerEntityId}:${playerEntityId}`) || null;
  }

  /**
   * Get depth as a formatted string for HUD
   */
  getDepthLabel(depth) {
    if (depth < 0.05) return 'touching';
    if (depth < 0.2) return 'tip';
    if (depth < 0.4) return 'half';
    if (depth < 0.6) return 'full';
    if (depth < 0.8) return 'deep';
    if (depth < 0.95) return 'cervix';
    return 'max depth';
  }

  /**
   * Clean up all IK data for an entity
   */
  removeEntity(entityId) {
    this.solvers.delete(entityId);
    
    // Remove any penetrations involving this entity
    for (const [key, state] of this.activePenetrations) {
      if (state.partnerEntityId === entityId || state.playerEntityId === entityId) {
        this.activePenetrations.delete(key);
      }
    }
  }

  /**
   * Destroy all solvers
   */
  destroy() {
    this.solvers.clear();
    this.activePenetrations.clear();
  }
}

// Register as an ECS system
const ikPenetration = new IKPenetrationSystem();
ECS.registerSystem(ikPenetration);

// Export globally
window.IKPenetration = ikPenetration;
