/**
 * CARNAL ROULETTE VR — Asset Loader
 * 
 * Handles secure loading of character assets from the parent app.
 * Supports: image textures, 3D models (GLB), audio files.
 * All assets are validated before being injected into the 3D scene.
 */

class AssetLoader {
  constructor() {
    this.loadingQueue = new Map();
    this.cache = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = null; // Initialized when Three.js GLTFLoader is available
  }

  /**
   * Load a character's full asset set
   * @param {Object} character - Character data from parent app
   * @returns {Promise<Object>} Loaded assets
   */
  async loadCharacterAssets(character) {
    const { id, assets } = character;
    
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const result = {
      textures: {},
      model: null,
      morphTargets: null,
    };

    const promises = [];

    // Load face texture
    if (assets?.faceMap || assets?.faceImage) {
      promises.push(
        this.loadTexture(assets.faceMap || assets.faceImage)
          .then(tex => { result.textures.face = tex; })
          .catch(err => console.warn(`[AssetLoader] Face texture failed for ${id}:`, err.message))
      );
    }

    // Load body texture
    if (assets?.bodyMap || assets?.bodyImage) {
      promises.push(
        this.loadTexture(assets.bodyMap || assets.bodyImage)
          .then(tex => { result.textures.body = tex; })
          .catch(err => console.warn(`[AssetLoader] Body texture failed for ${id}:`, err.message))
      );
    }

    // Load 3D model (GLB)
    if (assets?.model) {
      promises.push(
        this.loadGLB(assets.model)
          .then(model => { result.model = model; })
          .catch(err => console.warn(`[AssetLoader] Model load failed for ${id}:`, err.message))
      );
    }

    // Load expression morph targets
    if (assets?.expressionSet) {
      promises.push(
        this.loadJSON(assets.expressionSet)
          .then(morphs => { result.morphTargets = morphs; })
          .catch(err => console.warn(`[AssetLoader] Expression set failed for ${id}:`, err.message))
      );
    }

    await Promise.allSettled(promises);
    
    this.cache.set(id, result);
    return result;
  }

  /**
   * Load a texture from URL or dataURI
   * SECURITY: Validates image source
   */
  loadTexture(source) {
    return new Promise((resolve, reject) => {
      if (!source) return reject(new Error('No source provided'));

      // Validate source
      if (!this.isValidSource(source)) {
        return reject(new Error('Invalid image source — not allowed origin or protocol'));
      }

      this.textureLoader.load(
        source,
        (texture) => {
          texture.encoding = THREE.sRGBEncoding;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Load a GLB model
   */
  async loadGLB(url) {
    if (!this.gltfLoader) {
      const { GLTFLoader } = await import(
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js'
      );
      this.gltfLoader = new GLTFLoader();
    }

    if (!this.isValidSource(url)) {
      throw new Error('Invalid model source');
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  /**
   * Load a JSON file (for morph target presets)
   */
  async loadJSON(url) {
    if (!this.isValidSource(url)) {
      throw new Error('Invalid JSON source');
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /**
   * SECURITY: Validate asset source URL
   * Prevents loading from untrusted origins or protocols
   */
  isValidSource(source) {
    // Allow data URIs (inline assets from parent app)
    if (source.startsWith('data:')) return true;

    // Allow blob URLs (generated within this plugin)
    if (source.startsWith('blob:')) return true;

    // In production: only allow specific origins
    // const allowedOrigins = ['https://roleplay.app', 'https://cdn.roleplay.app'];
    // try {
    //   const url = new URL(source);
    //   return allowedOrigins.includes(url.origin);
    // } catch { return false; }

    // Dev: allow all (REPLACE IN PRODUCTION)
    try {
      new URL(source);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a procedural body mesh when no 3D model is available
   * Uses character appearance data to create a representative figure
   */
  generateProceduralBody(character) {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: character?.appearance?.skinTone || 0xffccaa,
      roughness: 0.5,
      metalness: 0.0,
    });

    const group = new THREE.Group();
    const bodyConfig = character?.appearance?.bodyType || 'average';

    // Height scaling
    const height = character?.appearance?.height || 1.7;
    const scale = height / 1.7;

    // Build body from segmented geometry
    const segments = this.getBodySegments(bodyConfig);

    // Torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(
        segments.torso.top,
        segments.torso.bottom,
        segments.torso.height * scale,
        16
      ),
      bodyMat
    );
    torso.position.y = segments.torso.yOffset * scale;
    group.add(torso);

    // Head with face texture if available
    const headMat = character?.assets?.faceMap
      ? new THREE.MeshStandardMaterial({ map: null, color: 0xffccaa }) // texture applied later
      : bodyMat;
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * scale, 16, 16),
      headMat
    );
    head.position.y = 0.95 * scale;
    group.add(head);

    // Breasts/Chest (gender-differentiated)
    if (segments.chest) {
      const chestMat = new THREE.MeshStandardMaterial({
        color: character?.appearance?.skinTone || 0xffccaa,
        roughness: 0.4,
      });
      for (const pos of segments.chest.positions) {
        const breast = new THREE.Mesh(
          new THREE.SphereGeometry(pos.size * scale, 10, 10),
          chestMat
        );
        breast.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
        group.add(breast);
      }
    }

    // Arms
    const armMat = new THREE.MeshStandardMaterial({
      color: character?.appearance?.skinTone || 0xffccaa,
      roughness: 0.6,
    });

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.035 * segments.arms.thickness,
          0.03 * segments.arms.thickness,
          0.35 * scale,
          8
        ),
        armMat
      );
      arm.position.set(side * 0.28 * scale, 0.65 * scale, 0);
      arm.rotation.z = side * 0.15;
      group.add(arm);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.045 * segments.legs.thickness,
          0.035 * segments.legs.thickness,
          0.4 * scale,
          8
        ),
        armMat
      );
      leg.position.set(side * 0.1 * scale, 0.2 * scale, 0);
      group.add(leg);
    }

    // Genitalia (if enabled and configured)
    if (segments.genitals) {
      const genMat = new THREE.MeshStandardMaterial({
        color: character?.appearance?.skinTone || 0xffccaa,
        roughness: 0.3,
      });
      const gen = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.02 * segments.genitals.girth,
          0.015 * segments.genitals.girth,
          0.05 * segments.genitals.size * scale,
          8
        ),
        genMat
      );
      gen.position.set(0, 0.05 * scale, 0.08 * scale);
      gen.rotation.x = 0.3;
      group.add(gen);
    }

    // Apply morph targets via userData for animation system
    group.userData = {
      isProcedural: true,
      bodyConfig: bodyConfig,
      height: height,
      segments: segments,
    };

    // Enable shadows
    group.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  /**
   * Body segment definitions for different body types
   */
  getBodySegments(bodyType) {
    const presets = {
      slim: {
        torso: { top: 0.22, bottom: 0.18, height: 0.45, yOffset: 0.55 },
        arms: { thickness: 0.8 },
        legs: { thickness: 0.8 },
        chest: null,
        genitals: { size: 0.5, girth: 0.5 },
      },
      athletic: {
        torso: { top: 0.28, bottom: 0.22, height: 0.48, yOffset: 0.55 },
        arms: { thickness: 1.2 },
        legs: { thickness: 1.2 },
        chest: {
          positions: [
            { x: -0.12, y: 0.75, z: 0.08, size: 0.03 },
            { x: 0.12, y: 0.75, z: 0.08, size: 0.03 },
          ],
        },
        genitals: { size: 0.7, girth: 0.7 },
      },
      curvy: {
        torso: { top: 0.28, bottom: 0.32, height: 0.42, yOffset: 0.55 },
        arms: { thickness: 0.9 },
        legs: { thickness: 1.3 },
        chest: {
          positions: [
            { x: -0.14, y: 0.73, z: 0.09, size: 0.05 },
            { x: 0.14, y: 0.73, z: 0.09, size: 0.05 },
          ],
        },
        genitals: { size: 0.5, girth: 0.5 },
      },
      muscular: {
        torso: { top: 0.32, bottom: 0.26, height: 0.5, yOffset: 0.55 },
        arms: { thickness: 1.5 },
        legs: { thickness: 1.4 },
        chest: {
          positions: [
            { x: -0.15, y: 0.76, z: 0.07, size: 0.04 },
            { x: 0.15, y: 0.76, z: 0.07, size: 0.04 },
          ],
        },
        genitals: { size: 0.8, girth: 0.8 },
      },
      average: {
        torso: { top: 0.25, bottom: 0.22, height: 0.45, yOffset: 0.55 },
        arms: { thickness: 1.0 },
        legs: { thickness: 1.0 },
        chest: null,
        genitals: { size: 0.5, girth: 0.5 },
      },
    };

    return presets[bodyType] || presets.average;
  }

  /**
   * Clear cache for reload
   */
  clearCache() {
    this.cache.clear();
  }
}

window.AssetLoader = new AssetLoader();
