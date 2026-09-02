/**
 * CARNAL ROULETTE VR — VR Scene Manager
 * Handles Three.js scene, WebXR, stereo rendering, first-person camera
 */

const VRScene = {
  renderer: null,
  scene: null,
  camera: null,
  clock: null,
  xrManager: null,
  isVR: false,

  characters: [],
  environment: null,
  lighting: null,
  
  animationId: null,
  isRunning: false,

  async init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('VR container not found');

    // === RENDERER ===
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.xr.enabled = true;
    // === WebXR Button ===
    const vrButton = document.getElementById('btn-enter-vr');
    if (this.renderer.xr) {
      document.body.appendChild(VRButton.createButton(this.renderer));
    }

    container.appendChild(this.renderer.domElement);

    // === SCENE ===
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0004);
    this.scene.fog = new THREE.FogExp2(0x0a0004, 0.015);

    // === CAMERA (First Person) ===
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.6, 0); // Eye height
    
    // === CLOCK ===
    this.clock = new THREE.Clock();

    // === LIGHTING ===
    this.setupLighting();

    // === ENVIRONMENT ===
    await this.buildEnvironment();

    // === CHARACTERS ===
    await this.spawnCharacters();

    // === WEBXR HANDLERS ===
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isVR = true;
      document.getElementById('recording-bar').classList.remove('hidden');
      console.log('[VR] Session started');
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isVR = false;
      console.log('[VR] Session ended');
    });

    // === RESIZE ===
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // === START LOOP ===
    this.isRunning = true;
    this.animate();

    console.log('[VRScene] Initialized');
  },

  setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x442233, 0.4);
    this.scene.add(ambient);

    // Main key light (warm, from above-right)
    const key = new THREE.DirectionalLight(0xff8866, 1.2);
    key.position.set(2, 3, 1);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    this.scene.add(key);

    // Fill light (cool, from left)
    const fill = new THREE.DirectionalLight(0x4466ff, 0.5);
    fill.position.set(-2, 1, 1.5);
    this.scene.add(fill);

    // Rim light (from behind, pink)
    const rim = new THREE.DirectionalLight(0xff0066, 0.6);
    rim.position.set(0, 1, -3);
    this.scene.add(rim);

    // Red accent point lights for mood
    const mood1 = new THREE.PointLight(0xff0044, 0.3, 5);
    mood1.position.set(1.5, 0.5, 1);
    this.scene.add(mood1);

    const mood2 = new THREE.PointLight(0x6600ff, 0.2, 5);
    mood2.position.set(-1.5, 0.3, -1);
    this.scene.add(mood2);

    this.lighting = { ambient, key, fill, rim, mood1, mood2 };
  },

  async buildEnvironment() {
    const sceneType = GameLogic.config.sceneType || 'bedroom';
    
    // Floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a0010,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Room bounds (dark walls)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0d0008,
      roughness: 0.9,
      side: THREE.BackSide,
    });

    const walls = [
      { pos: [0, 1.5, -3], rot: [0, 0, 0] },   // back
      { pos: [-3, 1.5, 0], rot: [0, Math.PI/2, 0] }, // left
      { pos: [3, 1.5, 0], rot: [0, -Math.PI/2, 0] }, // right
    ];
    
    for (const w of walls) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), wallMat);
      wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
      wall.rotation.set(w.rot[0], w.rot[1], w.rot[2]);
      this.scene.add(wall);
    }

    // Scene-specific elements
    switch (sceneType) {
      case 'bedroom':
        this.addBed();
        break;
      case 'dungeon':
        this.addDungeonProps();
        break;
      case 'mirror':
        this.addMirror();
        break;
      case 'pool':
        this.addPool();
        break;
      default:
        this.addBed();
    }

    this.environment = { floor, roomBounds: walls };
  },

  addBed() {
    // Simple bed platform
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x220011, roughness: 0.9 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 2.2), bedMat);
    bed.position.set(0, 0.15, -1);
    bed.receiveShadow = true;
    bed.castShadow = true;
    this.scene.add(bed);

    // Soft surface (sheet)
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x330022,
      roughness: 0.95,
      metalness: 0,
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), sheetMat);
    sheet.position.set(0, 0.31, -1);
    sheet.rotation.x = -Math.PI / 2;
    sheet.receiveShadow = true;
    this.scene.add(sheet);
  },

  addDungeonProps() {
    // Cross / X-frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2), frameMat);
    pole.position.set(1.2, 1, -1);
    this.scene.add(pole);

    // Restraints (cuffs hanging)
    const cuffMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 12), cuffMat);
    cuff.position.set(1.35, 0.5, -1);
    cuff.rotation.x = Math.PI / 2;
    this.scene.add(cuff);
  },

  addMirror() {
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      metalness: 0.9,
      roughness: 0.05,
    });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2), mirrorMat);
    mirror.position.set(0, 1, -2.5);
    this.scene.add(mirror);
  },

  addPool() {
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x004466,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), waterMat);
    water.position.set(0, 0.02, -0.5);
    water.rotation.x = -Math.PI / 2;
    this.scene.add(water);
  },

  async spawnCharacters() {
    // Player body (first person — only see hands/limbs at bottom of view)
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0xffccaa,
      roughness: 0.6,
      metalness: 0,
    });

    // Player hands visible in first-person
    const handGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, playerMat);
    leftHand.position.set(-0.3, 0.3, -0.5);
    this.camera.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, playerMat);
    rightHand.position.set(0.3, 0.3, -0.5);
    this.camera.add(rightHand);

    // Player forearms
    const armGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3);
    const leftArm = new THREE.Mesh(armGeo, playerMat);
    leftArm.position.set(-0.25, 0.1, -0.4);
    leftArm.rotation.x = 0.5;
    this.camera.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, playerMat);
    rightArm.position.set(0.25, 0.1, -0.4);
    rightArm.rotation.x = 0.5;
    this.camera.add(rightArm);

    // Add camera to scene
    this.scene.add(this.camera);

    // Partner characters
    const partnerPositions = [
      { x: 0, y: 0, z: -1.3 },
      { x: -0.8, y: 0, z: -1.0 },
      { x: 0.8, y: 0, z: -1.0 },
      { x: 0, y: 0, z: -0.5 },
    ];

    for (let i = 0; i < GameLogic.partners.length; i++) {
      const partner = GameLogic.partners[i];
      const pos = partnerPositions[i] || { x: (i - 1) * 0.6, y: 0, z: -1.0 };
      
      const charData = AssetPipeline.assets[`partner${i + 1}`]?.characterData;
      const mesh = CharacterSystem.buildCharacterMesh(charData || { bodyConfig: {} }, this.scene);
      
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData = { partnerId: partner.id, name: partner.name };
      
      this.scene.add(mesh);
      this.characters.push(mesh);
    }
  },

  animate() {
    if (!this.isRunning) return;

    this.animationId = this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Tick game logic
      GameLogic.tick();

      // Animate characters (subtle breathing)
      for (let i = 0; i < this.characters.length; i++) {
        const char = this.characters[i];
        const breath = Math.sin(elapsed * 2 + i * 1.5) * 0.003;
        char.position.y += breath;
      }

      // Update climax visual (pulsing light)
      const climax = GameLogic.current.climaxMeter / 100;
      const pulse = 0.3 + (climax * 0.7);
      if (this.lighting?.mood1) {
        this.lighting.mood1.intensity = pulse * 0.5;
      }

      // Update HUD
      this.updateHUD();

      // Render via WebXR
      this.renderer.render(this.scene, this.camera);
    });
  },

  updateHUD() {
    const state = GameLogic.current;
    document.getElementById('hud-round').textContent = `ROUND ${state.round}`;
    document.getElementById('hud-intensity').textContent = `INTENSITY: ${Math.floor(state.intensity)}%`;
    document.getElementById('hud-act').textContent = state.act || 'READY';
    
    const remaining = state.maxTimer - state.timer;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    document.getElementById('hud-timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    document.getElementById('climax-fill').style.width = `${state.climaxMeter}%`;

    // Partner status badges
    const container = document.getElementById('partner-status');
    container.innerHTML = GameLogic.partners.map(p => `
      <div class="partner-badge">
        <span class="name">${p.name}</span>
        <span class="mood">${p.mood}</span>
        <div style="font-size:10px; color:#ff6699;">${Math.floor(p.climax)}%</div>
      </div>
    `).join('');
  },

  destroy() {
    this.isRunning = false;
    if (this.animationId) {
      this.renderer.setAnimationLoop(null);
    }
    if (this.renderer.xr) {
      this.renderer.xr.removeEventListener('sessionstart');
      this.renderer.xr.removeEventListener('sessionend');
    }
    this.renderer.dispose();
  },
};

   
