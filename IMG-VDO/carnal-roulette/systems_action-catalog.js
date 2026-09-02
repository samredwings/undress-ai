/**
 * CARNAL ROULETTE VR — Action Catalog
 * 
 * Filters available actions based on:
 *   - Current phase (initiation/escalation/climax/aftercare)
 *   - Relationship type & state
 *   - Active narrative tone
 *   - Consent boundaries
 *   - Physical position
 * 
 * This is what the VR controller / UI wheel displays.
 * Every action has: name, category, intensity cost, consent level required,
 * dialogue trigger, animation trigger, and fluid emission trigger.
 */

class ActionCatalog {
  constructor() {
    this.name = 'ActionCatalog';
    
    this.ALL_ACTIONS = {
      // === INTIMATE / TENDER ===
      'eye-contact': {
        name: 'Eye Contact',
        category: 'intimate',
        minPhase: 'initiation',
        intensity: 0.1,
        consentRequired: 'none',
        dialogueTrigger: 'approach',
        animationTrigger: 'look',
        cooldown: 2,
      },
      'whisper': {
        name: 'Whisper',
        category: 'intimate',
        minPhase: 'initiation',
        intensity: 0.15,
        consentRequired: 'none',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'lean-in',
        cooldown: 3,
      },
      'kiss-forehead': {
        name: 'Kiss Forehead',
        category: 'intimate',
        minPhase: 'initiation',
        intensity: 0.1,
        consentRequired: 'implied',
        dialogueTrigger: 'tender',
        animationTrigger: 'kiss-soft',
        cooldown: 5,
        relationshipGain: { comfort: 3, trust: 2 },
      },
      'kiss': {
        name: 'Kiss (Mouth)',
        category: 'intimate',
        minPhase: 'initiation',
        intensity: 0.2,
        consentRequired: 'implied',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'kiss',
        cooldown: 2,
        relationshipGain: { attraction: 2, intimacy: 2 },
      },
      'caress': {
        name: 'Caress',
        category: 'intimate',
        minPhase: 'initiation',
        intensity: 0.15,
        consentRequired: 'implied',
        dialogueTrigger: 'tender',
        animationTrigger: 'touch-soft',
        cooldown: 1,
        relationshipGain: { comfort: 2, trust: 1 },
      },

      // === FOREPLAY ===
      'touch-body': {
        name: 'Touch Body',
        category: 'foreplay',
        minPhase: 'escalation',
        intensity: 0.3,
        consentRequired: 'given',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'touch-body',
        cooldown: 0.5,
      },
      'bite': {
        name: 'Bite / Nipple Play',
        category: 'foreplay',
        minPhase: 'escalation',
        intensity: 0.4,
        consentRequired: 'given',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'bite',
        cooldown: 3,
        toneFilter: { minRoughness: 0.2 },
      },
      'pull-hair': {
        name: 'Pull Hair',
        category: 'foreplay',
        minPhase: 'escalation',
        intensity: 0.35,
        consentRequired: 'given',
        dialogueTrigger: 'rough',
        animationTrigger: 'pull-hair',
        cooldown: 4,
        toneFilter: { minRoughness: 0.4 },
      },
      'oral': {
        name: 'Oral (Give)',
        category: 'foreplay',
        minPhase: 'escalation',
        intensity: 0.5,
        consentRequired: 'enthusiastic',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'oral-give',
        cooldown: 10,
        relationshipGain: { submission: 3, trust: 2 },
      },
      'finger': {
        name: 'Finger',
        category: 'foreplay',
        minPhase: 'escalation',
        intensity: 0.4,
        consentRequired: 'given',
        dialogueTrigger: 'foreplay',
        animationTrigger: 'finger',
        cooldown: 5,
      },

      // === CLIMAX ACTIONS ===
      'thrust': {
        name: 'Thrust',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.6,
        consentRequired: 'enthusiastic',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'thrust',
        cooldown: 0.3,
        fluidEmission: 'precum',
        penetrationAction: true,
      },
      'deep': {
        name: 'Deep Thrust',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.8,
        consentRequired: 'enthusiastic',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'thrust-deep',
        cooldown: 0.8,
        fluidEmission: 'precum',
        penetrationAction: true,
      },
      'grind': {
        name: 'Grind / Deep Kiss',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.5,
        consentRequired: 'given',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'grind',
        cooldown: 1,
      },
      'rhythm': {
        name: 'Match Rhythm',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.4,
        consentRequired: 'implied',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'rhythm',
        cooldown: 0,
      },
      'hold': {
        name: 'Hold / Freeze',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.3,
        consentRequired: 'implied',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'hold',
        cooldown: 0,
      },

      // === INTENSE / ROUGH ===
      'spank': {
        name: 'Spank',
        category: 'intense',
        minPhase: 'escalation',
        intensity: 0.5,
        consentRequired: 'explicit-negotiated',
        dialogueTrigger: 'rough',
        animationTrigger: 'spank',
        cooldown: 5,
        toneFilter: { minRoughness: 0.5 },
        relationshipCheck: { minSubmission: 40 },
      },
      'choke': {
        name: 'Choke (Light)',
        category: 'intense',
        minPhase: 'climax',
        intensity: 0.7,
        consentRequired: 'explicit-negotiated',
        dialogueTrigger: 'dominant',
        animationTrigger: 'choke',
        cooldown: 8,
        toneFilter: { minRoughness: 0.6 },
        relationshipCheck: { minTrust: 70, minSubmission: 50 },
        checkinRequired: true,
      },
      'degrade': {
        name: 'Degrade Verbally',
        category: 'intense',
        minPhase: 'escalation',
        intensity: 0.3,
        consentRequired: 'explicit-negotiated',
        dialogueTrigger: 'commanding',
        animationTrigger: null,
        cooldown: 10,
        toneFilter: { degradation: 0.4 },
        relationshipCheck: { minTrust: 50 },
      },
      'breed': {
        name: 'Breed / Creampie',
        category: 'climax',
        minPhase: 'climax',
        intensity: 0.9,
        consentRequired: 'enthusiastic',
        dialogueTrigger: 'climaxAction',
        animationTrigger: 'thrust-deep',
        cooldown: 30,
        penetrationAction: true,
        fluidEmission: 'cum',
        relationshipGain: { devotion: 5, intimacy: 3 },
        relationshipCheck: { minTrust: 50 },
      },

      // === AFTERCARE ===
      'spoon': {
        name: 'Spoon / Cuddle',
        category: 'aftercare',
        minPhase: 'aftercare',
        intensity: 0.05,
        consentRequired: 'implied',
        dialogueTrigger: 'aftercare',
        animationTrigger: 'spoon',
        cooldown: 0,
        relationshipGain: { comfort: 5, trust: 3, devotion: 2 },
      },
      'water': {
        name: 'Get Water',
        category: 'aftercare',
        minPhase: 'aftercare',
        intensity: 0,
        consentRequired: 'none',
        dialogueTrigger: 'aftercare',
        animationTrigger: null,
        cooldown: 0,
        relationshipGain: { trust: 2, comfort: 3 },
      },
      'talk': {
        name: 'Talk / Check In',
        category: 'aftercare',
        minPhase: 'aftercare',
        intensity: 0,
        consentRequired: 'none',
        dialogueTrigger: 'aftercare',
        animationTrigger: null,
        cooldown: 0,
        relationshipGain: { trust: 3, familiarity: 4, mystery: -5 },
      },

      // === SPECIAL ===
      'safeword': {
        name: 'SAFEWORD (Stop)',
        category: 'emergency',
        minPhase: 'initiation',
        intensity: 0,
        consentRequired: 'none',
        dialogueTrigger: 'consent',
        animationTrigger: null,
        cooldown: 0,
        description: 'Instantly stops all action. Scene enters aftercare.',
      },
    };
  }

  /**
   * Get available actions for the current context
   * This is called every time the context changes (phase, tone, etc.)
   */
  getAvailableActions(context) {
    const {
      currentPhase,
      toneResult,
      characterId,
      consentState,
      position,
    } = context;

    const toneProfile = toneResult?.toneProfile || {};
    const matrix = DialogueEngine.relationshipMatrix[characterId];

    return Object.entries(this.ALL_ACTIONS)
      .filter(([id, action]) => {
        // 1. Phase check
        const phaseKeys = ['initiation', 'escalation', 'climax', 'aftercare'];
        const minPhaseIdx = phaseKeys.indexOf(action.minPhase);
        const currentPhaseIdx = phaseKeys.indexOf(currentPhase);
        if (currentPhaseIdx < minPhaseIdx) return false;

        // 2. Tone filter
        if (action.toneFilter) {
          if (action.toneFilter.minRoughness !== undefined && 
              (toneProfile.roughness || 0) < action.toneFilter.minRoughness) return false;
          if (action.toneFilter.degradation !== undefined &&
              (toneProfile.degradation || 0) < action.toneFilter.degradation) return false;
        }

        // 3. Relationship check
        if (action.relationshipCheck && matrix) {
          if (action.relationshipCheck.minTrust !== undefined && 
              matrix.trust < action.relationshipCheck.minTrust) return false;
          if (action.relationshipCheck.minSubmission !== undefined &&
              matrix.submission < action.relationshipCheck.minSubmission) return false;
          if (action.relationshipCheck.minDominance !== undefined &&
              matrix.dominance < action.relationshipCheck.minDominance) return false;
        }

        // 4. Consent check
        if (action.consentRequired === 'explicit-negotiated' && 
            (!consentState?.boundaries?.negotiated)) return false;

        // 5. Emergency actions always available
        if (action.category === 'emergency') return true;

        return true;
      })
      .map(([id, action]) => {
        // Add dynamic context
        return {
          id,
          ...action,
          label: action.name,
          disabled: false,
          // Add relationship gain preview
          relationshipPreview: action.relationshipGain 
            ? this.previewRelationshipImpact(characterId, action.relationshipGain)
            : null,
        };
      });
  }

  previewRelationshipImpact(characterId, gains) {
    const matrix = DialogueEngine.relationshipMatrix[characterId];
    if (!matrix) return null;

    return Object.entries(gains).reduce((acc, [key, val]) => {
      const current = matrix[key] || 0;
      acc[key] = { current, after: THREE.MathUtils.clamp(current + val, 0, 100), delta: val };
      return acc;
    }, {});
  }

  /**
   * Get categorized actions for the UI wheel
   */
  getCategorizedActions(context) {
    const available = this.getAvailableActions(context);
    
    return {
      intimate: available.filter(a => a.category === 'intimate'),
      foreplay: available.filter(a => a.category === 'foreplay'),
      climax: available.filter(a => a.category === 'climax'),
      intense: available.filter(a => a.category === 'intense'),
      aftercare: available.filter(a => a.category === 'aftercare'),
      special: available.filter(a => a.category === 'special'),
      emergency: available.filter(a => a.category === 'emergency'),
    };
  }
}

// Register
window.ActionCatalog = new ActionCatalog();
ECS.registerSystem(window.ActionCatalog);
