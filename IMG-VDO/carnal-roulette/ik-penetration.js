/**
 * CARNAL ROULETTE VR — IK PENETRATION SOLVER
 * Realistic thrusting & deep womb fucking
 */

class IKPenetrationSolver {
  updatePenetration(entityId, targetDepth, hipTarget) {
    const state = ECS.getComponent(entityId, 'animation-state');
    if (state) {
      state.penetrationDepth = Math.min(1.0, targetDepth);
      EventBus.emit('penetration:update', {entityId, depth: state.penetrationDepth});
      console.log(`🍆 Deep ${state.familyRole || 'cunt'} penetration at ${targetDepth.toFixed(2)}`);
    }
  }
}

window.IKPenetration = new IKPenetrationSolver();
