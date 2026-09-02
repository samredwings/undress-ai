/**
 * CARNAL ROULETTE VR — Game Logic Engine
 * Handles rounds, acts, climax tracking, roulette rolls
 */

const GameLogic = {
  current: {
    round: 1,
    phase: 'anticipation', // anticipation | active | climax | cooldown
    act: null,
    intensity: 45,
    climaxMeter: 0,
    timer: 0,
    maxTimer: 300, // 5 min default
    isRunning: false,
  },

  config: {
    partnerCount: 1,
    roundDuration: 5, // minutes
    intensityLevel: 5, // 1-10
    kinks: [],
    sceneType: 'bedroom',
  },

  partners: [],
  listeners: [],

  // === ACT LIBRARY ===
  acts: {
    oral: [
      'DEEP THROAT GAG REFLEX',
      'CUNNILINGUS • TONGUE FUCK',
      'FACE FUCK • TEARS & SLOP',
      'RIMMING • ASS TONGUE DRILL',
      'TITFUCK • COCK BETWEEN TITS',
      '69 • SIMULTANEOUS ORAL',
    ],
    vaginal: [
      'MISSIONARY • EYE CONTACT',
      'DOGGY STYLE • DEEP PENETRATION',
      'COWGIRL • RIDING BOUNCE',
      'REVERSE COWGIRL • ASS VIEW',
      'PRONE BONE • FACE DOWN ASS UP',
      'SCISSORING • CLIT GRIND',
    ],
    anal: [
      'ANAL BREEDING • TIGHT HOLE',
      'GAPING • ASSHOLE STRETCH',
      'DP ANAL + VAGINAL',
      'ANAL FISTING • FIST DEEP',
      'PEGGING • STRAP ON DOM',
      'ASS TO MOUTH TRANSITION',
    ],
    kink: [
      'BONDAGE • TIED SPREAD EAGLE',
      'CHOKING • BREATH PLAY',
      'FACIAL • CUM COVERED FACE',
      'CREAMPIE • CUM DRIPPING OUT',
      'EDGING • DENIED ORGASM',
      'RUINED ORGASM • SQUIRMING',
      'PUBLIC PLAY • RISK OF EXPOSURE',
      'WATERSPORTS • GOLDEN SHOWER',
      'CUM SWAP • KISS TRANSFER',
      'DOUBLE PENETRATION • TWO HOLES',
      'GANG BANG • MULTIPLE PARTNERS',
      'FISTING • FIST DEEP INSIDE',
      'CUM INFLATION • BELLY SWELL',
      'PET PLAY • ON ALL FOURS',
      'FREE USE • ALWAYS AVAILABLE',
    ],
  },

  // === MOODS ===
  moods: [
    'Desperate & Begging',
    'Dominant & Cruel',
    'Submissive & Greedy',
    'Horny & Teasing',
    'Aggressive & Feral',
    'Tender & Intimate',
    'Degraded & Needy',
    'Sensual & Slow',
  ],

  init(configOverride = {}) {
    Object.assign(this.config, configOverride);
    this.current.round = 1;
    this.current.intensity = 15 + (this.config.intensityLevel * 4);
    this.current.climaxMeter = 0;
    this.current.phase = 'anticipation';
    this.current.maxTimer = this.config.roundDuration * 60;
    this.partners = [];
    return this;
  },

  addPartner(name, roleOverride = null) {
    const roles = ['Greedy Cumslut', 'Dominant Bull', 'Submissive Toy', 'Eager Hole', 'Hesitant Virgin', 'Experienced Fucker'];
    const p = {
      id: this.partners.length + 1,
      name,
      role: roleOverride || roles[Math.floor(Math.random() * roles.length)],
      mood: this.moods[Math.floor(Math.random() * this.moods.length)],
      climax: Math.floor(Math.random() * 30),
      maxClimax: 100,
      pleasure: 20,
      sensitivity: 0.5 + Math.random() * 0.5,
      holes: {
        mouth: { used: false, stretched: 0 },
        pussy: { used: false, stretched: 0 },
        ass: { used: false, stretched: 0 },
      },
      stamina: 70 + Math.floor(Math.random() * 30),
      reactions: [],
    };
    this.partners.push(p);
    return p;
  },

  rollAct(category = null) {
    let pool = [];
    if (category && this.acts[category]) {
      pool = this.acts[category];
    } else {
      // Weighted random based on intensity
      const weights = [
        { cat: 'oral', weight: 30 },
        { cat: 'vaginal', weight: 30 },
        { cat: 'anal', weight: 20 + Math.floor(this.current.intensity / 5) },
        { cat: 'kink', weight: 10 + Math.floor(this.current.intensity / 3) },
      ];
      const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const w of weights) {
        roll -= w.weight;
        if (roll <= 0) {
          pool = this.acts[w.cat];
          break;
        }
      }
    }

    const act = pool[Math.floor(Math.random() * pool.length)];
    this.current.act = act;
    this.emit('act-rolled', { act, category });
    return act;
  },

  applyAction(actionType, intensity = 1) {
    if (this.current.phase === 'cooldown' || this.current.phase === 'climax') return null;

    const basePleasure = {
      thrust: 8,
      tease: 3,
      deep: 14,
      rhythm: 6,
      choke: 12,
      lick: 5,
      finger: 7,
      toy: 10,
    };

    const pleasure = (basePleasure[actionType] || 6) * intensity;

    // Update each partner's climax
    for (const p of this.partners) {
      const reaction = p.climax / 100;
      const mult = 1 + (reaction * 0.5) + (p.sensitivity * 0.3);
      const delta = (pleasure * mult * (this.current.intensity / 100));
      p.climax = Math.min(100, p.climax + delta);
      p.pleasure += delta * 0.3;

      // Generate reaction text
      if (p.climax > 90) {
        p.mood = 'On the Edge • Begging to Cum';
      } else if (p.climax > 70) {
        p.mood = 'Desperate • Body Shaking';
      } else if (p.climax > 50) {
        p.mood = 'Moaning • Taking It Deep';
      }

      // Modify holes
      const holeKeys = Object.keys(p.holes);
      const randomHole = holeKeys[Math.floor(Math.random() * holeKeys.length)];
      if (p.holes[randomHole]) {
        p.holes[randomHole].stretched = Math.min(100, p.holes[randomHole].stretched + intensity * 2);
        p.holes[randomHole].used = true;
      }
    }

    // Global climax meter
    const avgClimax = this.partners.reduce((s, p) => s + p.climax, 0) / this.partners.length;
    this.current.climaxMeter = avgClimax;

    // Check for climax event
    if (avgClimax >= 100) {
      this.triggerClimax();
    }

    this.current.intensity = Math.min(100, this.current.intensity + (intensity * 0.5));

    this.emit('action-applied', {
      actionType,
      intensity,
      avgClimax,
      partners: this.partners.map(p => ({
        name: p.name,
        climax: Math.floor(p.climax),
        mood: p.mood,
      })),
    });

    return { avgClimax, partners: this.partners };
  },

  triggerClimax() {
    this.current.phase = 'climax';
    this.emit('climax-started', {
      partners: this.partners.map(p => ({
        name: p.name,
        climax: 100,
        mood: 'CUMMING • UNCONTROLLABLE',
      })),
    });

    // Cooldown after climax
    setTimeout(() => {
      this.current.phase = 'cooldown';
      this.emit('cooldown-started');
      
      setTimeout(() => {
        this.nextRound();
      }, 8000);
    }, 4000);
  },

  nextRound() {
    this.current.round++;
    this.current.phase = 'anticipation';
    this.current.climaxMeter = 0;
    this.current.intensity = Math.min(100, this.current.intensity + 8);

    // Reset partners partially
    for (const p of this.partners) {
      p.climax = 10 + Math.floor(Math.random() * 15);
      p.mood = this.moods[Math.floor(Math.random() * this.moods.length)];
    }

    this.rollAct();
    this.emit('round-started', { round: this.current.round, intensity: this.current.intensity });
  },

  tick() {
    if (!this.current.isRunning || this.current.phase === 'climax' || this.current.phase === 'cooldown') return;

    this.current.timer++;

    // Natural decay if no action
    if (this.current.timer % 10 === 0) {
      for (const p of this.partners) {
        p.climax = Math.max(0, p.climax - 0.2);
      }
      this.current.climaxMeter = this.partners.reduce((s, p) => s + p.climax, 0) / this.partners.length;
    }

    // Auto-climax if timer runs out
    if (this.current.timer >= this.current.maxTimer) {
      this.triggerClimax();
    }

    this.emit('tick', {
      timer: this.current.timer,
      maxTimer: this.current.maxTimer,
      climaxMeter: this.current.climaxMeter,
      phase: this.current.phase,
    });
  },

  start() {
    this.current.isRunning = true;
    this.current.timer = 0;
    this.rollAct();
    this.emit('game-started', {
      round: this.current.round,
      intensity: this.current.intensity,
      act: this.current.act,
    });
  },

  pause() {
    this.current.isRunning = false;
    this.emit('game-paused');
  },

  resume() {
    this.current.isRunning = true;
    this.emit('game-resumed');
  },

  // === EVENT SYSTEM ===
  on(event, fn) {
    this.listeners.push({ event, fn });
  },

  off(event, fn) {
    this.listeners = this.listeners.filter(l => l.event !== event || l.fn !== fn);
  },

  emit(event, data) {
    for (const l of this.listeners) {
      if (l.event === event) {
        try { l.fn(data); } catch(e) { console.warn('Listener error:', e); }
      }
    }
  },

  // Utility: generate reaction text based on state
  generateReaction(partner) {
    const reactions = {
      low: [
        `${partner.name} moans softly, "More... please..."`,
        `${partner.name} arches their back, pushing into you.`,
        `"Fuck... yes..." ${partner.name} whispers, eyes half-lidded.`,
        `${partner.name} bites their lip, trying not to scream.`,
      ],
      mid: [
        `${partner.name} cries out, "Oh god... right there!"`,
        `${partner.name}'s body trembles, gripping you tighter.`,
        `"Don't stop... please don't stop" — ${partner.name} is losing control.`,
        `${partner.name}'s legs shake as you hit the right spot.`,
      ],
      high: [
        `${partner.name} SCREAMS — "I'M GONNA CUM!"`,
        `${partner.name} convulses, grabbing anything for support.`,
        `"FUCK ME... FUCK ME HARDER!" — ${partner.name} is feral.`,
        `${partner.name} is babbling incoherently, lost in pleasure.`,
      ],
      climax: [
        `${partner.name} EXPLODES — body arching, cumming uncontrollably!`,
        `${partner.name} lets out a primal scream as the orgasm rips through them.`,
        `${partner.name}'s eyes roll back, cumming harder than ever before.`,
      ],
    };

    let tier = 'low';
    if (partner.climax > 80) tier = 'climax';
    else if (partner.climax > 60) tier = 'high';
    else if (partner.climax > 35) tier = 'mid';

    const pool = reactions[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  },
};
