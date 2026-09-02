/**
 * CARNAL ROULETTE VR — FLUID SYSTEM
 * Visible cum ropes, squirting arcs, dripping, breeding mess
 */

class FluidSystem {
  constructor() {
    this.name = 'FluidSystem';
    this.particles = [];
  }

  init() {
    EventBus.on('fluid:squirt', d => this.createSquirt(d));
    EventBus.on('fluid:creampie', d => this.createCumLoad(d));
  }

  createSquirt(data) {
    console.log(`💦 ${data.entityId} squirting hard - incest pussy juice everywhere`);
    // In real Three.js: spawn particle system with velocity arc
  }

  createCumLoad(data) {
    console.log(`🥛 Massive creampie into ${data.familyRole || 'family slut'} - belly swelling`);
  }

  update() {
    // Simulate dripping trails, pooling on floor, etc.
  }
}

window.FluidSystem = new FluidSystem();
ECS.registerSystem(window.FluidSystem);
