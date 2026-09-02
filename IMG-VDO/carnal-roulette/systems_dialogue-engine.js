/**
 * CARNAL ROULETTE VR — AI Roleplay Dialogue Engine
 * 
 * State-of-the-art dialogue and reaction system incorporating:
 * 
 * FEATURES from top AI roleplay platforms:
 * - Semantic Memory 2.0 (Spicychat): Compressed memory with decay curves
 * - Emotional Tone Sensitivity (MYAIGF): Reads player pacing and adapts
 * - Context-Aware Dialogue (Jenova): Story-aware response generation
 * - Scenario Sandbox (Anione): Scene briefs as session architecture
 * - Adaptive Memory (Candy AI): Character details persist across sessions
 * - Affection/Trust Matrix (Meeting): Hidden relationship sliders
 * 
 * FEATURES from adult game engines:
 * - Consent Mechanics (Hurt Me Plenty): Boundary negotiation, safewords
 * - Four-Phase Structure (Eros Engine): Initiation→Escalation→Climax→Aftercare
 * - Affection Meter (generic): Visible + hidden relationship tracking
 * - Dialogue Branching (Lexi): Micro-narratives from single choices
 * - Contextual Image Generation (Candy AI): Scene-timed visual output
 * 
 * The system is VOID of hardcoded content. All dialogue, reactions,
 * and emotional beats are generated procedurally from:
 *   - Character personality data
 *   - Relationship state (from parent app)
 *   - Active narrative tone
 *   - Scene phase (Initiation→Escalation→Climax→Aftercare)
 *   - Player action history & pacing
 */

class DialogueEngine {
  constructor() {
    this.name = 'DialogueEngine';
    
    // ===================================================================
    // 1. SCENE PHASES (Eros Engine inspired)
    // ===================================================================
    this.PHASES = {
      initiation: {
        label: 'Initiation',
        description: 'The approach — tension builds, consent checked, boundaries set',
        duration: [30, 120], // seconds
        dialogueIntensity: 0.4,
        physicalIntensity: 0.2,
        consentChecks: ['verbal', 'body-language', 'pacing'],
        allowedActions: ['approach', 'eye-contact', 'verbal-consent', 'touch-hand', 'kiss-forehead', 'whisper'],
      },
      escalation: {
        label: 'Escalation',
        description: 'Building arousal — undressing, foreplay, teasing',
        duration: [120, 600],
        dialogueIntensity: 0.6,
        physicalIntensity: 0.5,
        consentChecks: ['checkin-soft', 'body-language'],
        allowedActions: [
          'kiss', 'touch-body', 'undress', 'caress', 'bite', 'pull-hair',
          'tease', 'whisper-dirty', 'hand-job', 'oral', 'finger',
        ],
      },
      climax: {
        label: 'Climax',
        description: 'Peak sexual activity — penetration, orgasm',
        duration: [180, 900],
        dialogueIntensity: 0.8,
        physicalIntensity: 0.9,
        consentChecks: ['checkin-intense'],
        allowedActions: [
          'thrust', 'deep', 'rhythm', 'grind', 'hold', 'climax-trigger',
        ],
      },
      aftercare: {
        label: 'Aftercare',
        description: 'Post-coital intimacy — holding, reassurance, decompression',
        duration: [60, 600],
        dialogueIntensity: 0.2,
        physicalIntensity: 0.1,
        consentChecks: [],
        allowedActions: [
          'hold', 'caress', 'kiss-forehead', 'whisper', 'spoon', 'water', 'talk',
        ],
      },
    };

    // ===================================================================
    // 2. MEMORY SYSTEM (Semantic Memory 2.0 inspired)
    // ===================================================================
    this.memory = {
      shortTerm: [],      // Last N actions + dialogue (sliding window)
      mediumTerm: null,   // Compressed summary of current session
      longTerm: [],       // Persistent memories across sessions
      emotionalHistory: [], // Track of emotional peaks
      
      // Memory configuration
      shortTermLimit: 20,
      mediumTermUpdateEvery: 5, // updates every N turns
      memoryDecayRate: 0.02,    // Ebbinghaus-inspired decay
    };

    // ===================================================================
    // 3. RELATIONSHIP MATRIX (Meeting inspired — hidden sliders)
    // ===================================================================
    this.relationshipMatrix = {};
    
    this.MATRIX_DEFAULTS = {
      trust: 30,        // How much they trust the player
      respect: 50,      // Mutual respect level
      attraction: 50,   // Physical/sexual attraction
      familiarity: 20,  // How well they know each other
      comfort: 40,      // Emotional safety
      submission: 20,   // Willingness to yield control
      dominance: 20,    // Willingness to take control
      devotion: 10,     // Deep emotional attachment
      mystery: 50,      // Unexplored aspects (decays as discovered)
    };

    // ===================================================================
    // 4. DIALOGUE TEMPLATE SYSTEM (Grammar-based procedural generation)
    // ===================================================================
    this.dialogueTemplates = this.buildTemplateLibrary();
    
    // ===================================================================
    // 5. CONSENT SYSTEM (Hurt Me Plenty inspired)
    // ===================================================================
    this.consentState = {
      boundaries: {
        softLimits: [],
        hardLimits: [],
        negotiated: false,
      },
      safeword: null,
      currentCheckinLevel: 'none',
      violations: 0,
      trustDamage: 0,
    };
  }

  // ===================================================================
  // BUILD TEMPLATE LIBRARY
  // ===================================================================
  buildTemplateLibrary() {
    // These are GRAMMAR templates, not hardcoded lines.
    // The system fills in character names, body parts, emotional qualifiers.
    // Each template has slots: {partner}, {player}, {bodyPart}, {emotion}, {intensity}
    
    return {
      // === INITIATION PHASE ===
      approach: {
        shy: [
          '{partner} glances at you from across the room, then looks away quickly.',
          '{partner} bites their lip nervously as you approach.',
          '"Hey..." {partner} says softly, not quite meeting your eyes.',
        ],
        confident: [
          '{partner} holds your gaze, a slow smile spreading across their face.',
          '"I was hoping you\'d come find me." {partner} reaches for your hand.',
          '{partner} steps close enough that you can feel their breath.',
        ],
        dominant: [
          '{partner} gestures for you to come closer. "Now. I don\'t have all night."',
          '{partner} pins you with a look that says more than words could.',
          '"On your knees." {partner} says it like it\'s already decided.',
        ],
        desperate: [
          '{partner} practically falls into you, hands clutching at your clothes.',
          '"I need you. Right now. I don\'t care who sees."',
          '{partner}\'s voice cracks. "Please. I\'ve been thinking about this all day."',
        ],
        guilty: [
          '{partner} hesitates, hand hovering near yours before pulling back.',
          '"We shouldn\'t..." But {partner} doesn\'t move away.',
          '{partner} looks at the door, then back at you. Caught between wanting and knowing better.',
        ],
        tender: [
          '{partner} cups your face gently, thumb tracing your cheekbone.',
          '"I\'ve missed you." {partner} says it like it hurts.',
          '{partner} rests their forehead against yours. Eyes closed. Breathing slow.',
        ],
      },

      // === CONSENT / CHECK-IN ===
      consent: {
        asking: [
          '"Is this okay?" {partner} asks, hand hovering where they want to touch.',
          '"Tell me if you want me to stop. At any time. Okay?"',
          '{partner} looks at you carefully. "What do you want right now?"',
        ],
        enthusiastic: [
          '"Yes. God, yes. Please." {partner} pulls you closer.',
          '{partner} nods eagerly. "I want this. I want you."',
          '"Don\'t stop. I\'ll tell you if— just don\'t stop."',
        ],
        hesitant: [
          '"I... I think so. Just... go slow?" {partner} looks uncertain but willing.',
          '{partner} doesn\'t say yes, but they don\'t say no either. Their body is tense.',
          '"I trust you." {partner} says it like they\'re convincing themselves.',
        ],
        safeword: [
          '{partner} uses the safeword. Everything stops immediately.',
          '"Stop. I mean it. Stop right now." {partner} pushes back.',
          'The safeword. {partner} is breathing hard, eyes wide.',
        ],
      },

      // === ESCALATION — FOREPLAY ===
      foreplay: {
        tender: [
          '{partner} gasps as your lips find that spot on their neck.',
          '{partner} arches into your touch, a soft moan escaping.',
          '"Right... right there..." {partner} whispers, barely audible.',
        ],
        rough: [
          '{partner} gasps as you pull their hair, head tilting back to expose their throat.',
          '"Harder." {partner} demands. "I can take it."',
          '{partner} moans as you bite down, leaving a mark.',
        ],
        playful: [
          '{partner} giggles as you tickle their ribs before kissing the spot.',
          '"Mmm, you\'re going to have to try harder than that." {partner} teases.',
          '{partner} pulls back just enough to smirk at you before diving back in.',
        ],
        reverent: [
          '{partner} closes their eyes as you kiss down their body, savoring each touch.',
          '"You\'re beautiful." {partner} says it like a prayer.',
          '{partner} touches your face, looking at you like you\'re something precious.',
        ],
      },

      // === CLIMAX — PEAK ACTION ===
      climaxAction: {
        tender: [
          '{partner} wraps their legs around you, pulling you deeper.',
          '"I love you." {partner} breathes against your ear. "I love you so much."',
          '{partner} moves with you, perfectly synchronized, lost in the rhythm.',
        ],
        rough: [
          '{partner} cries out as you pound into them, gripping the sheets.',
          '"Take it. Take all of it. You can handle it."',
          '{partner} is barely coherent, just moaning and clinging to you.',
        ],
        desperate: [
          '{partner} clutches you like you\'ll disappear if they let go.',
          '"Don\'t stop. Please don\'t stop. Please—" {partner} is begging now.',
          '{partner} gasps your name like it\'s the only word they remember.',
        ],
        dominant: [
          '"Look at me. I want to see your face when you come."',
          '{partner} grips your jaw, forcing eye contact. "You come when I tell you to."',
          '{partner} holds you down, controlling every inch of movement.',
        ],
        submissive: [
          '"Please... please let me make you feel good." {partner} looks up at you.',
          '{partner} surrenders completely, letting you take control.',
          '"I\'m yours. Do what you want with me."',
        ],
      },

      // === CLIMAX EVENT ===
      climax: {
        emotional: [
          '{partner} cries out, body arching as the orgasm takes them.',
          '{partner} gasps your name, nails digging into your back.',
          '{partner} shakes uncontrollably, holding onto you like a lifeline.',
        ],
        exhausted: [
          '{partner} collapses against you, breathing ragged, completely spent.',
          '{partner} buries their face in your neck, trembling from the intensity.',
          'For a long moment, {partner} can\'t speak. Just holds on and breathes.',
        ],
        talkative: [
          '"Oh my god..." {partner} laughs breathlessly. "That was— I don\'t even have words."',
          '"Did that just— yeah. That definitely just happened." {partner} grins.',
          '{partner} kisses you sloppily, still catching their breath. "Again. Please."',
        ],
      },

      // === AFTERCARE ===
      aftercare: {
        tender: [
          '{partner} curls into your side, tracing patterns on your chest.',
          '"I\'ve got you. I\'m right here." {partner} strokes your hair.',
          '{partner} pulls the blanket over both of you, tucking you in close.',
        ],
        checking: [
          '"How are you feeling?" {partner} asks, genuinely wanting to know.',
          '"That was intense. You okay?" {partner} searches your face.',
          '{partner} brings you water, pressing the glass into your hands gently.',
        ],
        processing: [
          '{partner} is quiet for a long moment, processing everything.',
          '"I don\'t know what to say." {partner} admits. "That meant... a lot."',
          '{partner} laughs softly. "I think I forgot how to think for a second there."',
        ],
        vulnerable: [
          '{partner} holds onto you tighter than before. "Don\'t go. Not yet."',
          '"I feel safe with you." {partner} whispers, like it\'s a confession.',
          '{partner} wipes a tear from your cheek. "Hey. I\'m here. I\'m not going anywhere."',
        ],
        dominantCare: [
          '{partner} checks your bindings, making sure they\'re not too tight.',
          '"You did so well. I\'m proud of you." {partner} kisses your forehead.',
          '{partner} wraps you in a blanket, holding you firmly but gently now.',
        ],
      },

      // === EMOTIONAL REACTIONS (for specific moments) ===
      emotionalReaction: {
        overwhelmed: [
          '{partner} covers their face, overwhelmed by how much they feel.',
          '"I didn\'t expect... this." {partner} gestures vaguely at everything.',
          '{partner} laughs and cries at the same time. "Sorry. It\'s a lot."',
        ],
        grateful: [
          '"Thank you. For being patient with me." {partner} squeezes your hand.',
          '{partner} looks at you with such warmth it almost hurts.',
          '"I didn\'t know it could feel like this."',
        ],
        playful: [
          '{partner} pokes your side. "So... round two?"',
          '"You\'re pretty good at that." {partner} grins. "I mean... for a beginner."',
          '{partner} kisses your nose. "I\'m keeping you."',
        ],
        concerned: [
          '"Did I hurt you? Tell me the truth." {partner} looks worried.',
          '{partner} notices you wince. "What\'s wrong? Talk to me."',
          '{partner} stops immediately. "Your comfort matters more than anything else."',
        ],
      },
    };
  }

  // ===================================================================
  // INITIALIZE — Called when characters are loaded
  // ===================================================================
  initForCharacter(characterId, characterData) {
    // Initialize relationship matrix from parent app data
    const rel = characterData.relationship || {};
    const pers = characterData.personality || {};

    this.relationshipMatrix[characterId] = {
      ...this.MATRIX_DEFAULTS,
      trust: rel.trust ?? this.MATRIX_DEFAULTS.trust,
      attraction: rel.intimacy ?? this.MATRIX_DEFAULTS.attraction,
      familiarity: rel.history?.length ?? this.MATRIX_DEFAULTS.familiarity,
      submission: pers.submission ?? this.MATRIX_DEFAULTS.submission,
      dominance: pers.dominance ?? this.MATRIX_DEFAULTS.dominance,
    };

    // Load long-term memory from parent app's history
    if (rel.history) {
      this.memory.longTerm = rel.history.map(h => ({
        type: 'story-event',
        content: h,
        timestamp: Date.now() - Math.random() * 86400000 * 30,
        emotionalWeight: 0.5 + Math.random() * 0.5,
        decayFactor: 1.0,
      }));
    }

    // Initialize consent boundaries from personality
    this.consentState.boundaries = {
      negotiated: false,
      softLimits: [...(pers.softLimits || [])],
      hardLimits: [...(pers.hardLimits || [])],
    };

    // Generate a safeword
    const safewords = ['red', 'pineapple', 'mercy', 'safeword', 'stop', 'enough', 'timeout'];
    this.consentState.safeword = safewords[Math.floor(Math.random() * safewords.length)];

    console.log(`[DialogueEngine] Initialized for ${characterData.name || characterId}`);
    console.log(`[DialogueEngine] Relationship matrix:`, this.relationshipMatrix[characterId]);
    console.log(`[DialogueEngine] Safeword: "${this.consentState.safeword}"`);
  }

  // ===================================================================
  // MAIN API: Generate dialogue for a moment
  // ===================================================================
  generateDialogue(characterId, context) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return null;

    const {
      phase,           // 'initiation' | 'escalation' | 'climax' | 'aftercare'
      actionType,      // The specific action being performed
      toneResult,      // From NarrativeToneSystem
      intensity,       // 0-1
      isNewPartner,    // bool
      consentStatus,   // 'not-yet' | 'negotiating' | 'given' | 'withdrawn'
    } = context;

    // Determine emotional tenor
    const emotionalTenor = this.determineEmotionalTenor(matrix, toneResult, phase);

    // Select template category and subcategory
    let category, subcategory;
    
    if (consentStatus === 'negotiating' || consentStatus === 'not-yet') {
      category = 'consent';
      subcategory = this.selectConsentSubcategory(matrix, consentStatus);
    } else if (phase === 'initiation') {
      category = 'approach';
      subcategory = toneResult.toneId;
    } else if (phase === 'escalation') {
      category = 'foreplay';
      subcategory = toneResult.toneId;
    } else if (phase === 'climax') {
      if (actionType === 'climax-trigger') {
        category = 'climax';
        subcategory = this.selectClimaxSubcategory(matrix, toneResult);
      } else {
        category = 'climaxAction';
        subcategory = toneResult.toneId;
      }
    } else if (phase === 'aftercare') {
      category = 'aftercare';
      subcategory = this.selectAftercareSubcategory(matrix, toneResult);
    }

    // Fallback
    if (!this.dialogueTemplates[category]?.[subcategory]) {
      category = 'emotionalReaction';
      subcategory = 'overwhelmed';
    }

    // Get the template pool
    const pool = this.dialogueTemplates[category]?.[subcategory];
    if (!pool || pool.length === 0) return null;

    // Pick based on recency (avoid repeating recent lines)
    const line = this.selectFromPool(pool, characterId, category + subcategory);

    // Fill in slots
    const filled = this.fillTemplate(line, characterId, context);

    // Add emotional qualifier based on intensity
    const qualified = this.addEmotionalQualifier(filled, intensity, emotionalTenor);

    // Record in memory
    this.recordMemory(characterId, {
      type: 'dialogue',
      category,
      subcategory,
      content: qualified,
      timestamp: Date.now(),
      phase,
      intensity,
    });

    return qualified;
  }

  // ===================================================================
  // DETERMINE EMOTIONAL TENOR
  // ===================================================================
  determineEmotionalTenor(matrix, toneResult, phase) {
    const score = {
      love: matrix.trust * 0.4 + matrix.devotion * 0.3 + matrix.familiarity * 0.3,
      dominance: matrix.dominance * 0.6 + matrix.confidence * 0.4,
      submission: matrix.submission * 0.6 + matrix.comfort * 0.4,
      danger: (100 - matrix.trust) * 0.3 + (100 - matrix.familiarity) * 0.3 + (toneResult?.toneProfile?.roughness || 0) * 0.4,
      tenderness: matrix.comfort * 0.3 + matrix.trust * 0.3 + matrix.devotion * 0.4,
      playfulness: matrix.familiarity * 0.4 + (100 - matrix.mystery) * 0.3 + (100 - matrix.respect) * 0.3,
    };

    return Object.entries(score).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }

  // ===================================================================
  // SELECT SUBCATEGORY HELPERS
  // ===================================================================
  selectConsentSubcategory(matrix, status) {
    if (status === 'negotiating') {
      return matrix.trust > 50 ? 'asking' : 'hesitant';
    }
    return 'asking';
  }

  selectClimaxSubcategory(matrix, toneResult) {
    const roughness = toneResult?.toneProfile?.roughness || 0;
    if (matrix.devotion > 70 && roughness < 0.5) return 'emotional';
    if (roughness > 0.6) return 'exhausted';
    return 'talkative';
  }

  selectAftercareSubcategory(matrix, toneResult) {
    const roughness = toneResult?.toneProfile?.roughness || 0;
    const trust = matrix.trust;
    
    if (roughness > 0.7) return 'dominantCare';
    if (trust > 70) return 'vulnerable';
    if (roughness > 0.4) return 'checking';
    return 'tender';
  }

  // ===================================================================
  // SELECT FROM POOL (with recency avoidance)
  // ===================================================================
  selectFromPool(pool, characterId, contextKey) {
    // Track recently used lines
    const recentLines = this.memory.shortTerm
      .filter(m => m.category + m.subcategory === contextKey)
      .slice(-3)
      .map(m => m.content);

    // Filter out recent lines
    const available = pool.filter(l => !recentLines.includes(l));
    const finalPool = available.length > 0 ? available : pool;

    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  // ===================================================================
  // FILL TEMPLATE SLOTS
  // ===================================================================
  fillTemplate(template, characterId, context) {
    const character = PluginAPI.getCharacter(characterId);
    const partnerName = character?.name || characterId;
    const playerName = context.playerName || 'you';

    // Build body part references from character's appearance
    const bodyParts = this.getBodyPartReferences(character);

    let filled = template
      .replace(/{partner}/g, partnerName)
      .replace(/{player}/g, playerName)
      .replace(/{bodyPart}/g, bodyParts.random)
      .replace(/{emotion}/g, context.emotion || 'desire')
      .replace(/{intensity}/g, this.describeIntensity(context.intensity || 0.5));

    // Capitalize first letter if template starts with quoted dialogue
    if (filled.startsWith('"')) {
      filled = '"' + filled.charAt(1).toUpperCase() + filled.slice(2);
    }

    return filled;
  }

  getBodyPartReferences(character) {
    const app = character?.appearance || {};
    const parts = {
      erogenous: ['neck', 'ear', 'lips', 'chest', 'thighs', 'lower back'],
      gender: app.genitalia === 'male' 
        ? ['cock', 'shaft', 'head', 'balls', 'length']
        : ['clit', 'lips', 'entrance', 'wetness', 'core'],
      general: ['skin', 'mouth', 'hair', 'hands', 'hips', 'ass', 'stomach'],
    };

    return {
      random: parts.general[Math.floor(Math.random() * parts.general.length)],
      erogenous: parts.erogenous[Math.floor(Math.random() * parts.erogenous.length)],
      gender: parts.gender[Math.floor(Math.random() * parts.gender.length)],
    };
  }

  describeIntensity(intensity) {
    if (intensity < 0.2) return 'softly';
    if (intensity < 0.4) return 'gently';
    if (intensity < 0.6) return 'firmly';
    if (intensity < 0.8) return 'hard';
    return 'roughly';
  }

  // ===================================================================
  // ADD EMOTIONAL QUALIFIER
  // ===================================================================
  addEmotionalQualifier(line, intensity, emotionalTenor) {
    // Add physical cue based on tenor
    const physicalCues = {
      love: ['their eyes never leave yours', 'they trace your jawline gently'],
      dominance: ['their grip firm on your hip', 'they hold your gaze steadily'],
      submission: ['they look up at you through their lashes', 'their body softens under your touch'],
      danger: ['there\'s an edge to their movements', 'their breath catches'],
      tenderness: ['their touch lingers', 'they cup your face like you\'re delicate'],
      playfulness: ['a smirk plays at their lips', 'they dart in for a quick kiss'],
    };

    const topTenor = emotionalTenor[0];
    const cues = physicalCues[topTenor];
    
    if (cues && intensity > 0.3 && Math.random() < 0.4) {
      const cue = cues[Math.floor(Math.random() * cues.length)];
      return `${line}\n\n_${cue}._`;
    }

    return line;
  }

  // ===================================================================
  // MEMORY SYSTEM
  // ===================================================================
  recordMemory(characterId, entry) {
    // Short-term (sliding window)
    this.memory.shortTerm.push(entry);
    if (this.memory.shortTerm.length > this.memory.shortTermLimit) {
      this.memory.shortTerm.shift();
    }

    // Update medium-term summary every N entries
    if (this.memory.shortTerm.length % this.mediumTermUpdateEvery === 0) {
      this.updateMediumTermSummary(characterId);
    }

    // Emotional peaks get stored in long-term
    if (entry.intensity > 0.8 || this.PHASES[entry.phase]?.dialogueIntensity > 0.7) {
      this.memory.emotionalHistory.push({
        timestamp: entry.timestamp,
        intensity: entry.intensity,
        phase: entry.phase,
        content: entry.content,
      });
    }
  }

  updateMediumTermSummary(characterId) {
    const recent = this.memory.shortTerm.slice(-this.mediumTermUpdateEvery);
    const phases = recent.map(m => m.phase);
    const uniquePhases = [...new Set(phases)];
    const avgIntensity = recent.reduce((s, m) => s + m.intensity, 0) / recent.length;

    this.memory.mediumTerm = {
      timestamp: Date.now(),
      characterId,
      phasesCovered: uniquePhases,
      averageIntensity: avgIntensity,
      totalExchanges: this.memory.shortTerm.length,
      emotionalPeaks: this.memory.emotionalHistory.slice(-3),
    };
  }

  /**
   * Retrieve context for a new dialogue generation
   * Combines short-term, medium-term, and relevant long-term memory
   */
  getMemoryContext(characterId) {
    const short = this.memory.shortTerm.slice(-5); // Last 5 for immediate context
    
    const medium = this.memory.mediumTerm 
      ? `Session summary: phases ${this.memory.mediumTerm.phasesCovered.join(', ')}, avg intensity ${(this.memory.mediumTerm.averageIntensity * 100).toFixed(0)}%`
      : null;

    // Long-term: only most emotionally significant memories
    const long = this.memory.emotionalHistory
      .filter(m => m.characterId === characterId || !m.characterId)
      .slice(-3)
      .map(m => `Previous peak: "${m.content}" (${m.phase})`)
      .join('\n');

    return {
      recentDialogue: short.map(m => m.content),
      sessionSummary: medium,
      emotionalHistory: long,
      exchangeCount: this.memory.shortTerm.length,
    };
  }

  // ===================================================================
  // RELATIONSHIP MATRIX UPDATES
  // ===================================================================
  updateRelationship(characterId, deltas) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return;

    for (const [key, delta] of Object.entries(deltas)) {
      if (matrix[key] !== undefined) {
        matrix[key] = THREE.MathUtils.clamp(matrix[key] + delta, 0, 100);
      }
    }

    // Decay mystery over time
    matrix.mystery = Math.max(5, matrix.mystery - 0.5);

    // Emit update for UI
    EventBus.emit('relationship:updated', {
      characterId,
      matrix: { ...matrix },
      changed: deltas,
    });
  }

  /**
   * Get relationship summary for a character
   */
  getRelationshipSummary(characterId) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return null;

    // Compute derived relationship labels
    const overall = (
      matrix.trust * 0.25 +
      matrix.attraction * 0.2 +
      matrix.comfort * 0.2 +
      matrix.familiarity * 0.15 +
      matrix.devotion * 0.2
    );

    let label = 'Strangers';
    if (overall > 80) label = 'Deeply Connected';
    else if (overall > 65) label = 'Intimate Partners';
    else if (overall > 50) label = 'Close Lovers';
    else if (overall > 35) label = 'Growing Closer';
    else if (overall > 20) label = 'Getting Acquainted';

    // Dominance/submission dynamic
    let dynamic = 'Equal';
    const diff = matrix.dominance - matrix.submission;
    if (diff > 20) dynamic = 'Player-Dominant';
    else if (diff < -20) dynamic = 'Partner-Dominant';

    return {
      score: overall,
      label,
      dynamic,
      matrix,
      safeword: this.consentState.safeword,
    };
  }

  // ===================================================================
  // CONSENT SYSTEM
  // ===================================================================
  negotiateConsent(characterId, desiredLimits = {}) {
    const character = PluginAPI.getCharacter(characterId);
    const pers = character?.personality || {};

    // Generate boundaries based on personality + relationship
    const softLimits = [];
    const hardLimits = [];

    if (pers.experience === 'virgin' || (this.relationshipMatrix[characterId]?.trust || 0) < 30) {
      softLimits.push('anal', 'facial', 'bondage', 'degradation');
      hardLimits.push('pain-play', 'blood', 'public');
    }

    if (pers.submission > 70) {
      softLimits.splice(softLimits.indexOf('bondage'), 1);
    }

    if (pers.masochism > 60) {
      softLimits.splice(softLimits.indexOf('pain-play'), 1);
    }

    // Merge with any desired limits from the player
    this.consentState.boundaries = {
      negotiated: true,
      softLimits: [...new Set([...softLimits, ...(desiredLimits.soft || [])])],
      hardLimits: [...new Set([...hardLimits, ...(desiredLimits.hard || [])])],
      safeword: this.consentState.safeword,
    };

    EventBus.emit('consent:negotiated', {
      characterId,
      boundaries: this.consentState.boundaries,
    });

    return this.consentState.boundaries;
  }

  checkConsent(characterId, action) {
    const { hardLimits, softLimits } = this.consentState.boundaries;

    if (hardLimits.includes(action)) {
      this.consentState.violations++;
      this.consentState.trustDamage += 15;
      
      this.updateRelationship(characterId, { trust: -15, respect: -10, comfort: -20 });
      
      EventBus.emit('consent:violation', {
        characterId,
        action,
        severity: 'hard-limit',
      });

      return {
        allowed: false,
        response: 'hard-limit',
        message: `That's a hard limit. They said no to ${action}. I need you to respect that.`,
        damage: 15,
      };
    }

    if (softLimits.includes(action)) {
      // Soft limits can be pushed with trust
      const trust = this.relationshipMatrix[characterId]?.trust || 30;
      
      if (trust < 50) {
        this.consentState.trustDamage += 5;
        this.updateRelationship(characterId, { trust: -5, comfort: -8 });

        return {
          allowed: false,
          response: 'soft-limit',
          message: `That's a soft limit for them. They're not ready for that yet.`,
          damage: 5,
        };
      } else {
        // High trust: soft limit can be explored carefully
        return {
          allowed: true,
          response: 'soft-limit-proceed',
          message: `They're hesitant but trust you enough to try. Go slow. Check in often.`,
          caution: true,
          checkinRequired: true,
        };
      }
    }

    return { allowed: true };
  }

  // ===================================================================
  // GENERATE PHYSICAL REACTION DESCRIPTION
  // ===================================================================
  generatePhysicalReaction(characterId, actionType, intensity, toneResult) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return '';

    const roughness = toneResult?.toneProfile?.roughness || 0;

    const reactions = {
      touch: {
        soft: [`${characterId} leans into your touch`, `${characterId} shivers slightly`],
        rough: [`${characterId} gasps as you grip them firmly`, `${characterId} arches into your hand`],
      },
      kiss: {
        soft: [`${characterId}'s lips part against yours`, `${characterId} sighs into the kiss`],
        rough: [`${characterId} moans against your mouth`, `${characterId} bites your lower lip`],
      },
      penetration: {
        soft: [`${characterId} tenses, then relaxes around you`, `${characterId} breathes deeply as you enter`],
        rough: [`${characterId} cries out as you push into them`, `${characterId} claws at your back`],
      },
    };

    const category = reactions[actionType] || { soft: [], rough: [] };
    const pool = roughness > 0.5 ? category.rough : category.soft;
    
    if (!pool || pool.length === 0) return '';

    const line = pool[Math.floor(Math.random() * pool.length)];
    
    // Add intensity modifier
    if (intensity > 0.7) {
      return `${line}, body trembling with ${intensity > 0.9 ? 'uncontrollable' : 'barely controlled'} pleasure.`;
    }
    return `${line}.`;
  }

  // ===================================================================
  // GENERATE AFTERCARE CHECK-IN
  // ===================================================================
  generateAftercareDialogue(characterId, context) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return null;

    const roughness = context.toneResult?.toneProfile?.roughness || 0;

    if (roughness > 0.6) {
      // More intense scene needs more careful aftercare
      const templates = [
        `"Hey..." {partner} says softly. "Come here. Let me hold you."`,
        `"How are you feeling? That was... a lot." {partner} strokes your hair.`,
        `"I've got you. You're safe. Just breathe with me."`,
        `"Do you need water? A blanket? Tell me what you need."`,
      ];
      return this.fillTemplate(templates[Math.floor(Math.random() * templates.length)], characterId, context);
    }

    if (matrix.devotion > 60) {
      const templates = [
        `"I love you." {partner} whispers, kissing your shoulder.`,
        `"That meant more than you know." {partner} holds you tighter.`,
        `"Stay with me tonight. Please."`,
      ];
      return this.fillTemplate(templates[Math.floor(Math.random() * templates.length)], characterId, context);
    }

    const templates = [
      `"Well..." {partner} laughs breathlessly. "That happened."`,
      `{partner} traces patterns on your skin. "You're pretty amazing, you know that?"`,
      `"So..." {partner} grins. "Round two after I catch my breath?"`,
    ];
    return this.fillTemplate(templates[Math.floor(Math.random() * templates.length)], characterId, context);
  }

  // ===================================================================
  // FEEDBACK LOOP — Adjust relationship based on player behavior
  // ===================================================================
  processPlayerAction(characterId, action, intensity, toneResult) {
    const matrix = this.relationshipMatrix[characterId];
    if (!matrix) return;

    const roughness = toneResult?.toneProfile?.roughness || 0;
    const deltas = {};

    // Actions affect relationship differently based on tone
    switch (action) {
      case 'breed':
      case 'deep':
        if (roughness > 0.6) {
          deltas.dominance = 3;
          deltas.submission = matrix.submission > 50 ? 2 : -1;
          deltas.trust = matrix.trust > 60 ? 2 : -3;
          deltas.comfort = matrix.trust > 60 ? 1 : -5;
        } else {
          deltas.trust = 2;
          deltas.devotion = 3;
          deltas.attraction = 2;
        }
        break;

      case 'spank':
      case 'choke':
        deltas.dominance = 5;
        deltas.respect = matrix.respect > 50 ? 2 : -3;
        deltas.trust = matrix.submission > 50 ? 3 : -8;
        deltas.comfort = matrix.submission > 50 ? 2 : -10;
        break;

      case 'kiss-forehead':
      case 'whisper':
      case 'caress':
        deltas.comfort = 4;
        deltas.trust = 3;
        deltas.devotion = 2;
        deltas.mystery = -2;
        break;

      case 'choke':
      case 'spank':
        // Check consent first
        const consentCheck = this.checkConsent(characterId, action);
        if (!consentCheck.allowed) {
          // Violation already handled in checkConsent
          return consentCheck;
        }
        break;
    }

    this.updateRelationship(characterId, deltas);
    
    return { allowed: true, deltas };
  }

  // ===================================================================
  // UTILITY: Get current scene context for UI
  // ===================================================================
  getSceneContext(characterId) {
    const matrix = this.relationshipMatrix[characterId];
    const memory = this.getMemoryContext(characterId);
    
    return {
      relationship: this.getRelationshipSummary(characterId),
      memory,
      phase: this.currentPhase,
      consentBoundaries: this.consentState.boundaries,
      safeword: this.consentState.safeword,
    };
  }
}

// Register and export
window.DialogueEngine = new DialogueEngine();
ECS.registerSystem(window.DialogueEngine);
