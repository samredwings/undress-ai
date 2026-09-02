/**
 * CARNAL ROULETTE VR — Narrative State Machine
 * 
 * Formal FSM managing transitions between:
 *   IDLE → INTRO → BUILDUP → ACTIVE → CLIMAX → AFTERCARE → IDLE
 * Each state has defined entry/exit hooks, valid transitions, and tick behavior
 */

const NarrativeStateMachine = (() => {
  // === STATE DEFINITIONS ===
  const STATES = Object.freeze({
    IDLE: 'idle',
    INTRO: 'intro',
    BUILDUP: 'buildup',
    ACTIVE: 'active',
    CLIMAX: 'climax',
    AFTERCARE: 'aftercare',
    INTERRUPTED: 'interrupted',
  });

  const STATE_META = {
    [STATES.IDLE]: {
      label: 'Idle',
      description: 'No active scene',
      allowAction: false,
      autoTransition: null,
    },
    [STATES.INTRO]: {
      label: 'Scene Introduction',
      description: 'Narrative context loading, character intros',
      allowAction: false,
      autoTransition: { target: STATES.BUILDUP, after: 5000 },
    },
    [STATES.BUILDUP]: {
      label: 'Building Tension',
      description: 'Foreplay, teasing, dialogue',
      allowAction: true,
      climaxGainMultiplier: 0.5,
      autoTransition: {
        target: STATES.ACTIVE,
        condition: (state) => state.climaxMeter > 25,
      },
    },
    [STATES.ACTIVE]: {
      label: 'Active Scene',
      description: 'Full sexual activity',
      allowAction: true,
      climaxGainMultiplier: 1.0,
      autoTransition: {
        target: STATES.CLIMAX,
        condition: (state) => state.climaxMeter >= 100 || state.timer >= state.maxTimer,
      },
    },
    [STATES.CLIMAX]: {
      label: 'Climax / Orgasm',
      description: 'Peak sexual release',
      allowAction: false,
      duration: 4000,
      autoTransition: { target: STATES.AFTERCARE, after: 4000 },
    },
    [STATES.AFTERCARE]: {
      label: 'Aftercare',
      description: 'Post-coital recovery and intimacy',
      allowAction: false,
      duration: 8000,
      autoTransition: { target: STATES.IDLE, after: 8000 },
    },
    [STATES.INTERRUPTED]: {
      label: 'Interrupted',
      description: 'Scene paused or broken',
      allowAction: false,
      autoTransition: { target: STATES.IDLE, after: 3000 },
    },
  };

  // === VALID TRANSITIONS ===
  const VALID_TRANSITIONS = {
    [STATES.IDLE]: [STATES.INTRO],
    [STATES.INTRO]: [STATES.BUILDUP, STATES.INTERRUPTED],
    [STATES.BUILDUP]: [STATES.ACTIVE, STATES.INTERRUPTED, STATES.IDLE],
    [STATES.ACTIVE]: [STATES.CLIMAX, STATES.INTERRUPTED, STATES.BUILDUP],
    [STATES.CLIMAX]: [STATES.AFTERCARE, STATES.IDLE],
    [STATES.AFTERCARE]: [STATES.IDLE, STATES.INTRO],
    [STATES.INTERRUPTED]: [STATES.IDLE, STATES.BUILDUP],
  };

  // === STATE MACHINE ===
  let currentState = STATES.IDLE;
  let previousState = null;
  let stateEnterTime = 0;
  let stateTimer = 0;
  let transitionsEnabled = true;
  let listeners = new Map();

  const getStateMeta = (state) => STATE_META[state] || STATE_META[STATES.IDLE];

  const transition = (targetState, reason = 'manual') => {
    if (!transitionsEnabled) {
      console.warn(`[FSM] Transitions disabled — ignoring ${currentState} → ${targetState}`);
      return false;
    }

    const valid = VALID_TRANSITIONS[currentState];
    if (!valid?.includes(targetState)) {
      console.warn(`[FSM] Invalid transition: ${currentState} → ${targetState}`);
      return false;
    }

    const from = currentState;
    const fromMeta = STATE_META[from];
    const toMeta = STATE_META[targetState];

    // Exit current state
    emit('state-exit', { from, targetState, fromMeta, reason });

    // Update state
    previousState = currentState;
    currentState = targetState;
    stateEnterTime = Date.now();
    stateTimer = 0;

    // Enter new state
    emit('state-enter', { 
      from: previousState, 
      to: targetState, 
      fromMeta, 
      toMeta, 
      reason 
    });

    emit('state-changed', {
      current: currentState,
      previous: previousState,
      meta: toMeta,
    });

    console.log(`[FSM] ${from} → ${targetState} (reason: ${reason})`);
    return true;
  };

  const canTransitionTo = (state) => {
    return VALID_TRANSITIONS[currentState]?.includes(state) ?? false;
  };

  const tick = (gameState) => {
    const meta = STATE_META[currentState];
    if (!meta) return;

    stateTimer = Date.now() - stateEnterTime;

    // Check auto-transition conditions
    if (meta.autoTransition) {
      const at = meta.autoTransition;
      
      if (at.condition) {
        // Condition-based transition
        if (at.condition(gameState)) {
          transition(at.target, 'auto-condition');
        }
      } else if (at.after) {
        // Timer-based transition
        if (stateTimer >= at.after) {
          transition(at.target, 'auto-timer');
        }
      }
    }

    // Apply state-specific game logic
    switch (currentState) {
      case STATES.BUILDUP:
        // Clamping climax to max 25% in buildup
        GameLogic.current.climaxMeter = Math.min(25, gameState.climaxMeter);
        break;

      case STATES.ACTIVE:
        // Full climax accumulation
        break;

      case STATES.CLIMAX:
        // Lock controls, play climax effects
        break;
    }

    emit('tick', { state: currentState, timer: stateTimer, gameState });
  };

  const forceState = (targetState, reason = 'force') => {
    if (!STATES[Object.keys(STATES).find(k => STATES[k] === targetState)]) {
      console.warn(`[FSM] Unknown state: ${targetState}`);
      return false;
    }
    return transition(targetState, reason);
  };

  const getCurrentState = () => currentState;
  const getPreviousState = () => previousState;
  const getTimer = () => stateTimer;
  const getStateDuration = () => Date.now() - stateEnterTime;

  const enableTransitions = () => { transitionsEnabled = true; };
  const disableTransitions = () => { transitionsEnabled = false; };

  // === EVENT SYSTEM ===
  const on = (event, fn) => {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(fn);
  };

  const off = (event, fn) => {
    if (!listeners.has(event)) return;
    listeners.set(event, listeners.get(event).filter(l => l !== fn));
  };

  const emit = (event, data) => {
    if (!listeners.has(event)) return;
    for (const fn of listeners.get(event)) {
      try { fn(data); } catch (e) { console.warn(`[FSM] Listener error:`, e); }
    }
  };

  return {
    STATES,
    STATE_META,
    transition,
    canTransitionTo,
    tick,
    forceState,
    getCurrentState,
    getPreviousState,
    getTimer,
    getStateDuration,
    enableTransitions,
    disableTransitions,
    on,
    off,
  };
})();
