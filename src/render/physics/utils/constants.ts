/**
 * Physics Constants
 * 
 * This module defines physical constants used throughout the physics simulation.
 * These values control the behavior of gravity, forces, and other physical properties.
 */

import * as THREE from 'three'

/**
 * Gravity vector applied to all physics objects in the world
 * Standard Earth gravity: 9.81 m/s² downward (negative Y)
 * 
 * This affects all dynamic rigid bodies in the physics simulation,
 * causing them to fall naturally when not supported.
 */
export const GRAVITY = new THREE.Vector3(0.0, -9.81, 0.0)
