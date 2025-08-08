/**
 * 3D Object Utility Functions
 * 
 * This module provides utility functions for working with Three.js 3D objects,
 * including size calculations and geometric operations.
 */

import * as THREE from 'three'

// Reusable vector to avoid garbage collection
const vec3_4 = new THREE.Vector3()

/**
 * Calculate the size (dimensions) of a 3D object
 * Uses bounding box calculation to determine width, height, and depth
 * 
 * This is useful for physics setup, positioning, and collision detection
 * where you need to know the actual dimensions of a loaded mesh.
 * 
 * @param object - The 3D object to measure
 * @returns Vector3 containing width (x), height (y), and depth (z) dimensions
 */
const _calculateObjectSize = (object: THREE.Object3D) => {
  // Create bounding box and expand to contain the entire object
  const bbox = new THREE.Box3()
  bbox.expandByObject(object)
  
  // Get size vector (reusing vec3_4 to avoid allocation)
  const size = bbox.getSize(vec3_4)

  return size
}

export { _calculateObjectSize }
