/**
 * CARNAL ROULETTE VR — Desktop First-Person Interaction Controller
 * 
 * This is the primary interaction system for users WITHOUT a VR headset.
 * The "VR" in the name represents the first-person rendered viewpoint,
 * controlled by mouse + keyboard or standard gamepad.
 * 
 * Camera: First-person POV positioned at a configurable height/offset
 * Controls: Mouse look (click-drag), scroll wheel for distance,
 *           number keys or clickable action wheel for scene actions
 * 
 * This system handles:
 * - First-person camera control (orbit around/from character position)
 * - Action selection via radial menu / hotkeys
 * - Mouse interaction with the scene (click body parts)
 * - Speed/depth control via scroll or slider for active actions
 * - UI overlay management
 */

class InteractionController {
  constructor() {
    this.name = 'InteractionController';
    
    // Camera settings
    this.camera = {
      mode: 'first-person',       // 'first-person' | 'orbit' | 'fixed'
      fov: 75,
      position: new THREE.Vector3(0, 1.6, 0),   // Eye height
      target: new THREE.Vector3(0, 1.0, -1.0),  // What we're looking at
      distance: 0,                               // 0 = first person
      minDistance: 0,
      maxDistance: 3,
      sensitivity: 0.003,
      smoothing: 0.1,
      yaw: 0,
      pitch: 0,
      minPitch: -80,
      maxPitch: 80,
    };

    // Input state
    this.input = {
      mouse: { x: 0, y: 0, down: false, locked: false },
      keys: {},
      scroll: 0,
      activeAction: null,
      actionIntensity: 0.5,
      selectedPartnerIndex: 0,
    };

    // Interaction state
    this.state = {
      isInteracting: false,
      currentTarget: null,        // Which character/body part is targeted
      availableActions: [],       // From ActionCatalog
      activeActions: [],          // Currently running actions (thrust, caress, etc.)
      actionWheelVisible: false,
      actionWheelSelection: 0,
      bodyPartHover: null,        // Which body part the mouse is over
    };

    // Body part interaction zones (for clicking on character model)
    this.bodyPartZones = {
      head: { label: 'Head / Mouth', allowedActions: ['kiss', 'whisper', 'oral-give', 'eye-contact'] },
      chest: { label: 'Chest / Breasts', allowedActions: ['caress', 'bite', 'touch-body'] },
      stomach: { label: 'Stomach / Belly', allowedActions: ['caress', 'kiss'] },
      groin: { label: 'Groin / Genitals', allowedActions: ['finger', 'hand-job', 'oral', 'touch-body'] },
      thighs: { label: 'Thighs / Inner Leg', allowedActions: ['caress', 'bite', 'touch-body'] },
      ass: { label: 'Ass / Backside', allowedActions: ['spank', 'caress', 'touch-body'] },
      neck: { label: 'Neck / Throat', allowedActions: ['kiss', 'bite', 'choke', 'whisper'] },
      back: { label: 'Back / Spine', allowedActions: ['caress', 'touch-body'] },
    };

    // Action wheel configuration
    this.actionWheelConfig = {
      radius: 140,
      sectors: 8,
      showLabels: true,
      snapOnRelease: true,
    };

    // UI elements (created on init)
    this.dom = {
      container: null,
      crosshair: null,
      actionWheel: null,
      actionHints: null,
      intensitySlider: null,
      partnerSelect: null,
      statusBar: null,
    };
  }

  /**
   * Initialize the interaction controller
   * Creates UI overlays and sets up event listeners
   */
  init(scene, camera) {
    this.scene = scene;
    this.threeCamera = camera;
    
    this.setupCamera();
    this.createUI();
    this.setupEventListeners();
    this.setupRaycaster();

    console.log('[InteractionController] Initialized desktop first-person controller');
    console.log('[InteractionController] Controls: Click-drag to look around, Scroll to zoom');
    console.log('[InteractionController] Press TAB for action wheel, Click body parts to interact');
  }

  setupCamera() {
    this.threeCamera.fov = this.camera.fov;
    this.threeCamera.position.copy(this.camera.position);
    this.threeCamera.lookAt(this.camera.target);
  }

  createUI() {
    // Container
    this.dom.container = document.getElementById('game-container') || document.body;

    // Crosshair
    this.dom.crosshair = document.createElement('div');
    this.dom.crosshair.id = 'crosshair';
    this.dom.crosshair.innerHTML = `
      <div class="crosshair-ring">
        <div class="crosshair-dot"></div>
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
          <line x1="15" y1="1" x2="15" y2="6" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
          <line x1="15" y1="24" x2="15" y2="29" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
          <line x1="1" y1="15" x2="6" y2="15" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
          <line x1="24" y1="15" x2="29" y2="15" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
        </svg>
      </div>
    `;
    this.dom.crosshair.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      pointer-events: none; z-index: 100; opacity: 1;
      transition: opacity 0.3s ease;
    `;

    // Action wheel (hidden by default)
    this.dom.actionWheel = document.createElement('div');
    this.dom.actionWheel.id = 'action-wheel';
    this.dom.actionWheel.style.cssText = `
      position: fixed; display: none;
      pointer-events: none; z-index: 200;
    `;

    // Action hints (bottom of screen)
    this.dom.actionHints = document.createElement('div');
    this.dom.actionHints.id = 'action-hints';
    this.dom.actionHints.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; z-index: 150;
      pointer-events: none;
    `;

    // Intensity slider
    this.dom.intensitySlider = document.createElement('div');
    this.dom.intensitySlider.id = 'intensity-slider';
    this.dom.intensitySlider.innerHTML = `
      <div class="slider-container">
        <span class="slider-label">Speed</span>
        <input type="range" min="0" max="100" value="50" class="intensity-range">
        <span class="slider-value">50%</span>
      </div>
    `;
    this.dom.intensitySlider.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 150; opacity: 0; transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    this.dom.intensitySlider.querySelector('input').addEventListener('input', (e) => {
      this.input.actionIntensity = e.target.value / 100;
      this.dom.intensitySlider.querySelector('.slider-value').textContent = `${e.target.value}%`;
    });

    // Status bar
    this.dom.statusBar = document.createElement('div');
    this.dom.statusBar.id = 'status-bar';
    this.dom.statusBar.style.cssText = `
      position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
      z-index: 150; pointer-events: none;
      color: rgba(255,255,255,0.7); font-size: 14px;
      text-align: center; font-family: 'Courier New', monospace;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;

    // Append
    this.dom.container.appendChild(this.dom.crosshair);
    this.dom.container.appendChild(this.dom.actionWheel);
    this.dom.container.appendChild(this.dom.actionHints);
    this.dom.container.appendChild(this.dom.intensitySlider);
    this.dom.container.appendChild(this.dom.statusBar);

    // Inject CSS
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #action-wheel .sector {
        position: absolute; width: 60px; height: 60px;
        border-radius: 50%; display: flex; align-items: center;
        justify-content: center; cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px; color: white; text-align: center;
        background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2);
      }
      #action-wheel .sector:hover {
        background: rgba(255,100,100,0.4);
        border-color: rgba(255,100,100,0.8);
        transform: scale(1.15);
      }
      #action-wheel .sector.selected {
        background: rgba(255,50,50,0.5);
        border-color: #ff4444;
      }
      #action-wheel .sector.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      #action-hints .hint {
        padding: 6px 12px; border-radius: 4px;
        background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.7);
        font-size: 12px; font-family: 'Courier New', monospace;
        border: 1px solid rgba(255,255,255,0.1);
        white-space: nowrap;
      }
      #action-hints .hint .key {
        background: rgba(255,255,255,0.15); padding: 1px 6px;
        border-radius: 3px; margin-right: 4px; font-weight: bold;
      }
      .slider-container {
        display: flex; align-items: center; gap: 12px;
        background: rgba(0,0,0,0.6); padding: 8px 16px;
        border-radius: 8px; backdrop-filter: blur(4px);
      }
      .slider-label { color: rgba(255,255,255,0.7); font-size: 12px; }
      .slider-value { color: rgba(255,255,255,0.9); font-size: 12px; min-width: 35px; text-align: right; }
      .intensity-range { width: 120px; accent-color: #ff4444; }
    `;
    document.head.appendChild(style);
  }

  // ===================================================================
  // EVENT LISTENERS
  // ===================================================================
  setupEventListeners() {
    const canvas = this.dom.container.querySelector('canvas') || this.dom.container;

    // Mouse look
    canvas.addEventListener('mousedown', (e) => {
      this.input.mouse.down = true;
      this.input.mouse.x = e.clientX;
      this.input.mouse.y = e.clientY;
      
      // Try to lock pointer for FPS-style look
      if (e.button === 0) {
        canvas.requestPointerLock?.();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        // Pointer lock mode — raw movement
        this.camera.yaw -= e.movementX * this.camera.sensitivity;
        this.camera.pitch -= e.movementY * this.camera.sensitivity;
        this.camera.pitch = THREE.MathUtils.clamp(
          this.camera.pitch,
          this.camera.minPitch * Math.PI / 180,
          this.camera.maxPitch * Math.PI / 180
        );
      } else if (this.input.mouse.down && this.state.actionWheelVisible) {
        // Action wheel selection
        this.updateActionWheelSelection(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      this.input.mouse.down = false;
      if (document.pointerLockElement === canvas) {
        // Fire interaction on click release
        this.handleClickInteraction();
      }
    });

    // Right-click to unlock pointer and show action wheel
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      } else {
        this.toggleActionWheel();
      }
    });

    // Scroll
    document.addEventListener('wheel', (e) => {
      if (this.state.activeActions.length > 0) {
        // Adjust speed/intensity of active action
        this.input.actionIntensity = THREE.MathUtils.clamp(
          this.input.actionIntensity + (e.deltaY > 0 ? -0.05 : 0.05),
          0, 1
        );
        this.updateIntensityUI();
      } else {
        // Zoom in/out
        this.camera.distance = THREE.MathUtils.clamp(
          this.camera.distance + (e.deltaY > 0 ? 0.1 : -0.1),
          this.camera.minDistance,
          this.camera.maxDistance
        );
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.input.keys[e.key.toLowerCase()] = true;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          this.toggleActionWheel();
          break;
        case 'Escape':
          if (this.state.actionWheelVisible) {
            this.hideActionWheel();
          }
          if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
          }
          break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8':
          if (this.state.actionWheelVisible) {
            const idx = parseInt(e.key) - 1;
            this.selectActionFromWheel(idx);
          }
          break;
        case ' ':
          e.preventDefault();
          if (this.state.isInteracting) {
            // Climax trigger
            this.triggerClimax();
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      this.input.keys[e.key.toLowerCase()] = false;
    });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.input.mouse.locked = document.pointerLockElement === canvas;
      this.dom.crosshair.style.opacity = this.input.mouse.locked ? '1' : '0.3';
    });
  }

  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  // ===================================================================
  // ACTION WHEEL
  // ===================================================================
  toggleActionWheel() {
    if (this.state.actionWheelVisible) {
      this.hideActionWheel();
    } else {
      this.showActionWheel();
    }
  }

  showActionWheel() {
    this.state.actionWheelVisible = true;
    this.state.actionWheelSelection = 0;
    
    // Get available actions from catalog
    const context = this.buildActionContext();
    const categorized = ActionCatalog.getCategorizedActions(context);
    
    // Flatten and take up to 8
    const allActions = [
      ...categorized.intimate.slice(0, 2),
      ...categorized.foreplay.slice(0, 2),
      ...categorized.climax.slice(0, 2),
      ...categorized.intense.slice(0, 1),
      ...categorized.aftercare.slice(0, 1),
    ].slice(0, 8);

    this.state.availableActions = allActions;
    this.renderActionWheel(allActions);
    
    this.dom.actionWheel.style.display = 'block';
  }

  hideActionWheel() {
    this.state.actionWheelVisible = false;
    this.dom.actionWheel.style.display = 'none';
    this.dom.actionWheel.innerHTML = '';
  }

  renderActionWheel(actions) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = this.actionWheelConfig.radius;

    this.dom.actionWheel.style.left = '0';
    this.dom.actionWheel.style.top = '0';
    this.dom.actionWheel.style.width = '100%';
    this.dom.actionWheel.style.height = '100%';
    this.dom.actionWheel.style.display = 'flex';
    this.dom.actionWheel.style.alignItems = 'center';
    this.dom.actionWheel.style.justifyContent = 'center';
    this.dom.actionWheel.style.background = 'rgba(0,0,0,0.3)';
    this.dom.actionWheel.style.pointerEvents = 'auto';

    // Create center circle
    const center = document.createElement('div');
    center.style.cssText = `
      position: absolute; width: 50px; height: 50px; border-radius: 50%;
      background: rgba(0,0,0,0.7); border: 2px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 11px; text-align: center;
      pointer-events: none; z-index: 201;
    `;
    center.textContent = 'ACTIONS';
    this.dom.actionWheel.appendChild(center);

    // Create sectors
    actions.forEach((action, i) => {
      const angle = (i / actions.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - 30;
      const y = centerY + radius * Math.sin(angle) - 30;

      const sector = document.createElement('div');
      sector.className = `sector ${i === this.state.actionWheelSelection ? 'selected' : ''}`;
      sector.style.left = `${x}px`;
      sector.style.top = `${y}px`;
      sector.dataset.index = i;

      // Show keybinding
      sector.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:10px;opacity:0.6;">${i + 1}</span>
          <span>${action.label || action.id}</span>
        </div>
      `;

      sector.addEventListener('click', () => {
        this.selectActionFromWheel(i);
      });

      sector.addEventListener('mouseenter', () => {
        this.state.actionWheelSelection = i;
        this.highlightSector(i);
      });

      this.dom.actionWheel.appendChild(sector);
    });

    // Update hints
    this.updateActionHints(actions);
  }

  highlightSector(index) {
    const sectors = this.dom.actionWheel.querySelectorAll('.sector');
    sectors.forEach((s, i) => {
      s.classList.toggle('selected', i === index);
    });
    this.state.actionWheelSelection = index;
  }

  updateActionWheelSelection(mouseX, mouseY) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const count = this.state.availableActions.length;
    
    let idx = Math.round((angle / (2 * Math.PI)) * count) % count;
    if (idx < 0) idx += count;
    
    this.highlightSector(idx);
  }

  selectActionFromWheel(index) {
    const action = this.state.availableActions[index];
    if (!action) return;

    this.hideActionWheel();
    this.startAction(action);
  }

  // ===================================================================
  // CLICK INTERACTION (Raycasting)
  // ===================================================================
  handleClickInteraction() {
    if (!this.threeCamera || !this.scene) return;

    // Raycast from center of screen
    this.mouse.x = 0;
    this.mouse.y = 0;
    this.raycaster.setFromCamera(this.mouse, this.threeCamera);

    // Check for body part intersections
    const partnerMeshes = this.getPartnerMeshes();
    const intersects = this.raycaster.intersectObjects(partnerMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const bodyPart = this.getBodyPartFromMesh(hit.object);
      
      if (bodyPart) {
        // Show interaction popup for this body part
        this.showBodyPartInteraction(bodyPart, hit.point);
      }
    }
  }

  getPartnerMeshes() {
    // Get all character meshes in the scene
    // This depends on how CharacterSystem stores them
    const meshes = [];
    const characters = window.CharacterSystem?.characters || [];
    
    characters.forEach(char => {
      if (char.mesh) {
        meshes.push(char.mesh);
        // Add children
        char.mesh.children.forEach(child => {
          if (child.isMesh) meshes.push(child);
        });
      }
    });

    return meshes;
  }

  getBodyPartFromMesh(mesh) {
    // Map mesh names to body parts
    const name = mesh.name?.toLowerCase() || '';
    
    if (name.includes('head') || name.includes('face') || name.includes('mouth')) return 'head';
    if (name.includes('neck') || name.includes('throat')) return 'neck';
    if (name.includes('chest') || name.includes('breast') || name.includes('torso')) return 'chest';
    if (name.includes('stomach') || name.includes('belly') || name.includes('abs')) return 'stomach';
    if (name.includes('groin') || name.includes('pelvis') || name.includes('pussy') || name.includes('cock') || name.includes('genital')) return 'groin';
    if (name.includes('thigh') || name.includes('leg')) return 'thighs';
    if (name.includes('ass') || name.includes('butt') || name.includes('hip')) return 'ass';
    if (name.includes('back') || name.includes('spine')) return 'back';
    
    return null;
  }

  showBodyPartInteraction(bodyPart, hitPoint) {
    const zone = this.bodyPartZones[bodyPart];
    if (!zone) return;

    // Get filtered actions for this body part
    const context = this.buildActionContext();
    const allowed = zone.allowedActions.filter(action => 
      ActionCatalog.isActionAllowed(context, action)
    );

    if (allowed.length === 0) return;

    // Show a quick popup menu near the hit point
    // For now, just auto-select the first available action
    const action = allowed[0];
    this.startAction({
      id: action,
      targetBodyPart: bodyPart,
      targetPoint: hitPoint,
    });

    // Flash feedback
    this.showInteractionFeedback(bodyPart, action);
  }

  showInteractionFeedback(bodyPart, action) {
    const feedback = document.createElement('div');
    feedback.textContent = `${action} → ${this.bodyPartZones[bodyPart]?.label || bodyPart}`;
    feedback.style.cssText = `
      position: fixed; top: 40%; left: 50%; transform: translateX(-50%);
      color: rgba(255,200,200,0.9); font-size: 16px;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 10px rgba(255,0,0,0.5);
      z-index: 300; pointer-events: none;
      animation: feedbackFade 1.5s ease forwards;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes feedbackFade {
        0% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 1500);
  }

  // ===================================================================
  // START / STOP ACTIONS
  // ===================================================================
  startAction(action) {
    const actionData = ActionCatalog.ALL_ACTIONS[action.id];
    if (!actionData) return;

    // Check if already running this action
    if (this.state.activeActions.some(a => a.id === action.id)) return;

    this.state.isInteracting = true;
    
    // Add to active actions
    this.state.activeActions.push({
      ...actionData,
      id: action.id,
      startTime: Date.now(),
      intensity: this.input.actionIntensity,
      targetBodyPart: action.targetBodyPart,
    });

    // Show intensity slider
    this.dom.intensitySlider.style.opacity = '1';
    this.dom.intensitySlider.style.pointerEvents = 'auto';

    // Update status
    this.updateStatusBar();

    // Emit action start event
    EventBus.emit('action:started', {
      actionId: action.id,
      intensity: this.input.actionIntensity,
      targetBodyPart: action.targetBodyPart,
    });

    // Generate dialogue
    const dialogue = DialogueEngine?.generateDialogue(
      this.state.currentTarget || 'partner',
      {
        actionType: action.id,
        intensity: this.input.actionIntensity,
        phase: 'climax',
        toneResult: NarrativeTone?.resolveSceneTone({}),
      }
    );

    if (dialogue) {
      this.showDialogueLine(dialogue);
    }

    console.log(`[InteractionController] Started action: ${action.id} (intensity: ${(this.input.actionIntensity * 100).toFixed(0)}%)`);
  }

  stopAction(actionId) {
    this.state.activeActions = this.state.activeActions.filter(a => a.id !== actionId);
    
    if (this.state.activeActions.length === 0) {
      this.state.isInteracting = false;
      this.dom.intensitySlider.style.opacity = '0';
      this.dom.intensitySlider.style.pointerEvents = 'none';
    }

    this.updateStatusBar();
    EventBus.emit('action:stopped', { actionId });
  }

  triggerClimax() {
    EventBus.emit('action:climax', {
      intensity: this.input.actionIntensity,
      activeActions: [...this.state.activeActions],
    });

    // Generate climax dialogue
    const dialogue = DialogueEngine?.generateDialogue(
      this.state.currentTarget || 'partner',
      {
        actionType: 'climax-trigger',
        intensity: this.input.actionIntensity,
        phase: 'climax',
        toneResult: NarrativeTone?.resolveSceneTone({}),
      }
    );

    if (dialogue) {
      this.showDialogueLine(dialogue);
    }

    // Flash screen
    this.flashScreen();
    
    // Stop all active actions
    this.state.activeActions = [];
    this.state.isInteracting = false;
    this.dom.intensitySlider.style.opacity = '0';
    this.dom.intensitySlider.style.pointerEvents = 'none';
  }

  flashScreen() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.15); z-index: 250;
      pointer-events: none; animation: climaxFlash 2s ease-out forwards;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes climaxFlash {
        0% { opacity: 1; }
        30% { opacity: 0.5; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); style.remove(); }, 2000);
  }

  // ===================================================================
  // UI UPDATES
  // ===================================================================
  showDialogueLine(text) {
    const dialogueEl = document.getElementById('dialogue-line') || this.createDialogueElement();
    dialogueEl.textContent = text;
    dialogueEl.style.opacity = '1';
    
    // Fade out after a few seconds
    clearTimeout(dialogueEl._timeout);
    dialogueEl._timeout = setTimeout(() => {
      dialogueEl.style.opacity = '0';
    }, 5000);
  }

  createDialogueElement() {
    const el = document.createElement('div');
    el.id = 'dialogue-line';
    el.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      max-width: 600px; text-align: center;
      color: rgba(255,255,255,0.9); font-size: 15px;
      font-family: 'Georgia', serif; font-style: italic;
      text-shadow: 0 2px 8px rgba(0,0,0,0.9);
      padding: 12px 20px; border-radius: 8px;
      background: rgba(0,0,0,0.4);
      z-index: 300; pointer-events: none;
      transition: opacity 0.5s ease;
      opacity: 0;
    `;
    document.body.appendChild(el);
    return el;
  }

  updateActionHints(actions) {
    this.dom.actionHints.innerHTML = '';
    
    actions.slice(0, 6).forEach((action, i) => {
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.innerHTML = `<span class="key">${i + 1}</span> ${action.label || action.id}`;
      this.dom.actionHints.appendChild(hint);
    });
  }

  updateStatusBar() {
    const active = this.state.activeActions;
    if (active.length === 0) {
      this.dom.statusBar.textContent = 'Right-click or TAB for actions | Click body parts | Scroll to zoom';
    } else {
      const names = active.map(a => a.label || a.id).join(', ');
      this.dom.statusBar.textContent = `Active: ${names} | Speed: ${(this.input.actionIntensity * 100).toFixed(0)}% | SPACE: Climax`;
    }
  }

  updateIntensityUI() {
    const percent = (this.input.actionIntensity * 100).toFixed(0);
    const slider = this.dom.intensitySlider.querySelector('input');
    const valueEl = this.dom.intensitySlider.querySelector('.slider-value');
    slider.value = percent;
    valueEl.textContent = `${percent}%`;
  }

  // ===================================================================
  // CONTEXT BUILDER
  // ===================================================================
  buildActionContext() {
    return {
      currentPhase: SceneManager?.currentPhase || 'initiation',
      toneResult: NarrativeTone?.resolveSceneTone({}) || {},
      characterId: this.state.currentTarget || 'partner',
      consentState: DialogueEngine?.consentState || {},
      position: 'missionary', // Could be dynamic
    };
  }

  // ===================================================================
  // UPDATE LOOP
  // ===================================================================
  update(deltaTime) {
    const camera = this.threeCamera;
    if (!camera) return;

    // Update camera position
    if (this.input.mouse.locked) {
      const euler = new THREE.Euler(
        this.camera.pitch,
        this.camera.yaw,
        0,
        'YXZ'
      );
      camera.quaternion.setFromEuler(euler);
    }

    // Handle first-person vs orbit
    if (this.camera.distance > 0.1) {
      // Orbit mode
      const offset = new THREE.Vector3(0, 0, this.camera.distance);
      offset.applyEuler(new THREE.Euler(this.camera.pitch, this.camera.yaw, 0));
      camera.position.copy(this.camera.target).add(offset);
      camera.lookAt(this.camera.target);
    } else {
      // First person
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      camera.position.copy(this.camera.position);
    }

    // Update active actions
    if (this.state.activeActions.length > 0) {
      this.state.activeActions.forEach(action => {
        // Emit ongoing action event with current intensity
        EventBus.emit('action:tick', {
          actionId: action.id,
          intensity: this.input.actionIntensity,
          elapsed: Date.now() - action.startTime,
          targetBodyPart: action.targetBodyPart,
        });

        // Periodically generate dialogue during actions
        if (Math.random() < 0.005) { // ~every 200 frames at 60fps
          const dialogue = DialogueEngine?.generateDialogue(
            this.state.currentTarget || 'partner',
            {
              actionType: action.id,
              intensity: this.input.actionIntensity,
              phase: 'climax',
              toneResult: NarrativeTone?.resolveSceneTone({}),
            }
          );
          if (dialogue) this.showDialogueLine(dialogue);
        }
      });
    }

    // Update UI
    this.updateStatusBar();
  }
}

// Register
window.InteractionController = new InteractionController();
ECS.registerSystem(window.InteractionController);
