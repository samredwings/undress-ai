/**
 * CARNAL ROULETTE VR — ECS Core
 * 
 * Entity-Component-System architecture.
 * Entities are just IDs. Components are pure data. Systems are logic.
 * All entities, components, and systems are managed here.
 */

class ECSWorld {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map(); // Map<entityId, Map<componentType, data>>
    this.systems = [];
    this.componentTypes = new Map(); // Map<componentType, Set<entityId>>
  }

  /**
   * Create a new entity
   * @returns {number} Entity ID
   */
  createEntity() {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, new Map());
    EventBus.emit('ecs:entity:created', id);
    return id;
  }

  /**
   * Destroy an entity and all its components
   */
  destroyEntity(id) {
    if (!this.entities.has(id)) return;
    
    // Remove from component type indices
    for (const [type, componentData] of this.components.get(id)) {
      const typeSet = this.componentTypes.get(type);
      if (typeSet) typeSet.delete(id);
    }

    this.entities.delete(id);
    this.components.delete(id);
    EventBus.emit('ecs:entity:destroyed', id);
  }

  /**
   * Add a component to an entity
   * @param {number} entityId
   * @param {string} type - Component type name
   * @param {Object} data - Component data
   */
  addComponent(entityId, type, data = {}) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    const entityComponents = this.components.get(entityId);
    entityComponents.set(type, { ...data });

    // Index by component type for fast queries
    if (!this.componentTypes.has(type)) {
      this.componentTypes.set(type, new Set());
    }
    this.componentTypes.get(type).add(entityId);

    EventBus.emit(`component:added:${type}`, { entityId, data });
  }

  /**
   * Get a component from an entity
   */
  getComponent(entityId, type) {
    const entityComponents = this.components.get(entityId);
    return entityComponents?.get(type) || null;
  }

  /**
   * Update a component's data (partial merge)
   */
  updateComponent(entityId, type, data) {
    const component = this.getComponent(entityId, type);
    if (!component) {
      this.addComponent(entityId, type, data);
      return;
    }

    Object.assign(component, data);
    EventBus.emit(`component:updated:${type}`, { entityId, data });
  }

  /**
   * Remove a component from an entity
   */
  removeComponent(entityId, type) {
    const entityComponents = this.components.get(entityId);
    if (!entityComponents) return;

    entityComponents.delete(type);
    const typeSet = this.componentTypes.get(type);
    if (typeSet) typeSet.delete(entityId);
    
    EventBus.emit(`component:removed:${type}`, entityId);
  }

  /**
   * Query all entities that have ALL specified component types
   * @param {string[]} types - Component types
   * @returns {number[]} Array of entity IDs
   */
  query(types) {
    if (types.length === 0) return [];
    
    // Start with the smallest component set
    const sorted = types
      .map(t => ({ type: t, set: this.componentTypes.get(t) || new Set() }))
      .sort((a, b) => a.set.size - b.set.size);

    let result = new Set(sorted[0].set);
    
    for (let i = 1; i < sorted.length; i++) {
      result = new Set([...result].filter(e => sorted[i].set.has(e)));
    }

    return Array.from(result);
  }

  /**
   * Register a system
   */
  registerSystem(system) {
    this.systems.push(system);
    if (system.init) system.init(this);
    EventBus.emit('ecs:system:registered', system.name || 'unnamed');
  }

  /**
   * Update all systems (called each frame)
   * @param {number} delta - Time since last frame in seconds
   * @param {number} elapsed - Total elapsed time
   */
  update(delta, elapsed) {
    for (const system of this.systems) {
      if (system.update) {
        try {
          system.update(this, delta, elapsed);
        } catch (err) {
          console.error(`[ECS] Error in system "${system.name}":`, err);
        }
      }
    }
  }

  /**
   * Serialize the entire world state for save/transfer
   */
  serialize() {
    const state = {};
    for (const [entityId, comps] of this.components) {
      state[entityId] = {};
      for (const [type, data] of comps) {
        state[entityId][type] = data;
      }
    }
    return state;
  }

  /**
   * Deserialize and restore world state
   */
  deserialize(state) {
    this.clear();
    for (const [entityIdStr, components] of Object.entries(state)) {
      const id = parseInt(entityIdStr);
      this.entities.add(id);
      this.components.set(id, new Map());
      for (const [type, data] of Object.entries(components)) {
        this.addComponent(id, type, data);
      }
      if (id >= this.nextEntityId) this.nextEntityId = id + 1;
    }
  }

  clear() {
    this.entities.clear();
    this.components.clear();
    this.componentTypes.clear();
    this.nextEntityId = 1;
  }
}

// Global world instance
window.ECS = new ECSWorld();
