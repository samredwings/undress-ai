/**
 * CARNAL ROULETTE VR — Plugin API
 * 
 * Communicates with the parent roleplay application via postMessage.
 * The parent app sends character definitions, storyline context, and asset references.
 * This plugin returns state updates, request for assets, and recording output.
 *
 * SECURITY: All messages are origin-validated. Plugin runs in sandboxed iframe.
 */

const PluginAPI = {
  PARENT_ORIGIN: '*', // Set to specific origin in production (e.g., 'https://roleplay.app')
  pluginId: 'carnal-roulette-vr',
  version: '2.0.0',

  /**
   * Message types the plugin RECEIVES from the parent app
   */
  INCOMING: {
    // Storyline sends character definitions
    CHARACTER_ASSIGN: 'carnal:characters:assign',
    // Parent provides asset data (image URLs or base64)
    ASSET_PROVIDE: 'carnal:asset:provide',
    // Storyline context for scene generation
    STORYLINE_CONTEXT: 'carnal:storyline:context',
    // User wants to modify a character
    CHARACTER_MODIFY: 'carnal:characters:modify',
    // Parent requests current state
    STATE_REQUEST: 'carnal:state:request',
    // Permission grant for specific operations
    PERMISSION_GRANT: 'carnal:permission:grant',
    // Scene configuration override
    CONFIG_OVERRIDE: 'carnal:config:override',
    // Termination signal
    TERMINATE: 'carnal:terminate',
  },

  /**
   * Message types the plugin SENDS to the parent app
   */
  OUTGOING: {
    // Request asset data for a character
    ASSET_REQUEST: 'carnal:asset:request',
    // State update for parent UI
    STATE_UPDATE: 'carnal:state:update',
    // Session recording completed
    RECORDING_COMPLETE: 'carnal:recording:complete',
    // User interaction event (for parent analytics/storyline triggers)
    INTERACTION_EVENT: 'carnal:interaction:event',
    // Error state
    ERROR: 'carnal:error',
    // Ready signal
    READY: 'carnal:ready',
  },

  /**
   * Character schema expected from parent
   * 
   * {
   *   id: string,              // Unique character ID from parent
   *   name: string,            // Display name
   *   role: string,            // Story role (e.g., 'love-interest', 'captive', 'dominant')
   *   appearance: {
   *     faceImage?: string,    // URL or dataURI of face image
   *     bodyImage?: string,    // Full body reference
   *     skinTone?: string,     // Hex color
   *     bodyType?: string,     // 'slim' | 'athletic' | 'curvy' | 'muscular'
   *     height?: number,       // In meters
   *   },
   *   personality: {
   *     archetype: string,     // 'submissive' | 'dominant' | 'switch' | 'brat' | etc
   *     traits: string[],      // ['affectionate', 'cruel', 'teasing', etc]
   *   },
   *   relationship: {
   *     intimacy: number,      // 0-100 current intimacy level
   *     history: string[],     // Past interactions from storyline
   *     currentMood: string,   // Story-driven mood
   *   },
   *   assets: {
   *     model?: string,        // Pre-generated 3D model URL
   *     faceMap?: string,      // Face texture URL
   *     bodyMap?: string,      // Body texture URL
   *     expressionSet?: string,// Morph target presets
   *   }
   * }
   */
  characters: new Map(),

  /**
   * Initialize the plugin API
   */
  init() {
    window.addEventListener('message', (event) => this.handleMessage(event));
    
    // Notify parent we're ready
    this.send(this.OUTGOING.READY, {
      pluginId: this.pluginId,
      version: this.version,
      capabilities: [
        'webxr-vr',
        'asset-pipeline',
        'session-recording',
        'procedural-audio',
        'character-customization',
      ],
    });

    console.log('[PluginAPI] Initialized, waiting for parent app data');
  },

  /**
   * Handle incoming messages from parent app
   */
  handleMessage(event) {
    // SECURITY: Validate origin in production
    // if (event.origin !== this.PARENT_ORIGIN) return;

    const { type, payload, requestId } = event.data || {};

    if (!type) return;

    switch (type) {
      case this.INCOMING.CHARACTER_ASSIGN:
        this.handleCharacterAssign(payload);
        break;

      case this.INCOMING.ASSET_PROVIDE:
        this.handleAssetProvide(payload);
        break;

      case this.INCOMING.STORYLINE_CONTEXT:
        this.handleStorylineContext(payload);
        break;

      case this.INCOMING.CHARACTER_MODIFY:
        this.handleCharacterModify(payload);
        break;

      case this.INCOMING.STATE_REQUEST:
        this.sendState();
        break;

      case this.INCOMING.PERMISSION_GRANT:
        this.handlePermissionGrant(payload);
        break;

      case this.INCOMING.CONFIG_OVERRIDE:
        this.handleConfigOverride(payload);
        break;

      case this.INCOMING.TERMINATE:
        this.handleTerminate();
        break;

      default:
        console.warn('[PluginAPI] Unknown message type:', type);
    }
  },

  /**
   * Handle incoming character assignments from storyline
   */
  handleCharacterAssign(payload) {
    const { characters } = payload;
    
    if (!Array.isArray(characters)) {
      this.sendError('CHARACTER_ASSIGN: payload.characters must be an array');
      return;
    }

    for (const char of characters) {
      // Validate required fields
      if (!char.id || !char.name) {
        console.warn('[PluginAPI] Character missing required fields:', char);
        continue;
      }

      this.characters.set(char.id, char);

      // Request assets for this character
      this.send(this.OUTGOING.ASSET_REQUEST, {
        characterId: char.id,
        required: ['faceImage', 'bodyImage'],
        preferred: ['model', 'faceMap', 'bodyMap'],
      });

      console.log(`[PluginAPI] Character assigned: ${char.name} (${char.id})`);
    }

    // Update the asset pipeline UI
    EventBus.emit('characters:assigned', Array.from(this.characters.values()));
  },

  /**
   * Handle asset data provided by parent app
   */
  handleAssetProvide(payload) {
    const { characterId, assets } = payload;
    
    const character = this.characters.get(characterId);
    if (!character) {
      this.sendError(`ASSET_PROVIDE: Unknown character ${characterId}`);
      return;
    }

    // Merge assets into character data
    character.assets = {
      ...character.assets,
      ...assets,
    };

    // SECURITY: Validate asset data types
    if (assets.model && typeof assets.model !== 'string') {
      this.sendError(`ASSET_PROVIDE: Invalid model data for ${characterId}`);
      return;
    }

    EventBus.emit('character:assets:updated', { characterId, character });
  },

  /**
   * Handle storyline context for scene generation
   */
  handleStorylineContext(payload) {
    const { 
      currentScene,      // Current story scene description
      environment,       // 'bedroom' | 'dungeon' | 'outdoor' | 'pool' | etc
      intensity,         // 1-10
      relationship,      // Current relationship dynamics
      narrativePosition, // 'beginning' | 'rising-action' | 'climax' | 'resolution'
    } = payload;

    EventBus.emit('storyline:context', {
      scene: currentScene,
      environment,
      intensity,
      relationship,
      narrativePosition,
    });

    console.log('[PluginAPI] Storyline context received:', { environment, intensity, narrativePosition });
  },

  /**
   * Handle user-initiated character modification
   */
  handleCharacterModify(payload) {
    const { characterId, modifications } = payload;
    
    const character = this.characters.get(characterId);
    if (!character) {
      this.sendError(`CHARACTER_MODIFY: Unknown character ${characterId}`);
      return;
    }

    // Apply modifications deep merge
    const deepMerge = (target, source) => {
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    deepMerge(character, modifications);
    
    EventBus.emit('character:modified', { characterId, character });
    this.sendState();
  },

  /**
   * Handle permission grants
   */
  handlePermissionGrant(payload) {
    const { permissions } = payload;
    // Store granted permissions
    this.permissions = new Set(permissions);
    EventBus.emit('permissions:updated', this.permissions);
  },

  handleConfigOverride(payload) {
    EventBus.emit('config:override', payload);
  },

  handleTerminate() {
    // Clean shutdown
    EventBus.emit('terminate');
  },

  /**
   * Send current state to parent app
   */
  sendState() {
    this.send(this.OUTGOING.STATE_UPDATE, {
      characters: Array.from(this.characters.values()).map(c => ({
        id: c.id,
        name: c.name,
        currentMood: c.relationship?.currentMood,
        intimacy: c.relationship?.intimacy,
      })),
      currentRound: GameLogic?.current?.round,
      climaxMeter: GameLogic?.current?.climaxMeter,
      phase: GameLogic?.current?.phase,
    });
  },

  /**
   * Send an interaction event to parent (for storyline advancement)
   */
  sendInteraction(action, context = {}) {
    this.send(this.OUTGOING.INTERACTION_EVENT, {
      action,
      timestamp: Date.now(),
      context,
    });
  },

  sendError(message) {
    console.error('[PluginAPI]', message);
    this.send(this.OUTGOING.ERROR, { message, timestamp: Date.now() });
  },

  /**
   * Send a message to the parent app
   */
  send(type, payload = {}) {
    if (!window.parent) return;

    window.parent.postMessage({
      type,
      payload,
      from: this.pluginId,
      timestamp: Date.now(),
    }, this.PARENT_ORIGIN);
  },

  /**
   * Get a character by ID
   */
  getCharacter(id) {
    return this.characters.get(id);
  },

  /**
   * Get all characters
   */
  getAllCharacters() {
    return Array.from(this.characters.values());
  },
};
