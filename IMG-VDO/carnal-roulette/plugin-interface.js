/**
 * CARNAL ROULETTE VR — Plugin Interface
 * 
 * Defines the contract between this module and the parent roleplay app.
 * The parent app loads this module in an iframe or sandboxed container
 * and communicates via postMessage / a shared event bus.
 *
 * @module carnalRoulette
 * @namespace carnalRoulette.module
 */

const PluginInterface = (() => {
  const PARENT_ORIGIN = (() => {
    try {
      return new URL(document.referrer).origin || '*';
    } catch(e) {
      return '*';
    }
  })();

  const API_VERSION = '2.1';
  let parentProxy = null;
  let pendingRequests = new Map();
  let requestCounter = 0;

  /**
   * Validate a character profile from parent app
   * @param {Object} profile 
   * @returns {Object} validated profile with defaults
   */
  const validateCharacterProfile = (profile) => {
    const schema = {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true },
      age: { type: 'number', min: 18, max: 120, default: 28 },
      gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'trans-male', 'trans-female', 'fluid'], default: 'female' },
      species: { type: 'string', default: 'human' },
      appearance: {
        type: 'object',
        properties: {
          hairColor: { type: 'string', default: '#442211' },
          hairStyle: { type: 'string', default: 'long' },
          eyeColor: { type: 'string', default: '#336699' },
          skinTone: { type: 'string', default: '#e8c4a0' },
          height: { type: 'number', default: 165 },
          build: { type: 'string', enum: ['slim', 'athletic', 'curvy', 'muscular', 'voluptuous', 'petite'], default: 'athletic' },
          chestSize: { type: 'string', default: 'medium' },
          genitalia: { type: 'string', default: 'default' },
        },
      },
      personality: {
        type: 'object',
        properties: {
          archetype: { type: 'string', default: 'custom' },
          traits: { type: 'array', items: { type: 'string' }, default: [] },
          dominance: { type: 'number', min: 0, max: 100, default: 50 },
          submission: { type: 'number', min: 0, max: 100, default: 50 },
          libido: { type: 'number', min: 0, max: 100, default: 60 },
          experience: { type: 'string', enum: ['virgin', 'novice', 'experienced', 'expert'], default: 'experienced' },
        },
      },
      relationship: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['stranger', 'acquaintance', 'friend', 'lover', 'partner', 'owner', 'owned', 'master', 'pet', 'rival'], default: 'stranger' },
          intimacy: { type: 'number', min: 0, max: 100, default: 30 },
          trust: { type: 'number', min: 0, max: 100, default: 30 },
          submission: { type: 'number', min: 0, max: 100, default: 30 },
        },
      },
      media: {
        type: 'object',
        properties: {
          portraitImage: { type: 'string', nullable: true },
          fullBodyImage: { type: 'string', nullable: true },
          referenceImages: { type: 'array', items: { type: 'string' }, default: [] },
          avatarUrl: { type: 'string', nullable: true },
        },
      },
    };

    // Deep merge with defaults
    const applyDefaults = (obj, schemaNode) => {
      if (!schemaNode.properties) return obj || {};
      const result = { ...obj };
      for (const [key, def] of Object.entries(schemaNode.properties)) {
        if (result[key] === undefined || result[key] === null) {
          if (def.default !== undefined) {
            result[key] = typeof def.default === 'object' && !Array.isArray(def.default)
              ? { ...def.default }
              : def.default;
          }
        }
        if (def.properties && typeof result[key] === 'object') {
          result[key] = applyDefaults(result[key], def);
        }
      }
      return result;
    };

    return applyDefaults(profile || {}, { properties: schema });
  };

  /**
   * Parent app communication proxy
   */
  const createParentProxy = () => {
    const proxy = {
      request(method, params = {}) {
        return new Promise((resolve, reject) => {
          const id = ++requestCounter;
          pendingRequests.set(id, { resolve, reject, timeout: setTimeout(() => {
            pendingRequests.delete(id);
            reject(new Error(`Parent RPC timeout: ${method}`));
          }, 10000) });
          
          window.parent.postMessage({
            type: 'carnal-roulette-rpc',
            version: API_VERSION,
            id,
            method,
            params,
          }, PARENT_ORIGIN);
        });
      },

      getCharacter(characterId) {
        return proxy.request('getCharacter', { characterId });
      },

      getSceneContext() {
        return proxy.request('getSceneContext', {});
      },

      getRelationshipState(characterId, targetId) {
        return proxy.request('getRelationshipState', { characterId, targetId });
      },

      triggerNarrativeEvent(eventType, data) {
        return proxy.request('triggerNarrativeEvent', { eventType, data });
      },

      logAnalytics(event, payload) {
        return proxy.request('logAnalytics', { event, payload }).catch(() => {});
      },

      getCharacterMedia(characterId, assetType) {
        return proxy.request('getCharacterMedia', { characterId, assetType });
      },

      updateCharacterState(characterId, stateDelta) {
        return proxy.request('updateCharacterState', { characterId, stateDelta });
      },
    };

    // Listen for responses from parent
    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'carnal-roulette-rpc-response') return;
      const { id, error, result } = event.data;
      const pending = pendingRequests.get(id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      pendingRequests.delete(id);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    });

    return proxy;
  };

  /**
   * Lifecycle: mount this module into the parent app
   */
  const mount = async (config = {}) => {
    console.log(`[PluginInterface] Mounting Carnal Roulette VR v${API_VERSION}`);
    
    parentProxy = createParentProxy();
    
    // Signal parent that module is ready
    window.parent.postMessage({
      type: 'carnal-roulette-ready',
      version: API_VERSION,
      config: {
        capabilities: ['vr', 'asset-generation', 'state-sync', 'recording'],
        maxPartners: 4,
        supportedSceneTypes: ['bedroom', 'dungeon', 'mirror', 'outdoor', 'pool', 'narrative'],
      },
    }, PARENT_ORIGIN);

    return { success: true, version: API_VERSION };
  };

  /**
   * Lifecycle: unmount cleanly
   */
  const unmount = async () => {
    console.log('[PluginInterface] Unmounting');
    // Clean up all pending requests
    for (const [id, pending] of pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Module unmounted'));
    }
    pendingRequests.clear();
    
    // Signal parent
    window.parent.postMessage({ type: 'carnal-roulette-unmounted' }, PARENT_ORIGIN);
  };

  /**
   * Sync full state from parent app
   */
  const syncState = async (statePayload) => {
    if (!parentProxy) {
      console.warn('[PluginInterface] No parent proxy — cannot sync state');
      return;
    }

    const { characters, sceneContext, narrativeState } = statePayload || {};
    
    // Validate and apply character profiles
    const validatedCharacters = (characters || []).map(c => validateCharacterProfile(c));
    
    return {
      characters: validatedCharacters,
      config: {
        sceneType: sceneContext?.sceneType || GameLogic.config.sceneType,
        intensityLevel: sceneContext?.intensity || GameLogic.config.intensityLevel,
        kinks: sceneContext?.kinks || [],
      },
      narrative: narrativeState || null,
    };
  };

  /**
   * Handle a narrative event from the parent app's story engine
   */
  const handleNarrativeEvent = async (event) => {
    if (!event?.type) return;

    switch (event.type) {
      case 'scene-entry':
        // Parent app is transitioning into an adult scene
        await AssetPipeline.generateFromNarrativeContext(event.context);
        break;

      case 'character-mood-change':
        // Update character mood/reactivity based on story progression
        StorylineController.applyCharacterMoodChange(event.characterId, event.newMood);
        break;

      case 'relationship-shift':
        // The story changed the relationship dynamic
        StorylineController.applyRelationshipShift(event.characterId, event.delta);
        break;

      case 'dialogue-trigger':
        // Show a dialogue overlay during the scene
        UIController.showDialogue(event.speaker, event.line);
        break;

      default:
        console.log(`[PluginInterface] Unhandled narrative event: ${event.type}`);
    }
  };

  /**
   * Public API surface
   */
  const api = {
    module: {
      mount,
      unmount,
      syncState,
      handleNarrativeEvent,
    },
    parent: () => parentProxy,
    validateCharacter: validateCharacterProfile,
    getApiVersion: () => API_VERSION,
  };

  // Expose globally
  window.carnalRoulette = api;

  return api;
})();
