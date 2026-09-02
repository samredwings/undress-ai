/**
 * CARNAL ROULETTE VR — Narrative Tone System (Complete)
 * 
 * FULL SPECTRUM SUPPORT:
 * 
 * The parent app defines the relationship. This system resolves
 * appropriate tones, actions, dialogue, and emotional states based on
 * that relationship + narrative context + intensity.
 * 
 * Nothing is hardcoded as "default." Every archetype is a data-driven
 * configuration that the parent app selects.
 * 
 * ARCHETYPES INCLUDED:
 * - strangers, acquaintances, lovers, dominantSubmissive, ownerOwned
 * - rivals, mentorStudent
 * - siblings (taboo/family dynamics)
 * - parentChild (taboo generational)
 * - forbidden (general taboo — religion, social status, power)
 * - captive (non-consensual story context, dark fantasy)
 * - enemyCaptor (non-consensual, war/conquest narrative)
 * - deityWorshipper (power-imbalanced reverence)
 * - supernatural (vampire/familiar, demon/mortal, creature dynamics)
 * 
 * CONSENT MODELS per archetype:
 * - 'explicit': Must ask, must get clear yes
 * - 'implied-with-checkins': Trust-based, check in during escalation
 * - 'pre-negotiated-continuously-reaffirmed': BDSM-style ongoing
 * - 'narrative-context-nonconsensual': Dark story where consent is absent
 *   (still has check-in points for PLAYER comfort/safety)
 * - 'coerced-but-willing': Guilt/shame-driven, power pressure
 */

class NarrativeToneSystem {
  constructor() {
    this.name = 'NarrativeTone';

    // ===================================================================
    // RELATIONSHIP ARCHETYPES — FULL SPECTRUM
    // ===================================================================
    this.RELATIONSHIP_ARCHETYPES = {
      // --- VANILLA / COMMON ---
      strangers: {
        label: 'Strangers / First Meeting',
        baseTrust: 15,
        baseIntimacy: 5,
        allowedTones: ['tentative', 'curious', 'hungry'],
        defaultTone: 'tentative',
        consentRequired: 'explicit',
        emotionalRange: ['curiosity', 'nervousness', 'desire', 'surprise'],
        dialogueStyle: 'discovering',
        touchStyle: 'exploratory',
        aftercareNeeded: false,
        darkContent: false,
      },
      acquaintances: {
        label: 'Acquaintances / Casual',
        baseTrust: 30,
        baseIntimacy: 20,
        allowedTones: ['playful', 'hungry', 'teasing'],
        defaultTone: 'playful',
        consentRequired: 'explicit',
        emotionalRange: ['playfulness', 'confidence', 'nervousness', 'desire'],
        dialogueStyle: 'banter',
        touchStyle: 'confident',
        aftercareNeeded: false,
        darkContent: false,
      },
      lovers: {
        label: 'Lovers / Romantic Partners',
        baseTrust: 70,
        baseIntimacy: 75,
        allowedTones: ['tender', 'passionate', 'playful', 'desperate', 'rough', 'reverent', 'grateful'],
        defaultTone: 'passionate',
        consentRequired: 'implied-with-checkins',
        emotionalRange: ['love', 'trust', 'vulnerability', 'joy', 'sadness', 'desperation', 'gratitude', 'ecstasy'],
        dialogueStyle: 'intimate',
        touchStyle: 'knowing',
        aftercareNeeded: true,
        darkContent: false,
      },

      // --- POWER EXCHANGE ---
      dominantSubmissive: {
        label: 'Dominant / Submissive (Negotiated)',
        baseTrust: 80,
        baseIntimacy: 60,
        allowedTones: ['rough', 'reverent', 'teasing', 'commanding', 'tender-as-reward', 'degrading-as-play'],
        defaultTone: 'commanding',
        consentRequired: 'pre-negotiated-continuously-reaffirmed',
        emotionalRange: ['submission', 'dominance', 'pride', 'vulnerability', 'trust', 'exhilaration', 'devotion'],
        dialogueStyle: 'power-exchange',
        touchStyle: 'intentional',
        aftercareNeeded: true,
        darkContent: false,
      },
      ownerOwned: {
        label: 'Owner / Owned (Deep D/s)',
        baseTrust: 90,
        baseIntimacy: 85,
        allowedTones: ['commanding', 'rough', 'reverent', 'posessive', 'tender-as-reward', 'degrading-as-play', 'worshipful'],
        defaultTone: 'posessive',
        consentRequired: 'pre-negotiated-continuously-reaffirmed',
        emotionalRange: ['devotion', 'pride', 'vulnerability', 'protection', 'ecstasy', 'surrender', 'gratitude'],
        dialogueStyle: 'ownership',
        touchStyle: 'claiming',
        aftercareNeeded: true,
        darkContent: false,
      },

      // --- CONFLICT / TENSION ---
      rivals: {
        label: 'Rivals / Enemies with Sexual Tension',
        baseTrust: 10,
        baseIntimacy: 40,
        allowedTones: ['rough', 'desperate', 'aggressive', 'sarcastic', 'violent'],
        defaultTone: 'rough',
        consentRequired: 'explicit-challenging',
        emotionalRange: ['anger', 'lust', 'contempt', 'surprise', 'grudging-respect', 'exhilaration'],
        dialogueStyle: 'antagonistic',
        touchStyle: 'aggressive',
        aftercareNeeded: false,
        darkContent: true,
      },
      mentorStudent: {
        label: 'Mentor / Student (Power Dynamic)',
        baseTrust: 60,
        baseIntimacy: 30,
        allowedTones: ['tender', 'reverent', 'commanding', 'guilty', 'protective'],
        defaultTone: 'reverent',
        consentRequired: 'explicit-careful',
        emotionalRange: ['trust', 'guidance', 'nervousness', 'gratitude', 'desire', 'guilt'],
        dialogueStyle: 'instructional',
        touchStyle: 'guided',
        aftercareNeeded: true,
        darkContent: false,
      },

      // --- TABOO / FORBIDDEN (Family/Blood Relations) ---
      siblings: {
        label: 'Siblings (Taboo / Incest — Story-Driven)',
        baseTrust: 65,
        baseIntimacy: 35,
        allowedTones: ['guilty', 'desperate', 'tender', 'passionate', 'rough', 'reverent', 'conflicted'],
        defaultTone: 'guilty',
        consentRequired: 'explicit-with-guilt',
        emotionalRange: [
          'guilt', 'longing', 'desperation', 'ecstasy', 'shame', 'vulnerability',
          'love', 'confusion', 'terror', 'devotion', 'grief', 'posessiveness',
        ],
        dialogueStyle: 'conflicted-intimate',
        touchStyle: 'desperate-gentle',
        aftercareNeeded: true,
        darkContent: true,
        contentNotes: 'Designed for parent app narratives where sibling relationships are established. Emotional weight focuses on forbidden longing, guilt, and the tension between familial love and romantic desire.',
      },
      parentChild: {
        label: 'Parent / Child (Taboo / Generational — Story-Driven)',
        baseTrust: 70,
        baseIntimacy: 20,
        allowedTones: ['guilty', 'desperate', 'conflicted', 'protective', 'reverent', 'rough'],
        defaultTone: 'conflicted',
        consentRequired: 'explicit-with-guilt',
        emotionalRange: [
          'guilt', 'shame', 'confusion', 'longing', 'protection', 'desperation',
          'devotion', 'grief', 'vulnerability', 'terror', 'love-distorted',
        ],
        dialogueStyle: 'conflicted-guardian',
        touchStyle: 'hesitant-desperate',
        aftercareNeeded: true,
        darkContent: true,
        contentNotes: 'Parent-app defines the specific generational context. Not a default — always explicitly triggered by narrative.',
      },
      extendedFamily: {
        label: 'Extended Family (Cousins / Aunt-Uncle — Story-Driven)',
        baseTrust: 50,
        baseIntimacy: 25,
        allowedTones: ['guilty', 'desperate', 'playful', 'passionate', 'conflicted', 'tender'],
        defaultTone: 'conflicted',
        consentRequired: 'explicit-with-guilt',
        emotionalRange: ['guilt', 'longing', 'playfulness', 'desire', 'confusion', 'nervousness'],
        dialogueStyle: 'conflicted-familiar',
        touchStyle: 'hesitant-warm',
        aftercareNeeded: true,
        darkContent: true,
      },

      // --- POWER-IMBALANCED / DARK ---
      forbidden: {
        label: 'Forbidden / Taboo (General — Religion, Status, Social)',
        baseTrust: 40,
        baseIntimacy: 40,
        allowedTones: ['desperate', 'guilty', 'rough', 'tender', 'reverent', 'conflicted'],
        defaultTone: 'desperate',
        consentRequired: 'explicit',
        emotionalRange: ['guilt', 'desperation', 'ecstasy', 'fear', 'longing', 'shame', 'defiance'],
        dialogueStyle: 'conflicted',
        touchStyle: 'desperate',
        aftercareNeeded: true,
        darkContent: true,
      },

      // --- NON-CONSENSUAL STORY CONTEXTS ---
      captorCaptive: {
        label: 'Captor / Captive (Dark Narrative — Non-Consensual Context)',
        baseTrust: 5,
        baseIntimacy: 0,
        allowedTones: ['aggressive', 'violent', 'degrading', 'commanding', 'rough'],
        defaultTone: 'aggressive',
        consentRequired: 'narrative-context-nonconsensual',
        emotionalRange: [
          'fear', 'anger', 'despair', 'defiance', 'submission-from-fear',
          'disgust', 'numbness', 'survival-instinct', 'dominance', 'cruelty',
        ],
        dialogueStyle: 'predator-prey',
        touchStyle: 'forceful',
        aftercareNeeded: false,
        darkContent: true,
        contentNotes: 'Narrative-driven non-consent. Used in dark fantasy, post-apocalyptic, horror, or war narratives. Includes check-in points for player comfort (out-of-character safety).',
      },
      enemyCaptor: {
        label: 'Enemy / Captor (War / Conquest Narrative)',
        baseTrust: 3,
        baseIntimacy: 0,
        allowedTones: ['aggressive', 'violent', 'degrading', 'commanding', 'rough', 'hateful'],
        defaultTone: 'aggressive',
        consentRequired: 'narrative-context-nonconsensual',
        emotionalRange: [
          'hatred', 'cruelty', 'dominance', 'fear', 'anger', 'defiance',
          'submission-from-fear', 'disgust', 'survival', 'grief',
        ],
        dialogueStyle: 'conqueror-vanquished',
        touchStyle: 'brutal',
        aftercareNeeded: false,
        darkContent: true,
        contentNotes: 'Enemy soldier / conquered territory dynamics. Explicitly non-consensual within narrative frame. Player safeword always available.',
      },

      // --- SUPERNATURAL / FANTASY ---
      deityWorshipper: {
        label: 'Deity / Worshipper (Religious Ecstasy)',
        baseTrust: 80,
        baseIntimacy: 30,
        allowedTones: ['reverent', 'tender', 'passionate', 'commanding', 'worshipful', 'rough-as-ritual'],
        defaultTone: 'reverent',
        consentRequired: 'pre-negotiated-continuously-reaffirmed',
        emotionalRange: ['devotion', 'ecstasy', 'surrender', 'awe', 'trust', 'gratitude', 'transcendence'],
        dialogueStyle: 'worship',
        touchStyle: 'ritualistic',
        aftercareNeeded: true,
        darkContent: false,
      },
      supernatural: {
        label: 'Supernatural (Vampire / Demon / Creature / Mortal)',
        baseTrust: 30,
        baseIntimacy: 35,
        allowedTones: ['predatory', 'reverent', 'rough', 'desperate', 'tender', 'commanding', 'violent'],
        defaultTone: 'predatory',
        consentRequired: 'explicit-with-danger',
        emotionalRange: [
          'predation', 'fascination', 'desire', 'fear', 'dominance', 'submission',
          'hunger', 'ecstasy', 'danger', 'trust-despite-fear',
        ],
        dialogueStyle: 'hunter-hunted',
        touchStyle: 'predatory-sensual',
        aftercareNeeded: true,
        darkContent: true,
      },
      monsterLover: {
        label: 'Monster / Lover (Beast / Creature / Non-Human Romance)',
        baseTrust: 35,
        baseIntimacy: 25,
        allowedTones: ['rough', 'gentle-giant', 'predatory', 'reverent', 'desperate', 'playful'],
        defaultTone: 'gentle-giant',
        consentRequired: 'explicit',
        emotionalRange: ['curiosity', 'trust', 'desire', 'fascination', 'fear', 'tenderness', 'playfulness'],
        dialogueStyle: 'interspecies',
        touchStyle: 'ponderous-gentle',
        aftercareNeeded: true,
        darkContent: false,
      },

      // --- COERCED / PRESSURE-BASED (Story Contexts) ---
      coercedConsent: {
        label: 'Coerced Consent (Power Pressure — Blackmail / Debt / Duty)',
        baseTrust: 20,
        baseIntimacy: 10,
        allowedTones: ['guilty', 'desperate', 'rough', 'conflicted', 'cold'],
        defaultTone: 'conflicted',
        consentRequired: 'coerced-but-willing',
        emotionalRange: [
          'shame', 'desperation', 'guilt', 'anger', 'numbness', 'resignation',
          'survival', 'self-disgust', 'dominance', 'pity',
        ],
        dialogueStyle: 'transactional-desperate',
        touchStyle: 'reluctant-resentful',
        aftercareNeeded: true,
        darkContent: true,
        contentNotes: 'Narrative where consent exists under duress (debt, blackmail, duty to family/nation). Emotionally complex — not pure non-consent.',
      },
    };

    // ===================================================================
    // TONES — FULL SPECTRUM
    // ===================================================================
    this.TONES = {
      // Soft
      tender: {
        label: 'Tender',
        speed: 0.4, roughness: 0.1, dialogueIntensity: 0.3,
        kissFrequency: 0.9, eyeContact: 0.8, touchGentleness: 0.9,
        verbalAffection: 0.9, degradation: 0.0, painFocus: 0.0,
        description: 'Soft touches, whispered affirmations, slow movement. Making love.',
      },
      reverent: {
        label: 'Reverent / Worshipful',
        speed: 0.3, roughness: 0.05, dialogueIntensity: 0.4,
        kissFrequency: 0.6, eyeContact: 0.9, touchGentleness: 1.0,
        verbalAffection: 0.9, degradation: 0.0, painFocus: 0.0,
        description: 'Touching like sacred ground. Gratitude and awe.',
      },
      grateful: {
        label: 'Grateful',
        speed: 0.35, roughness: 0.1, dialogueIntensity: 0.4,
        kissFrequency: 0.7, eyeContact: 0.7, touchGentleness: 0.8,
        verbalAffection: 0.8, degradation: 0.0, painFocus: 0.0,
        description: 'Thankful, tender. Like a gift.',
      },
      curious: {
        label: 'Curious / Exploring',
        speed: 0.4, roughness: 0.15, dialogueIntensity: 0.3,
        kissFrequency: 0.5, eyeContact: 0.5, touchGentleness: 0.7,
        verbalAffection: 0.4, degradation: 0.0, painFocus: 0.0,
        description: 'Discovery. Learning each other.',
      },
      tentative: {
        label: 'Tentative / Nervous',
        speed: 0.3, roughness: 0.05, dialogueIntensity: 0.2,
        kissFrequency: 0.3, eyeContact: 0.3, touchGentleness: 0.6,
        verbalAffection: 0.2, degradation: 0.0, painFocus: 0.0,
        description: 'Shy touches. Building courage.',
      },

      // Medium
      passionate: {
        label: 'Passionate',
        speed: 0.7, roughness: 0.4, dialogueIntensity: 0.6,
        kissFrequency: 0.7, eyeContact: 0.7, touchGentleness: 0.5,
        verbalAffection: 0.6, degradation: 0.1, painFocus: 0.1,
        description: 'Intense connection, deep kissing, urgent movement.',
      },
      playful: {
        label: 'Playful / Teasing',
        speed: 0.5, roughness: 0.2, dialogueIntensity: 0.5,
        kissFrequency: 0.6, eyeContact: 0.6, touchGentleness: 0.7,
        verbalAffection: 0.5, degradation: 0.2, painFocus: 0.0,
        description: 'Laughter between kisses, light dominance games.',
      },
      desperate: {
        label: 'Desperate / Urgent',
        speed: 0.9, roughness: 0.6, dialogueIntensity: 0.8,
        kissFrequency: 0.5, eyeContact: 0.9, touchGentleness: 0.2,
        verbalAffection: 0.4, degradation: 0.3, painFocus: 0.2,
        description: 'This might be the last time. Clinging.',
      },
      hungry: {
        label: 'Hungry / Lustful',
        speed: 0.8, roughness: 0.5, dialogueIntensity: 0.6,
        kissFrequency: 0.6, eyeContact: 0.5, touchGentleness: 0.3,
        verbalAffection: 0.3, degradation: 0.2, painFocus: 0.1,
        description: 'Pure raw physical desire.',
      },
      teasing: {
        label: 'Teasing',
        speed: 0.5, roughness: 0.25, dialogueIntensity: 0.5,
        kissFrequency: 0.4, eyeContact: 0.6, touchGentleness: 0.6,
        verbalAffection: 0.3, degradation: 0.3, painFocus: 0.0,
        description: 'Edging. Denial. Control games.',
      },
      protective: {
        label: 'Protective',
        speed: 0.4, roughness: 0.15, dialogueIntensity: 0.4,
        kissFrequency: 0.6, eyeContact: 0.7, touchGentleness: 0.8,
        verbalAffection: 0.7, degradation: 0.0, painFocus: 0.0,
        description: '"I\'ve got you. Nothing will hurt you."',
      },

      // Rough / Intense
      rough: {
        label: 'Rough / Primal',
        speed: 0.85, roughness: 0.8, dialogueIntensity: 0.7,
        kissFrequency: 0.3, eyeContact: 0.4, touchGentleness: 0.1,
        verbalAffection: 0.2, degradation: 0.5, painFocus: 0.5,
        description: 'Gripping, hair pulling, being thrown around.',
      },
      commanding: {
        label: 'Commanding / Dominant',
        speed: 0.7, roughness: 0.6, dialogueIntensity: 0.9,
        kissFrequency: 0.4, eyeContact: 0.8, touchGentleness: 0.3,
        verbalAffection: 0.3, degradation: 0.6, painFocus: 0.4,
        description: 'Orders given and followed. Controlled intensity.',
      },
      posessive: {
        label: 'Possessive / Claiming',
        speed: 0.75, roughness: 0.6, dialogueIntensity: 0.7,
        kissFrequency: 0.4, eyeContact: 0.8, touchGentleness: 0.2,
        verbalAffection: 0.5, degradation: 0.4, painFocus: 0.3,
        description: '"Mine." Marking territory. Deep ownership.',
      },
      degradingAsPlay: {
        label: 'Degrading (Consensual Play)',
        speed: 0.7, roughness: 0.7, dialogueIntensity: 0.9,
        kissFrequency: 0.2, eyeContact: 0.3, touchGentleness: 0.1,
        verbalAffection: 0.1, degradation: 0.9, painFocus: 0.5,
        description: 'Name-calling, humiliation, objectification within negotiated boundaries.',
      },
      tenderAsReward: {
        label: 'Tender as Reward',
        speed: 0.3, roughness: 0.1, dialogueIntensity: 0.5,
        kissFrequency: 0.8, eyeContact: 0.9, touchGentleness: 1.0,
        verbalAffection: 0.9, degradation: 0.0, painFocus: 0.0,
        description: 'After being rough. "You did so well. Let me take care of you."',
      },
      worshipful: {
        label: 'Worshipful / Adoring',
        speed: 0.3, roughness: 0.05, dialogueIntensity: 0.5,
        kissFrequency: 0.7, eyeContact: 0.9, touchGentleness: 1.0,
        verbalAffection: 0.9, degradation: 0.0, painFocus: 0.0,
        description: 'Kissing feet, praising every inch, gratitude.',
      },

      // Guilt / Conflict
      guilty: {
        label: 'Guilty / Conflicted',
        speed: 0.5, roughness: 0.3, dialogueIntensity: 0.5,
        kissFrequency: 0.4, eyeContact: 0.3, touchGentleness: 0.5,
        verbalAffection: 0.3, degradation: 0.2, painFocus: 0.1,
        description: '"We shouldn\'t be doing this." Eyes that can\'t meet.',
      },
      conflicted: {
        label: 'Conflicted / Torn',
        speed: 0.5, roughness: 0.3, dialogueIntensity: 0.5,
        kissFrequency: 0.3, eyeContact: 0.2, touchGentleness: 0.4,
        verbalAffection: 0.2, degradation: 0.3, painFocus: 0.2,
        description: 'Every touch is a war between want and conscience.',
      },
      cold: {
        label: 'Cold / Detached',
        speed: 0.6, roughness: 0.4, dialogueIntensity: 0.2,
        kissFrequency: 0.1, eyeContact: 0.2, touchGentleness: 0.1,
        verbalAffection: 0.0, degradation: 0.7, painFocus: 0.3,
        description: 'Mechanical. No warmth. Just getting it done.',
      },

      // Dark / Violent
      aggressive: {
        label: 'Aggressive / Hostile',
        speed: 0.95, roughness: 0.95, dialogueIntensity: 0.9,
        kissFrequency: 0.1, eyeContact: 0.2, touchGentleness: 0.0,
        verbalAffection: 0.0, degradation: 0.8, painFocus: 0.8,
        description: 'Taking. Anger and lust blurred.',
      },
      violent: {
        label: 'Violent / Brutal',
        speed: 1.0, roughness: 1.0, dialogueIntensity: 0.8,
        kissFrequency: 0.0, eyeContact: 0.1, touchGentleness: 0.0,
        verbalAffection: 0.0, degradation: 0.9, painFocus: 1.0,
        description: 'Pain is the point. Power is the currency.',
      },
      degrading: {
        label: 'Degrading / Humiliating (Non-Consensual)',
        speed: 0.8, roughness: 0.9, dialogueIntensity: 0.9,
        kissFrequency: 0.0, eyeContact: 0.1, touchGentleness: 0.0,
        verbalAffection: 0.0, degradation: 1.0, painFocus: 0.7,
        description: 'Reducing someone. Breaking them down.',
      },
      hateful: {
        label: 'Hateful / Vindictive',
        speed: 0.9, roughness: 1.0, dialogueIntensity: 0.9,
        kissFrequency: 0.0, eyeContact: 0.1, touchGentleness: 0.0,
        verbalAffection: 0.0, degradation: 0.8, painFocus: 0.9,
        description: 'Every thrust fueled by contempt.',
      },
      predatory: {
        label: 'Predatory',
        speed: 0.7, roughness: 0.7, dialogueIntensity: 0.6,
        kissFrequency: 0.2, eyeContact: 0.7, touchGentleness: 0.1,
        verbalAffection: 0.1, degradation: 0.5, painFocus: 0.5,
        description: 'The hunter enjoying the hunt. Deliberate. Knowing.',
      },
      gentleGiant: {
        label: 'Gentle Giant',
        speed: 0.3, roughness: 0.1, dialogueIntensity: 0.3,
        kissFrequency: 0.5, eyeContact: 0.6, touchGentleness: 0.8,
        verbalAffection: 0.6, degradation: 0.0, painFocus: 0.0,
        description: 'Aware of their own size. Extra careful. Tender power.',
      },

      // Other
      sarcastic: {
        label: 'Sarcastic / Snarky',
        speed: 0.6, roughness: 0.4, dialogueIntensity: 0.6,
        kissFrequency: 0.3, eyeContact: 0.5, touchGentleness: 0.4,
        verbalAffection: 0.1, degradation: 0.4, painFocus: 0.1,
        description: 'Biting remarks between bites to the neck.',
      },
      survival: {
        label: 'Survival / Enduring',
        speed: 0.5, roughness: 0.5, dialogueIntensity: 0.2,
        kissFrequency: 0.0, eyeContact: 0.1, touchGentleness: 0.0,
        verbalAffection: 0.0, degradation: 0.4, painFocus: 0.5,
        description: 'Dissociating. Letting it happen. Focused on surviving.',
      },
    };

    // ===================================================================
    // EMOTIONAL REACTIONS — Expanded
    // ===================================================================
    this.EMOTIONAL_REACTIONS = {
      // --- LIGHT / POSITIVE ---
      love: {
        dialogue: [
          'I love you. Say it back.',
          'Look at me. I want to see your eyes when I—',
          'You\'re so beautiful like this.',
          'I can\'t believe you\'re mine.',
          'I never want this to end.',
          'You feel like coming home.',
        ],
        physicalCues: ['lingering eye contact', 'gentle face touching', 'slow deep strokes'],
        breathingPattern: 'deep and synchronized',
      },
      gratitude: {
        dialogue: [
          'Thank you. For trusting me.',
          'I don\'t deserve you.',
          'This means everything.',
        ],
        physicalCues: ['holding tight', 'kissing hands', 'burying face in chest'],
        breathingPattern: 'deep, sighing',
      },
      tenderness: {
        dialogue: [
          'You\'re so good to me.',
          'I want to take care of you.',
          'Come here. Let me hold you.',
          'I\'ve got you. I\'m right here.',
          'Tell me what you need.',
        ],
        physicalCues: ['soft kisses on forehead', 'caressing hair', 'spooning'],
        breathingPattern: 'slow, calming',
      },
      ecstasy: {
        dialogue: [
          'Oh god... oh fuck... right there!',
          'I\'m gonna... please don\'t stop...',
          'Yes yes yes YES!',
          '*incoherent moaning*',
          'Don\'t stop, don\'t stop, don\'t—',
        ],
        physicalCues: ['arched back', 'trembling thighs', 'gripping sheets'],
        breathingPattern: 'fast, desperate',
      },

      // --- VULNERABLE ---
      vulnerability: {
        dialogue: [
          'I\'m scared how much I need this.',
          'Don\'t stop holding me.',
          'I feel so exposed... but I trust you.',
          'No one\'s ever seen me like this.',
        ],
        physicalCues: ['trembling', 'burying face in neck', 'holding tight'],
        breathingPattern: 'shallow, catching',
      },

      // --- DESPERATE / URGENT ---
      desperation: {
        dialogue: [
          'Please... please I need you so bad.',
          'Don\'t you dare stop. Don\'t you fucking stop.',
          'I don\'t care anymore. Just... just do it.',
          'If this is the last time, make it count.',
          'I need you inside me. Now.',
        ],
        physicalCues: ['clawing at back', 'frantic kisses', 'pulling closer'],
        breathingPattern: 'ragged, gasping',
      },
      longing: {
        dialogue: [
          'I\'ve wanted this for so long.',
          'I used to dream about this.',
          'All this time I pretended I didn\'t want you.',
          'I can\'t hold back anymore.',
        ],
        physicalCues: ['touching like afraid they\'ll disappear', 'memorizing with fingertips'],
        breathingPattern: 'heavy, emotional',
      },

      // --- GUILT / SHAME ---
      guilt: {
        dialogue: [
          'We shouldn\'t be doing this.',
          '...we can\'t tell anyone. Ever.',
          'I know this is wrong but I can\'t stop.',
          'Tell me you don\'t regret this.',
          'What are we doing...?',
          'God... this is so fucking wrong...',
        ],
        physicalCues: ['hesitant touches', 'avoiding eye contact', 'sudden clinging'],
        breathingPattern: 'uneven, sighing',
      },
      shame: {
        dialogue: [
          'Don\'t look at me.',
          'I\'m disgusting. I know I am.',
          'Cover me. Please.',
          'I can\'t believe I let you see me like this.',
        ],
        physicalCues: ['covering face', 'turning away', 'curling in on themselves'],
        breathingPattern: 'shallow, ashamed',
      },
      confusion: {
        dialogue: [
          'I don\'t... I don\'t understand what I\'m feeling.',
          'This shouldn\'t feel this good. It shouldn\'t.',
          'Is this real? Are we really—?',
          'I need a second. I can\'t think.',
        ],
        physicalCues: ['pulling back then leaning in', 'touching own face in disbelief'],
        breathingPattern: 'uneven, questioning',
      },

      // --- POWER / CONTROL ---
      dominance: {
        dialogue: [
          'Look at me while you\'re taking it.',
          'You belong to me. Say it.',
          'I decide when you come. Understood?',
          'Take it. All of it. You can handle it.',
          'On your knees. Now.',
          'You\'re so beautiful when you obey.',
        ],
        physicalCues: ['firm grip on jaw', 'pushing into bed', 'controlled movements'],
        breathingPattern: 'steady, controlled',
      },
      submission: {
        dialogue: [
          'I trust you. Do what you want with me.',
          'Please... please let me make you feel good.',
          'I\'m yours. All of me.',
          'Tell me what you need. Let me be that.',
          'Use me. I want you to use me.',
          'I belong to you.',
        ],
        physicalCues: ['exposed throat', 'open body language', 'waiting for guidance'],
        breathingPattern: 'following partner\'s rhythm',
      },
      devotion: {
        dialogue: [
          'I would do anything for you.',
          'You own me. Completely.',
          'I live to serve you.',
          'I\'d burn the world down for you.',
        ],
        physicalCues: ['kissing feet', 'pressing forehead to ground', 'eyes lowered'],
        breathingPattern: 'deep, reverent',
      },
      pride: {
        dialogue: [
          'Look at you. Taking it so well.',
          'You\'re doing so good for me.',
          'I made you like this. You\'re mine.',
        ],
        physicalCues: ['stroking hair', 'admiring gaze', 'tracing body lines'],
        breathingPattern: 'satisfied, deep',
      },

      // --- DARK / PAIN / FEAR ---
      fear: {
        dialogue: [
          'Please... please don\'t hurt me.',
          'I\'ll be good. I\'ll be so good.',
          'Stop. Please stop.',
          'No— no, I changed my mind, please—',
        ],
        physicalCues: ['trembling', 'curling away', 'covering head', 'going still'],
        breathingPattern: 'rapid, panicked',
      },
      anger: {
        dialogue: [
          'Get the fuck off me.',
          'I hope you enjoy this while it lasts.',
          'I\'ll fucking kill you for this.',
          'Don\'t you dare enjoy this.',
        ],
        physicalCues: ['struggling', 'baring teeth', 'spitting', 'going rigid'],
        breathingPattern: 'harsh, furious',
      },
      numbness: {
        dialogue: [
          '*silent*',
          'Just get it over with.',
          'I\'m not here. I\'m not here.',
        ],
        physicalCues: ['limp', 'staring at wall', 'not moving', 'gone eyes'],
        breathingPattern: 'shallow, barely there',
      },
      defiance: {
        dialogue: [
          'Do your worst. I won\'t break.',
          'You think this scares me?',
          'I\'ll enjoy watching you fall.',
          'Is that all you\'ve got?',
        ],
        physicalCues: ['meeting eyes with hate', 'not flinching', 'forcing body to stay still'],
        breathingPattern: 'controlled, angry',
      },
      survivalInstinct: {
        dialogue: [
          '*thinking:* Just let it happen. Survive.',
          '*nods mechanically*',
          'I\'ll do what you want. Just don\'t... don\'t.',
        ],
        physicalCues: ['complying stiffly', 'eyes tracking exits', 'shallow obedience'],
        breathingPattern: 'controlled panic',
      },
      cruelty: {
        dialogue: [
          'You\'re nothing. Remember that.',
          'Look at you. Pathetic.',
          'I own you. Say it.',
          'This is what you\'re for.',
        ],
        physicalCues: ['rough grips', 'spitting on them', 'pushing face down'],
        breathingPattern: 'excited, predatory',
      },
      predatoryHunger: {
        dialogue: [
          'I\'ve been hunting you all night.',
          'You smell like fear... and want.',
          'I\'m going to devour you.',
          'Run. It\'ll be more fun.',
        ],
        physicalCues: ['slow circling', 'sharp smiles', 'inhaling deeply near them'],
        breathingPattern: 'deep, savoring',
      },

      // --- FORBIDDEN / TABOO SPECIFIC ---
      forbiddenLonging: {
        dialogue: [
          'I know I shouldn\'t want you. But I do.',
          'I\'ve wanted this longer than I\'ll admit.',
          'If someone finds out... I don\'t care anymore.',
          'Every time I see you across the table...',
          'I think about you when I\'m alone at night.',
          'This doesn\'t change anything between us. It changes everything.',
          'I\'d rather burn in hell than never feel this again.',
        ],
        physicalCues: ['touching like forbidden fruit', 'guilty glances', 'holding breath'],
        breathingPattern: 'conflicted, catching',
      },
      protectiveDistortion: {
        dialogue: [
          'I\'m supposed to protect you from things like this.',
          'From people like me.',
          'I hate myself for wanting this.',
          'You don\'t understand what you\'re asking for.',
        ],
        physicalCues: ['pulling back', 'fighting own hands', 'anguished eyes'],
        breathingPattern: 'tormented, ragged',
      },
      sharedTaboo: {
        dialogue: [
          'We can\'t... we really can\'t do this.',
          '*they do it anyway*',
          'If we\'re going to hell, at least we go together.',
          'No one can ever know. Promise me.',
          'This is ours. Our secret.',
        ],
        physicalCues: ['hushed movements', 'listening for others', 'frantic secrecy'],
        breathingPattern: 'silent, desperate',
      },
    };

    // Additional emotional reactions for non-consensual dark narratives
    this.DARK_EMOTIONAL_REACTIONS = {
      captorCruelty: {
        dialogue: [
          'Shh... stop struggling. It only makes it worse.',
          'You\'re mine now. Accept it.',
          'I can do whatever I want to you. And I will.',
          'You should have behaved.',
          'This is what happens to people who don\'t learn their place.',
        ],
        physicalCues: ['slow calculated movements', 'enjoying the fear', 'taunting'],
        breathingPattern: 'controlled, savoring',
      },
      victimDissociation: {
        dialogue: [
          '*eyes fixed on the ceiling*',
          '*counting in their head*',
          '*gone somewhere else*',
          '...',
          '*silent tears*',
        ],
        physicalCues: ['completely still', 'not responding', 'disconnected eyes'],
        breathingPattern: 'barely perceptible',
      },
      victimPleading: {
        dialogue: [
          'Please. I\'ll do anything. Just don\'t—',
          'I have a family. Please let me go.',
          'Why are you doing this?',
          'I\'m begging you.',
        ],
        physicalCues: ['reaching out', 'grabbing at clothes', 'sobbing'],
        breathingPattern: 'hysterical, broken',
      },
      victimDefiance: {
        dialogue: [
          'I\'ll never give you the satisfaction of breaking me.',
          'Do what you want. I won\'t cry for you.',
          'You\'re nothing.',
          'I will survive this and I will find you.',
        ],
        physicalCues: ['spitting', 'refusing to close eyes', 'forced calm'],
        breathingPattern: 'controlled fury',
      },
    };
  }

  /**
   * MAIN API: Resolve scene tone
   */
  resolveSceneTone(context) {
    const { character, relationship, narrativeTone, narrativePosition, intensity } = context;

    // 1. Get relationship archetype from parent app data
    const archetypeId = relationship?.archetype || 'strangers';
    const archetype = this.RELATIONSHIP_ARCHETYPES[archetypeId];
    if (!archetype) {
      console.warn(`[NarrativeTone] Unknown archetype: ${archetypeId}, falling back to strangers`);
      return this.resolveSceneTone({ ...context, relationship: { ...relationship, archetype: 'strangers' } });
    }

    // 2. Resolve tone from narrative context
    let toneId = narrativeTone || archetype.defaultTone;
    if (!archetype.allowedTones.includes(toneId)) {
      toneId = this.findClosestTone(toneId, archetype.allowedTones);
    }

    // 3. Get tone profile
    const toneProfile = { ...this.TONES[toneId] };
    if (!toneProfile) {
      console.warn(`[NarrativeTone] Unknown tone: ${toneId}, using default`);
      return this.resolveSceneTone({ ...context, narrativeTone: archetype.defaultTone });
    }

    // 4. Modulate by intensity
    const intensityFactor = (intensity || 5) / 5;
    toneProfile.speed = THREE.MathUtils.clamp(toneProfile.speed * intensityFactor, 0.1, 1.0);
    toneProfile.roughness = THREE.MathUtils.clamp(toneProfile.roughness * intensityFactor, 0, 1.0);
    toneProfile.dialogueIntensity = THREE.MathUtils.clamp(toneProfile.dialogueIntensity * intensityFactor, 0, 1.0);
    toneProfile.painFocus = THREE.MathUtils.clamp(toneProfile.painFocus * intensityFactor, 0, 1.0);

    // 5. Modulate by trust
    const trust = relationship?.trust ?? archetype.baseTrust;
    toneProfile.consentStability = trust / 100;

    // 6. Narrative position modifiers
    if (narrativePosition === 'climax') {
      toneProfile.speed = Math.min(1.0, toneProfile.speed * 1.3);
    } else if (narrativePosition === 'resolution' || narrativePosition === 'aftercare') {
      toneProfile.speed *= 0.5;
      toneProfile.roughness *= 0.3;
      toneProfile.touchGentleness = Math.max(toneProfile.touchGentleness, 0.7);
      toneProfile.painFocus *= 0.2;
    }

    // 7. Generate emotional context
    const emotions = this.generateEmotionalContext(archetype, toneId, relationship, intensity);

    // 8. Build consent model
    const consent = this.buildConsentModel(archetype, toneId, trust);

    return {
      archetype: archetypeId,
      archetypeLabel: archetype.label,
      toneId,
      toneProfile,
      consent,
      emotions,
      dialogueStyle: archetype.dialogueStyle,
      touchStyle: archetype.touchStyle,
      aftercareNeeded: archetype.aftercareNeeded,
      darkContent: archetype.darkContent,
      
      animationParams: {
        speed: toneProfile.speed,
        roughness: toneProfile.roughness,
        eyeContact: toneProfile.eyeContact,
        kissFrequency: toneProfile.kissFrequency,
        touchGentleness: toneProfile.touchGentleness,
        painFocus: toneProfile.painFocus,
      },
      audioParams: {
        dialogueIntensity: toneProfile.dialogueIntensity,
        verbalAffection: toneProfile.verbalAffection,
        degradation: toneProfile.degradation,
        pain: toneProfile.painFocus,
      },
    };
  }

  /**
   * Generate emotional reactions for scene
   */
  generateEmotionalContext(archetype, toneId, relationship, intensity) {
    const available = archetype.emotionalRange || [];
    
    // Map tones to likely emotions
    const toneEmotionMap = {
      tender: ['love', 'tenderness', 'vulnerability'],
      reverent: ['love', 'devotion', 'tenderness'],
      grateful: ['gratitude', 'tenderness', 'love'],
      curious: ['desire', 'playfulness'],
      tentative: ['vulnerability', 'desire'],
      passionate: ['love', 'ecstasy', 'vulnerability'],
      playful: ['submission', 'dominance', 'playfulness'],
      desperate: ['desperation', 'guilt', 'ecstasy', 'longing'],
      hungry: ['desire', 'dominance', 'ecstasy'],
      teasing: ['dominance', 'submission', 'playfulness'],
      protective: ['tenderness', 'love', 'vulnerability'],
      rough: ['dominance', 'submission', 'ecstasy'],
      commanding: ['dominance', 'submission', 'pride'],
      posessive: ['dominance', 'devotion', 'pride'],
      degradingAsPlay: ['dominance', 'submission', 'devotion'],
      tenderAsReward: ['tenderness', 'love', 'gratitude'],
      worshipful: ['devotion', 'love', 'tenderness'],
      guilty: ['guilt', 'vulnerability', 'desperation', 'forbiddenLonging'],
      conflicted: ['confusion', 'guilt', 'forbiddenLonging', 'desperation'],
      cold: ['dominance', 'numbness', 'cruelty'],
      aggressive: ['anger', 'fear', 'cruelty', 'defiance'],
      violent: ['cruelty', 'fear', 'anger', 'numbness'],
      degrading: ['cruelty', 'shame', 'fear', 'numbness'],
      hateful: ['anger', 'cruelty', 'defiance', 'fear'],
      predatory: ['predatoryHunger', 'fear', 'desire'],
      gentleGiant: ['tenderness', 'love', 'vulnerability'],
      sarcastic: ['dominance', 'playfulness', 'anger'],
      survival: ['numbness', 'fear', 'survivalInstinct'],
    };

    const toneEmotions = toneEmotionMap[toneId] || ['ecstasy'];
    const matched = toneEmotions.filter(e => available.includes(e));
    
    // Select 2 emotions
    let selected;
    if (matched.length >= 2) {
      selected = matched.slice(0, 2);
    } else if (matched.length === 1) {
      // Find a second from available that's closest
      const fallback = available.find(e => e !== matched[0]) || 'ecstasy';
      selected = [matched[0], fallback];
    } else {
      selected = ['desire', 'ecstasy'];
    }

    // Check if we need dark reactions
    const isDark = toneProfile?.roughness > 0.7 || ['aggressive', 'violent', 'degrading', 'hateful'].includes(toneId);
    const reactionPool = isDark 
      ? { ...this.EMOTIONAL_REACTIONS, ...this.DARK_EMOTIONAL_REACTIONS }
      : this.EMOTIONAL_REACTIONS;

    return selected.map(emotionId => {
      const reaction = reactionPool[emotionId];
      if (!reaction) return null;

      const dialogueIndex = Math.min(
        Math.floor((intensity || 5) / 3) % reaction.dialogue.length,
        reaction.dialogue.length - 1
      );

      return {
        emotion: emotionId,
        dialogue: reaction.dialogue[dialogueIndex],
        physicalCues: reaction.physicalCues,
        breathing: reaction.breathingPattern,
      };
    }).filter(Boolean);
  }

  /**
   * Build consent model for archetype + tone
   */
  buildConsentModel(archetype, toneId, trust) {
    const baseRequirement = archetype.consentRequired || 'explicit';
    const roughness = this.TONES[toneId]?.roughness || 0;
    
    let consentStyle = baseRequirement;

    // Override for dark tones on certain archetypes
    if (roughness > 0.7 && archetype.consentRequired === 'narrative-context-nonconsensual') {
      consentStyle = 'narrative-context-nonconsensual';
    }

    const checkinPoints = [];
    if (roughness > 0.4) {
      checkinPoints.push('before-start');
    }
    if (roughness > 0.6) {
      checkinPoints.push('after-first-intense-moment');
      checkinPoints.push('mid-scene-verbal-check');
    }
    if (roughness > 0.8) {
      checkinPoints.push('after-climax');
    }

    return {
      style: consentStyle,
      checkinPoints,
      safewordRequired: roughness > 0.5 || archetype.darkContent,
      canWithdrawAnytime: true,
      playerCheckinRequired: archetype.darkContent,
      nonVerbalCues: trust > 60 && !archetype.darkContent,
    };
  }

  /**
   * Find closest allowed tone
   */
  findClosestTone(requestedId, allowedTones) {
    const groups = {
      tender: ['tender', 'reverent', 'passionate', 'protective'],
      reverent: ['reverent', 'tender', 'worshipful'],
      grateful: ['grateful', 'tender', 'reverent'],
      passionate: ['passionate', 'tender', 'desperate', 'hungry'],
      playful: ['playful', 'teasing', 'sarcastic', 'tender'],
      desperate: ['desperate', 'passionate', 'rough', 'guilty', 'hungry'],
      hungry: ['hungry', 'desperate', 'passionate', 'rough'],
      teasing: ['teasing', 'playful', 'commanding'],
      protective: ['protective', 'tender', 'reverent'],
      rough: ['rough', 'aggressive', 'commanding', 'desperate', 'posessive'],
      commanding: ['commanding', 'posessive', 'rough', 'dominant'],
      posessive: ['posessive', 'commanding', 'rough', 'degradingAsPlay'],
      degradingAsPlay: ['degradingAsPlay', 'commanding', 'rough', 'posessive'],
      tenderAsReward: ['tenderAsReward', 'tender', 'reverent', 'grateful'],
      worshipful: ['worshipful', 'reverent', 'tender'],
      guilty: ['guilty', 'conflicted', 'desperate', 'tender'],
      conflicted: ['conflicted', 'guilty', 'desperate', 'cold'],
      cold: ['cold', 'rough', 'commanding', 'aggressive'],
      aggressive: ['aggressive', 'violent', 'rough', 'hateful', 'degrading'],
      violent: ['violent', 'aggressive', 'hateful', 'degrading'],
      degrading: ['degrading', 'aggressive', 'violent', 'rough'],
      hateful: ['hateful', 'aggressive', 'violent', 'cold'],
      predatory: ['predatory', 'aggressive', 'commanding', 'rough'],
      gentleGiant: ['gentleGiant', 'tender', 'reverent', 'protective'],
      sarcastic: ['sarcastic', 'playful', 'teasing', 'rough'],
      survival: ['survival', 'cold', 'numbness', 'fear'],
    };

    const group = groups[requestedId] || [requestedId];
    for (const tone of group) {
      if (allowedTones.includes(tone)) return tone;
    }
    return allowedTones[0] || 'tender';
  }

  /**
   * Get dialogue for a specific scene moment
   */
  getDialogueForMoment(toneResult, momentType, partnerName) {
    const { emotions, toneProfile, consent } = toneResult;
    if (!emotions || emotions.length === 0) return null;

    const primaryEmotion = emotions[0];
    if (!primaryEmotion) return null;

    // For dark content, check consent state first
    if (consent?.style === 'narrative-context-nonconsensual' && momentType === 'checkin') {
      return `(Out of character check-in. Scene is intense. Type SAFEWORD to stop.)`;
    }

    return primaryEmotion.dialogue;
  }

  /**
   * Check if action is allowed for tone
   */
  isActionAllowed(toneResult, actionType) {
    const roughness = toneResult.toneProfile.roughness;
    const consentStyle = toneResult.consent.style;

    const actionCategories = {
      tender: ['touch', 'kiss', 'caress', 'whisper', 'eye-contact', 'hold'],
      medium: ['thrust', 'bite', 'grip', 'pull-hair', 'spank'],
      rough: ['deep-thrust', 'choke', 'degrade', 'force', 'restrain', 'spit'],
      violent: ['hit', 'cut', 'blood', 'scream', 'break'],
    };

    if (consentStyle === 'narrative-context-nonconsensual') {
      // All actions available for dark narratives
      return true;
    }

    if (roughness < 0.3) {
      return actionCategories.tender.includes(actionType);
    } else if (roughness < 0.6) {
      return [...actionCategories.tender, ...actionCategories.medium].includes(actionType);
    } else if (roughness < 0.85) {
      return [...actionCategories.tender, ...actionCategories.medium, ...actionCategories.rough].includes(actionType);
    } else {
      return Object.values(actionCategories).flat().includes(actionType);
    }
  }
}

// Register
window.NarrativeTone = new NarrativeToneSystem();
ECS.registerSystem(window.NarrativeTone);
