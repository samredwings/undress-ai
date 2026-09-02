/**
 * CARNAL ROULETTE VR — Interaction Controller
 * Handles VR controller input + on-screen action buttons
 */

const Interaction = {
  controllers: [],
  handModels: [],

  init() {
    // === VR CONTROLLERS ===
    if (VRScene.renderer?.xr) {
      const controller1 = VRScene.renderer.xr.getController(0);
      const controller2 = VRScene.renderer.xr.getController(1);

      if (controller1) {
        controller1.addEventListener('selectstart', () => this.onControllerAction('right'));
        controller1.addEventListener('selectend', () => this.onControllerRelease('right'));
        VRScene.scene.add(controller1);
        this.controllers.push(controller1);
      }

      if (controller2) {
        controller2.addEventListener('selectstart', () => this.onControllerAction('left'));
        controller2.addEventListener('selectend', () => this.onControllerRelease('left'));
        VRScene.scene.add(controller2);
        this.controllers.push(controller2);
      }

      // XR controller models (visual)
      const xrControllerModelFactory = new THREE.XRControllerModelFactory();
      for (let i = 0; i < 2; i++) {
        const grip = VRScene.renderer.xr.getControllerGrip(i);
        if (grip) {
          grip.add(xrControllerModelFactory.createControllerModel(grip));
          VRScene.scene.add(grip);
          this.handModels.push(grip);
        }
      }

      // Hand tracking if available
      try {
        const handFactory = new THREE.XRHandModelFactory();
        for (let i = 0; i < 2; i++) {
          const hand = VRScene.renderer.xr.getHand(i);
          if (hand) {
            hand.add(handFactory.createHandModel(hand, 'spheres'));
            VRScene.scene.add(hand);
          }
        }
      } catch (e) {
        console.log('[Interaction] Hand tracking not available');
      }
    }

    // === ON-SCREEN ACTION BUTTONS ===
    document.querySelectorAll('.vr-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.performAction(action);
      });

      // Hold support
      let holdTimer = null;
      btn.addEventListener('mousedown', () => {
        holdTimer = setInterval(() => {
          const action = btn.dataset.action;
          this.performAction(action, 0.7);
        }, 200);
      });
      btn.addEventListener('mouseup', () => {
        if (holdTimer) clearInterval(holdTimer);
      });
      btn.addEventListener('mouseleave', () => {
        if (holdTimer) clearInterval(holdTimer);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const keyMap = {
        '1': 'thrust',
        '2': 'tease',
        '3': 'deep',
        '4': 'rhythm',
        ' ': 'intensify',
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        this.performAction(keyMap[e.key]);
      }
    });

    // Exit VR button
    document.getElementById('btn-exit-vr').addEventListener('click', () => {
      this.exitVR();
    });

    console.log('[Interaction] Initialized');
  },

  onControllerAction(hand) {
    this.performAction(hand === 'right' ? 'thrust' : 'tease');
  },

  onControllerRelease(hand) {
    // Could add release-based actions
  },

  performAction(actionType, intensityMod = 1) {
    const result = GameLogic.applyAction(actionType, intensityMod);
    if (!result) return;

    // Visual feedback
    this.applyVisualFeedback(actionType, result);

    // Audio feedback
    Audio.playActionSound(actionType, result.avgClimax);

    // Generate partner reaction text
    for (const p of result.partners) {
      const reaction = GameLogic.generateReaction(p);
      this.showReactionText(reaction);
    }

    // Intensity vibration feedback (if controller supports it)
    if (navigator.vibrate) {
      const intensity = result.avgClimax / 100;
      navigator.vibrate(intensity > 0.5 ? 50 : 20);
    }
  },

  applyVisualFeedback(actionType, result) {
    // Flash the climax meter
    const fill = document.getElementById('climax-fill');
    fill.style.filter = `brightness(${1 + result.avgClimax / 50})`;

    // Make partner meshes react
    if (result.avgClimax > 70) {
      // Intense reaction — screen pulse
      document.getElementById('vr-overlay').style.boxShadow = 
        `inset 0 0 ${50 + result.avgClimax}px rgba(255,0,100,${result.avgClimax / 300})`;
    }
  },

  showReactionText(text) {
    const hud = document.getElementById('hud-act');
    const original = hud.textContent;
    hud.style.transition = 'none';
    hud.textContent = `💬 ${text}`;
    hud.style.color = '#ff88cc';
    setTimeout(() => {
      hud.style.transition = 'all 0.5s';
      hud.textContent = original;
      hud.style.color = '';
    }, 2500);
  },

  exitVR() {
    if (VRScene.renderer?.xr) {
      const session = VRScene.renderer.xr.getSession();
      if (session) {
        session.end();
      }
    }
    
    // Go back to pipeline
    document.getElementById('vr-overlay').classList.add('hidden');
    document.getElementById('recording-bar').classList.add('hidden');
    document.getElementById('asset-pipeline').style.display = 'block';
    
    GameLogic.pause();
    VRScene.destroy();
  },
};
