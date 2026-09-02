/**
 * CARNAL ROULETTE VR — Main Application
 * Bootstraps all systems
 */

(async function main() {
  console.log('=== CARNAL ROULETTE VR v2.0 ===');
  console.log('Asset pipeline loading...');

  try {
    // 1. Initialize UI Controller (binds DOM events)
    UIController.init();

    // 2. Initialize Asset Pipeline (handles uploads + generation)
    await AssetPipeline.init();

    // 3. Initialize game logic with defaults
    GameLogic.init({
      partnerCount: 1,
      roundDuration: 5,
      intensityLevel: 5,
      sceneType: 'bedroom',
    });

    // 4. Audio system (ready on first interaction)
    Audio.init();

    // 5. Recorder (ready when VR starts)
    Recorder.init();

    // 6. Interaction (binds after VR scene init)
    // (called inside enterVR flow)

    console.log('[App] All systems initialized. Ready for asset upload.');

    // Boot scene config defaults
    document.querySelector('.count-btn[data-count="1"]')?.classList.add('active');
    
    // Update partner slots based on default count
    AssetPipeline.updateAssetSlots(1);

  } catch (err) {
    console.error('[App] Initialization error:', err);
    document.body.innerHTML = `
      <div style="color:red; padding:40px; text-align:center; font-family:monospace;">
        <h1>⚠️ INIT ERROR</h1>
        <pre>${err.message}\n${err.stack}</pre>
      </div>
    `;
  }
})();
