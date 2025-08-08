/**
 * Mesh Creation Utilities
 * 
 * This module provides utility functions for creating commonly used 3D meshes
 * with proper positioning and materials. These are primarily used for creating
 * character avatars and other geometric primitives.
 */

import * as THREE from 'three'
import { RAPIER, usePhysics, usePhysicsObjects, useScene, useTick } from '../../init'
import { addPhysics } from '../../physics/physics'

/**
 * Create a capsule mesh for use as a character avatar
 * The capsule is positioned so its bottom sits at ground level (y=0)
 * 
 * @param height - Height of the cylindrical portion (excluding rounded caps)
 * @param radius - Radius of the capsule
 * @param capSegments - Number of segments in the rounded caps (detail level)
 * @param radialSegments - Number of radial segments around the cylinder
 * @returns THREE.Mesh configured as a character capsule
 */
const _addCapsule = (
  height: number,
  radius: number,
  capSegments: number,
  radialSegments: number
) => {
  const scene = useScene()
  
  // Create capsule geometry (cylinder with rounded ends)
  const geometry = new THREE.CapsuleGeometry(radius, height, capSegments, radialSegments)
  
  // Red semi-transparent material for visibility
  const material = new THREE.MeshStandardMaterial({ color: 0xd60019, transparent: true })
  
  const capsule = new THREE.Mesh(geometry, material)
  
  // Position capsule so bottom sits at ground level
  capsule.position.y += height / 2 + radius
  
  // Additional height offset for initial spawn position
  capsule.position.y += 10

  scene.add(capsule)

  return capsule
}

export { _addCapsule }
