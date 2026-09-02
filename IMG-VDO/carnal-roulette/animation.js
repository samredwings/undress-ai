/**
 * CARNAL ROULETTE VR — Animation System
 * 
 * ECS system that handles character animation:
 * - Breathing/idle movement
 * - Procedural body reactions to actions
 * - Morph target blending for expressions
 * - Climax animations
 */

class AnimationSystem {
  constructor() {
    this.name = 'Animation';
    this.time = 0;
  }

  init(world) {
    EventBus.on('action:performed', (data) => this.handleAction(data));
    EventBus.on('climax:triggered', (data) => this.handleClimax(data));
  }

  update(world, delta, elapsed) {
    this.time += delta;

    // Get all entities with animation-state and transform components
    const entities = world.query(['animation-state', 'transform', 'mesh']);

    for (const entityId of entities) {
      const animState = world.getComponent(entityId, 'animation-state');
      const transform = world.getComponent(entityId, 'transform');
      const meshData = world.getComponent(entityId, 'mesh');

      if (!animState || !transform || !meshData) continue;

      const mesh = meshData.mesh;
      if (!mesh) continue;

      // 1. Breathing
      const breathCycle = Math.sin(elapsed * 1.8 + entityId * 1.3);
      const breathAmp = 0.002 + (animState.breathIntensity || 0.5) * 0.004;
      
      if (transform.baseY !== undefined) {
        transform.y = transform.baseY + breathCycle * breathAmp;
      }

      // 2. Apply morph targets for expression
      this.applyExpression(mesh, animState.currentExpression, elapsed);

      // 3. Body reactions (squirm, arch, tremble)
      if (animState.trembleIntensity > 0.1) {
        const tremble = animState.trembleIntensity * 0.008;
        if (mesh.position) {
          mesh.position.x += (Math.random() - 0.5) * tremble;
          mesh.position.z += (Math.random() - 0.5) * tremble;
        }
      }

      // 4. Update climax visuals
      if (animState.climaxProgress > 0) {
        this.updateClimaxVisuals(mesh, animState.climaxProgress, elapsed);
      }
    }
  }

  /**
   * Apply facial expression via morph targets
   */
  applyExpression(mesh, expression, time) {
    if (!mesh.morphTargetInfluences) return;

    const expressionTargets = {
      neutral: { blush: 0, arousal: 0, pleasure: 0, pain: 0, climax: 0 },
      aroused: { blush: 0.5, arousal: 0.7, pleasure: 0.3, pain: 0, climax: 0 },
      pleasure: { blush: 0.8, arousal: 0.6, pleasure: 0.9, pain: 0, climax: 0.2 },
      pain: { blush: 0.3, arousal: 0.2, pleasure: 0, pain: 0.8, climax: 0 },
      climax: { blush: 1.0, arousal: 0.9, pleasure: 1.0, pain: 0.3, climax: 1.0 },
      exhausted: { blush: 0.6, arousal: 0.1, pleasure: 0.2, pain: 0.2, climax: 0.1 },
    };

    const target = expressionTargets[expression] || expressionTargets.neutral;
    const morphNames = mesh.morphTargetDictionary || {};

    for (const [name, weight] of Object.entries(target)) {
      const idx = morphNames[name];
      if (idx !== undefined) {
        // Smooth blend towards target
        const current = mesh.morphTargetInfluences[idx] || 0;
        mesh.morphTargetInfluences[idx] += (weight - current) * 0.05;
      }
    }
  }

  /**
   * Handle an action event — trigger body reactions
   */
  handleAction(data) {
    const { entityId, actionType, intensity } = data;
    const entity = ECS.getComponent(entityId, 'animation-state');
    if (!entity) return;

    switch (actionType) {
      case 'thrust':
        entity.currentExpression = 'pleasure';
        entity.trembleIntensity = Math.min(1, entity.trembleIntensity + intensity * 0.2);
        entity.breathIntensity = Math.min(1, entity.breathIntensity + 0.1);
        break;
      case 'deep':
        entity.currentExpression = 'pain';
        entity.trembleIntensity = Math.min(1, entity.trembleIntensity + intensity * 0.3);
        entity.breathIntensity = Math.min(1, entity.breathIntensity + 0.2);
        break;
      case 'tease':
        entity.currentExpression = 'aroused';
        entity.trembleIntensity = Math.max(0, entity.trembleIntensity - 0.1);
        break;
      case 'rhythm':
        entity.currentExpression = 'pleasure';
        entity.trembleIntensity += 0.05;
        break;
    }
  }

  /**
   * Handle climax event — dramatic animation
   */
  handleClimax(data) {
    const { entityId } = data;
    const entity = ECS.getComponent(entityId, 'animation-state');
    if (!entity) return;

    entity.climaxProgress = 1.0;
    entity.currentExpression = 'climax';
    entity.trembleIntensity = 1.0;
    entity.breathIntensity = 1.0;

    // Decay over time
    const decay = () => {
      if (entity.climaxProgress > 0) {
        entity.climaxProgress -= 0.01;
        if (entity.climaxProgress <= 0.3) {
          entity.currentExpression = 'exhausted';
        }
        setTimeout(decay, 50);
      } else {
        entity.climaxProgress = 0;
        entity.currentExpression = 'neutral';
        entity.trembleIntensity = 0;
        entity.breathIntensity = 0.5;
      }
    };
    setTimeout(decay, 3000);
  }

  updateClimaxVisuals(mesh, progress, time) {
    // Body flush (reddening) — only if material supports color change
    if (mesh.material && !Array.isArray(mesh.material)) {
      const r = 0.8 + progress * 0.2;
      const g = 0.6 + (1 - progress) * 0.4;
      const b = 0.5 + (1 - progress) * 0.5;
      mesh.material.color.setRGB(r, g, b);
    }

    // Slight scale pulse during climax
    if (mesh.scale) {
      const pulse = 1 + Math.sin(time * 20) * 0.005 * progress;
      mesh.scale.set(pulse, pulse, pulse);
    }
  }
}

// Register the system
ECS.registerSystem(new AnimationSystem());
