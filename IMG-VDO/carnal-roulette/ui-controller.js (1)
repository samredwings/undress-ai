/**
 * CARNAL ROULETTE VR — UI Controller
 * Manages all DOM UI transitions and state updates
 */

const UIController = {
  init() {
    // Hide VR overlay initially
    document.getElementById('vr-overlay').classList.add('hidden');
    document.getElementById('recording-bar').classList.add('hidden');

    // Listen for game events to update UI
    GameLogic.on('act-rolled', (data) => {
      this.flashAct(`🎲 ${data.act}`);
    });

    GameLogic.on('climax-started', () => {
      this.showClimaxOverlay();
      Audio.playClimax();
    });

    GameLogic.on('round-started', (data) => {
      this.showRoundNotification(data.round, data.intensity);
    });

    GameLogic.on('cooldown-started', () => {
      this.showCooldown();
    });

    // Ambient background music toggle
    // (not implemented — audio is procedural)

    console.log('[UIController] Initialized');
  },

  flashAct(text) {
    const el = document.getElementById('hud-act');
    el.style.transition = 'none';
    el.textContent = text;
    el.style.color = '#ff00ff';
    el.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      el.style.transition = 'all 0.4s ease';
      el.style.color = '';
      el.style.transform = 'scale(1)';
    }, 800);
  },

  showClimaxOverlay() {
    const overlay = document.getElementById('vr-overlay');
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; top:0; left:0; width:100vw; height:100vh;
      background: radial-gradient(circle, rgba(255,0,100,0.8), rgba(255,0,200,0.4), transparent);
      z-index: 9999;
      pointer-events: none;
      animation: climaxFlash 2s ease-out forwards;
    `;
    overlay.appendChild(flash);

    // Add CSS keyframe if not exists
    if (!document.getElementById('climax-style')) {
      const style = document.createElement('style');
      style.id = 'climax-style';
      style.textContent = `
        @keyframes climaxFlash {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.6; }
          100% { opacity: 0; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => flash.remove(), 3000);
  },

  showRoundNotification(round, intensity) {
    const overlay = document.getElementById('vr-overlay');
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 9998;
      text-align: center;
      pointer-events: none;
      animation: roundFade 3s ease-out forwards;
    `;
    notif.innerHTML = `
      <div style="font-family: 'Orbitron', monospace; font-size: 48px; color: #ff0066; text-shadow: 0 0 40px #ff0066;">
        ROUND ${round}
      </div>
      <div style="font-size: 20px; color: #ff99bb; margin-top: 8px;">
        Intensity: ${Math.floor(intensity)}%
      </div>
    `;
    overlay.appendChild(notif);

    // Add keyframe
    if (!document.getElementById('round-style')) {
      const style = document.createElement('style');
      style.id = 'round-style';
      style.textContent = `
        @keyframes roundFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(1.1); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => notif.remove(), 3500);
  },

  showCooldown() {
    const el = document.getElementById('hud-act');
    el.textContent = '💦 RECOVERY • CATCHING BREATH';
    el.style.color = '#88aaff';
  },
};
