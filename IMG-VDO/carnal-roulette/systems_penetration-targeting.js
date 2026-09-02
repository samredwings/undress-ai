/**
 * CARNAL ROULETTE VR — Penetration Targeting
 * 
 * Uses raycasting to detect which hole the player's controller/camera
 * is aimed at. Auto-selects the nearest valid hole entry point.
 */

class PenetrationTargeting {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.debugMode = false;
    
    // Hole detection zones (bounding spheres around each entry point)
    this.detectionRadius = 0.08; // 8cm detection radius
  }

  /**
   * Cast a ray from the player's controller/camera and detect
   * which hole on which partner is being targeted
   * 
   * @param {THREE.Vector3} origin - Ray origin (controller tip or camera)
   * @param {THREE.Vector3} direction - Ray direction
   * @param {number[]} partnerEntityIds - Array of potential partner entity IDs
   * @returns {Object|null} { partnerEntityId, holeType, distance, point }
   */
  detectTarget(origin, direction, partnerEntityIds) {
    this.raycaster.set(origin, direction);

    let closest = null;
    let closestDistance = Infinity;

    for (const entityId of partnerEntityIds) {
      const ikData = IKPenetration.solvers.get(entityId);
      if (!ikData) continue;

      const hipBone = ikData.skeleton.bones[ikData.boneMap.hip];
      if (!hipBone) continue;

      // Check each hole type
      for (const [holeType, holeDef] of Object.entries(IKPenetration.HOLE_DEFINITIONS)) {
        // Calculate world-space entry point
        const entryPoint = new THREE.Vector3();
        entryPoint.copy(holeDef.localOffset);
        entryPoint.applyQuaternion(hipBone.quaternion);
        entryPoint.add(hipBone.getWorldPosition(new THREE.Vector3()));

        // Sphere intersection test
        const sphere = new THREE.Sphere(entryPoint, this.detectionRadius);
        const intersectPoint = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectSphere(sphere, intersectPoint)) {
          const distance = origin.distanceTo(intersectPoint);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = {
              partnerEntityId: entityId,
              holeType,
              distance,
              point: intersectPoint.clone(),
              entryPoint: entryPoint.clone(),
              holeDef,
            };
          }
        }

        // Debug visualization
        if (this.debugMode) {
          this.drawDebugSphere(entryPoint, holeType);
        }
      }
    }

    return closest;
  }

  /**
   * Get all hole entry points for a partner (for HUD display)
   */
  getHolePoints(entityId) {
    const ikData = IKPenetration.solvers.get(entityId);
    if (!ikData) return [];

    const hipBone = ikData.skeleton.bones[ikData.boneMap.hip];
    if (!hipBone) return [];

    const results = [];
    for (const [holeType, holeDef] of Object.entries(IKPenetration.HOLE_DEFINITIONS)) {
      const worldPos = new THREE.Vector3();
      worldPos.copy(holeDef.localOffset);
      worldPos.applyQuaternion(hipBone.quaternion);
      worldPos.add(hipBone.getWorldPosition(new THREE.Vector3()));

      results.push({
        holeType,
        label: holeDef.label,
        worldPosition: worldPos,
        isAvailable: true,
      });
    }
    return results;
  }

  drawDebugSphere(position, label) {
    if (typeof THREE === 'undefined') return;
    
    // Only draw if we have a scene reference
    const scene = window.VRScene?.scene;
    if (!scene) return;
    
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(this.detectionRadius, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
    );
    sphere.position.copy(position);
    sphere.userData.isDebug = true;
    scene.add(sphere);

    // Remove after 1 frame (re-drawn each frame)
    setTimeout(() => {
      if (sphere.parent) sphere.parent.remove(sphere);
    }, 16);
  }
}

window.PenetrationTargeting = new PenetrationTargeting();
