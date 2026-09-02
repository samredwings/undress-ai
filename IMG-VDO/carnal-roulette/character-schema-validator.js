/**
 * CARNAL ROULETTE VR — Character Schema Validator
 * 
 * Ensures all character data entering the system conforms to 
 * the defined schema. Rejects malformed data with clear errors.
 */

const CharacterSchemaValidator = (() => {
  const VALIDATORS = {
    string: (v) => typeof v === 'string',
    number: (v) => typeof v === 'number' && !isNaN(v),
    boolean: (v) => typeof v === 'boolean',
    array: (v) => Array.isArray(v),
    object: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
    nullable: (v) => v === null || v === undefined,
  };

  const CHARACTER_SCHEMA = {
    id: { type: 'string', required: true, pattern: /^[a-zA-Z0-9_-]{4,64}$/ },
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    age: { type: 'number', required: true, min: 18, max: 999 },
    gender: { type: 'string', required: true, enum: ['male', 'female', 'non-binary', 'trans-male', 'trans-female', 'fluid', 'androgyne'] },
    species: { type: 'string', default: 'human' },
    
    appearance: {
      type: 'object',
      required: true,
      fields: {
        skinTone: { type: 'string', pattern: /^#[0-9a-fA-F]{6}$/, default: '#e8c4a0' },
        eyeColor: { type: 'string', pattern: /^#[0-9a-fA-F]{6}$/, default: '#334466' },
        hairColor: { type: 'string', pattern: /^#[0-9a-fA-F]{6}$/, default: '#442211' },
        hairStyle: { type: 'string', default: 'long' },
        height: { type: 'number', min: 100, max: 250, default: 165 },
        build: { type: 'string', enum: ['slim', 'athletic', 'curvy', 'muscular', 'voluptuous', 'petite', 'giant'], default: 'athletic' },
        chestSize: { type: 'string', enum: ['flat', 'small', 'medium', 'large', 'huge'], default: 'medium' },
        hipSize: { type: 'string', enum: ['narrow', 'average', 'wide', 'very-wide'], default: 'average' },
        genitalia: { type: 'string', default: 'typical' },
        tattoos: { type: 'array', items: { type: 'object' }, default: [] },
        scars: { type: 'array', items: { type: 'string' }, default: [] },
        piercings: { type: 'array', items: { type: 'string' }, default: [] },
      },
    },

    personality: {
      type: 'object',
      fields: {
        archetype: { type: 'string', default: 'custom' },
        traits: { type: 'array', items: { type: 'string' }, default: [] },
        dominance: { type: 'number', min: 0, max: 100, default: 50 },
        submission: { type: 'number', min: 0, max: 100, default: 50 },
        libido: { type: 'number', min: 0, max: 100, default: 60 },
        sadism: { type: 'number', min: 0, max: 100, default: 20 },
        masochism: { type: 'number', min: 0, max: 100, default: 20 },
        possessiveness: { type: 'number', min: 0, max: 100, default: 30 },
        jealousy: { type: 'number', min: 0, max: 100, default: 20 },
        experience: { type: 'string', enum: ['virgin', 'novice', 'experienced', 'expert', 'master'], default: 'experienced' },
        kinks: { type: 'array', items: { type: 'string' }, default: [] },
        limits: { type: 'array', items: { type: 'string' }, default: [] },
      },
    },

    relationship: {
      type: 'object',
      fields: {
        type: { type: 'string', enum: ['stranger', 'acquaintance', 'friend', 'lover', 'partner', 'owner', 'owned', 'master', 'pet', 'rival', 'enemy', 'family'], default: 'stranger' },
        intimacy: { type: 'number', min: 0, max: 100, default: 30 },
        trust: { type: 'number', min: 0, max: 100, default: 30 },
        submission: { type: 'number', min: 0, max: 100, default: 30 },
        obsession: { type: 'number', min: 0, max: 100, default: 10 },
        history: { type: 'array', items: { type: 'object' }, default: [] },
      },
    },

    state: {
      type: 'object',
      fields: {
        arousal: { type: 'number', min: 0, max: 100, default: 20 },
        stamina: { type: 'number', min: 0, max: 100, default: 80 },
        currentMood: { type: 'string', default: 'neutral' },
        isConsenting: { type: 'boolean', default: true },
        hasClimaxed: { type: 'boolean', default: false },
        climaxCount: { type: 'number', min: 0, default: 0 },
      },
    },

    media: {
      type: 'object',
      fields: {
        avatarUrl: { type: 'string', nullable: true },
        portraitUrl: { type: 'string', nullable: true },
        bodyUrl: { type: 'string', nullable: true },
        glbUrl: { type: 'string', nullable: true },
        referenceUrls: { type: 'array', items: { type: 'string' }, default: [] },
      },
    },

    metadata: {
      type: 'object',
      fields: {
        createdAt: { type: 'string', default: () => new Date().toISOString() },
        updatedAt: { type: 'string', default: () => new Date().toISOString() },
        source: { type: 'string', default: 'parent-app' },
        version: { type: 'number', default: 1 },
      },
    },
  };

  /**
   * Validate a single field against its schema
   */
  const validateField = (value, fieldSchema, path) => {
   
