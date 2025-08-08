/**
 * Rapier Physics Engine Initialization
 * 
 * This module handles the asynchronous initialization of the Rapier physics engine.
 * Rapier is a WebAssembly-based physics engine that provides high-performance
 * rigid body dynamics and collision detection.
 * 
 * The initialization process loads the WebAssembly module and returns the Rapier
 * API object that can be used to create physics worlds, bodies, and colliders.
 */

/**
 * Initialize and load the Rapier physics engine
 * 
 * Note: The dynamic import pattern used here is necessary because Rapier
 * is a WebAssembly module that needs to be loaded asynchronously.
 * The double await is required due to how the Rapier module is packaged.
 * 
 * @returns Promise<Rapier> - The initialized Rapier physics engine API
 */
const InitRapier = async () => {
  // Dynamic import of the Rapier WebAssembly module
  // This unusual double-await pattern is required by how Rapier is packaged
  const mod = await import('@dimforge/rapier3d')
  const RAPIER = await mod.default

  return RAPIER
}

export default InitRapier