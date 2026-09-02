/**
 * CARNAL ROULETTE VR — ULTRA DEGENERATE Advanced Animation System
 * Full incest breeding physics, morphs, jiggle, IK, fluids
 */

class UltraDegenerateAnimationSystem {
  constructor() {
    this.name = 'UltraAnimation';
    this.time = 0;
  }

  init(world) {
    EventBus.on('action:performed', d => this.handleAction(d));
    EventBus.on('climax:triggered', d => this.handleClimax(d));
    EventBus.on('penetration:update', d => this.updatePenetration(d));
  }

  update(world, delta, elapsed) {
    this.time += delta;
    const entities = world.query(['animation-state', 'transform', 'mesh', 'body-props']);

    for (const id of entities) {
      const state = world.getComponent(id, 'animation-state');
      const mesh = world.getComponent(id, 'mesh')?.mesh;
      if (!state || !mesh) continue;

      // Breathing + Fuck Pulse
      const pulse = Math.sin(elapsed * 3) * (0.01 + state.arousal * 0.02);
      mesh.position.y = (mesh.position.y || 0) + pulse;

      // Jiggle Physics - Tits, Ass, Cum Belly
      this.applyJiggle(mesh, state.arousal);

      // Morph Targets - Extreme Ahegao + Hole Stretching
      this.applyMorphs(mesh, state);

      // Penetration Deformation
      if (state.penetrationDepth > 0) this.applyPenetration(mesh, state);
    }
  }

  applyJiggle(mesh, arousal) {
    mesh.traverse(child => {
      if (child.userData?.soft) {
        const jig = Math.sin(this.time * 20 + child.position.x) * arousal * 0.045;
        child.position.x += jig * 0.6;
        child.position.y += Math.abs(jig) * 1.8;
      }
    });
  }

  applyMorphs(mesh, state) {
    if (!mesh.morphTargetInfluences) return;
    const level = state.arousal;
    const morphs = {
      ahegaoEyes: level * 1.1,
      tongueOut: level,
      drool: level * 0.9,
      pussyStretch: state.penetrationDepth * 0.85,
      bellyInflate: state.cumInflation || 0,
      nipples: level * 1.2
    };
    Object.keys(morphs).forEach(key => {
      const idx = mesh.morphTargetDictionary?.[key];
      if (idx !== undefined) mesh.morphTargetInfluences[idx] = morphs[key];
    });
  }

  applyPenetration(mesh, state) {
    const bulge = 1 + state.penetrationDepth * 0.28;
    if (mesh.scale) mesh.scale.set(bulge * 0.92, bulge, bulge * 0.92);
    state.trembleIntensity = state.penetrationDepth * 1.4;
  }

  handleAction(data) {
    const state = ECS.getComponent(data.entityId, 'animation-state');
    if (!state) return;
    state.familyRole = data.familyRole || state.familyRole || "little sister";

    if (data.actionType === 'thrust') {
      state.arousal = Math.min(1, state.arousal + data.intensity * 0.4);
      state.penetrationDepth = data.intensity;
      state.dirtyTalk = `Fuck your ${state.familyRole} harder Daddy! Fill my womb!`;
    } else if (data.actionType === 'breeding') {
      state.cumInflation = Math.min(2.2, (state.cumInflation||0) + data.intensity * 0.7);
    }
  }

  handleClimax(data) {
    const state = ECS.getComponent(data.entityId, 'animation-state');
    if (state) {
      state.arousal = 1;
      state.cumInflation = 2.0;
      state.currentExpression = 'brokenAhegao';
      EventBus.emit('fluid:squirt', {entityId: data.entityId, volume: 1.8});
    }
  }
}

ECS.registerSystem(new UltraDegenerateAnimationSystem());
