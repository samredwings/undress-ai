/**
 * CARNAL ROULETTE VR — Story Asset Pipeline
 * 
 * Characters are designed by the narrative context first.
 * When a scene begins, character visuals are auto-generated
 * from their story description + relationship state.
 * User can manually refine after generation.
 */

const StoryAssetPipeline = (() => {
  const UNSUPPORTED_MSG = '3D generation requires GPU. Falling back to procedural.';

  /**
   * Generate character meshes from narrative context
   * Called automatically when the parent app transitions into a scene
   */
  const generateFromNarrativeContext = async (context) => {
    if (!context?.characters?.length) {
      console.warn('[StoryAssetPipeline] No characters in narrative context');
      return;
    }

    AssetPipeline.setGenerationStatus('Generating characters from story...', 5);

    for (let i = 0; i < context.characters.length; i++) {
      const charData = context.characters[i];
      const progress = 5 + ((i / context.characters.length) * 70);

      AssetPipeline.setGenerationStatus(
        `Building ${charData.name} from narrative profile...`,
        progress
      );

      // Step 1: Check if parent app has pre-generated 3D assets
      let glbData = null;
      try {
        const mediaResult = await PluginInterface.parent()?.getCharacterMedia(
          charData.id, 'fullbody-glb'
        );
        if (mediaResult?.data) {
          glbData = mediaResult.data;
        }
      } catch (e) {
        // No pre-generated asset — proceed with procedural generation
      }

      if (glbData) {
        // Use parent-provided 3D asset
        await CharacterSystem.importGLB(charData.id, glbData);
      } else {
        // Generate from appearance descriptor
        const descriptor = buildDescriptorFromProfile(charData);
        await CharacterSystem.generateFromDescriptor(descriptor, charData);
      }

      // Step 3: Apply relationship state to animations/poses
      const relationship = charData.relationship || {};
      CharacterSystem.applyRelationshipPose(charData.id, {
        intimacy: relationship.intimacy || 50,
        submission: relationship.submission || 30,
        trust: relationship.trust || 50,
      });
    }

    AssetPipeline.setGenerationStatus('Applying scene configuration...', 80);
    
    // Step 4: Configure scene based on narrative context
    const sceneConfig = deriveSceneConfig(context);
    await VRScene.configureScene(sceneConfig);

    AssetPipeline.setGenerationStatus('Scene ready!', 100);
  };

  /**
   * Build a visual descriptor from narrative character profile
   * This drives procedural 3D generation
   */
  const buildDescriptorFromProfile = (profile) => {
    const app = profile.appearance || {};
    const pers = profile.personality || {};

    // Map narrative description to generation parameters
    return {
      name: profile.name,
      id: profile.id,
      species: profile.species || 'human',
      sex: profile.gender === 'male' ? 'male' : 'female',
      
      // Body parameters (mapped from narrative description)
      body: {
        height: app.height || 165,
        build: mapBuild(app.build, pers.archetype),
        proportions: calculateProportions(app),
        skinTone: app.skinTone || '#e8c4a0',
        skinDetail: calculateSkinDetail(app),
      },

      // Face parameters (auto-generated from narrative)
      face: {
        shape: 'average',
        eyeColor: app.eyeColor || '#336699',
        eyeShape: mapEyeShape(pers.archetype),
        hairColor: app.hairColor || '#442211',
        hairStyle: app.hairStyle || 'long',
        expression: mapBaseExpression(pers),
      },

      // Sexual characteristics
      sexualCharacteristics: {
        chestSize: app.chestSize || 'medium',
        genitalia: app.genitalia || 'default',
        pubicHair: 'trimmed',
      },

      // Derived from personality
      aura: mapAuraFromPersonality(pers),
    };
  };

  const mapBuild = (build, archetype) => {
    const builds = {
      'slim': { muscle: 0.2, fat: 0.3, curves: 0.3 },
      'athletic': { muscle: 0.6, fat: 0.2, curves: 0.5 },
      'curvy': { muscle: 0.3, fat: 0.5, curves: 0.8 },
      'muscular': { muscle: 0.9, fat: 0.1, curves: 0.3 },
      'voluptuous': { muscle: 0.3, fat: 0.4, curves: 0.9 },
      'petite': { muscle: 0.2, fat: 0.2, curves: 0.2 },
    };
    return builds[build] || builds.athletic;
  };

  const calculateProportions = (appearance) => {
    // Convert qualitative sizes to numeric parameters
    const chestMap = { 'flat': 0.1, 'small': 0.3, 'medium': 0.5, 'large': 0.7, 'huge': 0.9 };
    const hipMap = { 'narrow': 0.2, 'average': 0.5, 'wide': 0.7, 'very-wide': 0.9 };
    
    return {
      chest: chestMap[appearance.chestSize] || 0.5,
      hips: hipMap[appearance.hipSize] || 0.5,
      waistRatio: 0.7,
    };
  };

  const calculateSkinDetail = (appearance) => {
    // Based on skin tone and narrative cues
    return {
      roughness: 0.4,
      blemishes: 0.1,
      tattoos: 0,
      scars: 0,
    };
  };

  const mapEyeShape = (archetype) => {
    const map = {
      'seductress': 'almond',
      'dominant': 'sharp',
      'submissive': 'round',
      'innocent': 'large-round',
      'mysterious': 'hooded',
      'playful': 'upturned',
    };
    return map[archetype] || 'average';
  };

  const mapBaseExpression = (personality) => {
    return {
      eyebrow: personality.dominance > 60 ? 'confident' : 'neutral',
      mouth: personality.submission > 60 ? 'parted' : 'neutral-smile',
      eyes: personality.libido > 70 ? 'heavy-lidded' : 'open',
    };
  };

  const mapAuraFromPersonality = (personality) => {
    if (personality.dominance > 70) return 'dominant';
    if (personality.submission > 70) return 'submissive';
    if (personality.libido > 80) return 'lustful';
    return 'neutral';
  };

  /**
   * Derive 3D scene configuration from narrative context
   */
  const deriveSceneConfig = (context) => {
    const defaultConfig = {
      environment: 'bedroom',
      lighting: 'warm-intimate',
      cameraAngle: 'first-person',
      mood: 'sensual',
    };

    const narrativeMood = context.mood || context.sceneMood || 'sensual';
    const location = context.location || context.environment || 'bedroom';

    const moodMap = {
      'romantic': { environment: 'bedroom', lighting: 'candlelight', mood: 'tender' },
      'rough': { environment: 'dungeon', lighting: 'harsh', mood: 'aggressive' },
      'public': { environment: 'outdoor', lighting: 'natural', mood: 'exhibitionist' },
      'sensual': { environment: 'bedroom', lighting: 'warm-intimate', mood: 'sensual' },
      'painful': { environment: 'dungeon', lighting: 'dim-red', mood: 'intense' },
      'playful': { environment: 'bedroom', lighting: 'bright', mood: 'playful' },
    };

    return {
      ...defaultConfig,
      ...(moodMap[narrativeMood] || {}),
      environment: location,
      partnerCount: context.characters?.length || 1,
    };
  };

  /**
   * Allow user to manually refine a generated character
   */
  const openManualEditor = (characterId) => {
    // Opens the body part editing UI
    UIController.openCharacterEditor(characterId);
  };

  return {
    generateFromNarrativeContext,
    buildDescriptorFromProfile,
    deriveSceneConfig,
    openManualEditor,
  };
})();
