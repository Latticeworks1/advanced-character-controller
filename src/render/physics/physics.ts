/**
 * Physics Integration System
 * 
 * This module provides utilities for integrating Three.js meshes with Rapier physics.
 * It handles the creation of physics bodies and colliders, and manages the connection
 * between visual meshes and their physics representations.
 * 
 * Key features:
 * - Automatic physics body creation for meshes
 * - Support for multiple collider types (cuboid, ball, capsule, trimesh)
 * - Flexible rigid body types (static, dynamic, kinematic)
 * - Optional post-physics callbacks for custom behavior
 * - Centralized physics object management
 */

import Rapier from '@dimforge/rapier3d'
import { RAPIER, usePhysics, usePhysicsObjects } from '../init'

/**
 * Represents a mesh with attached physics simulation
 * Contains both the visual representation and physics bodies
 */
export type PhysicsObject = {
  mesh: THREE.Mesh          // Visual Three.js mesh
  collider: Rapier.Collider // Physics collision shape
  rigidBody: Rapier.RigidBody // Physics rigid body for simulation
  fn?: Function             // Optional post-physics callback function
  autoAnimate: boolean      // Whether to automatically sync mesh with physics
}

/**
 * Add physics simulation to a Three.js mesh
 * Creates rigid body and collider, then registers the physics object for simulation
 * 
 * @param mesh - Three.js mesh to add physics to
 * @param rigidBodyType - Type of rigid body ('fixed', 'dynamic', 'kinematicPositionBased', etc.)
 * @param autoAnimate - Whether to automatically sync mesh transform with physics body
 * @param postPhysicsFn - Optional callback function called after physics update
 * @param colliderType - Type of collision shape ('cuboid', 'ball', 'capsule', or 'trimesh' for default)
 * @param colliderSettings - Shape-specific parameters (dimensions, etc.)
 * @returns PhysicsObject containing mesh and physics components
 */
export const addPhysics = (
  mesh: THREE.Mesh,
  rigidBodyType: string,
  autoAnimate: boolean = true, // Update mesh position/rotation from physics each frame
  postPhysicsFn?: Function,    // Custom callback after physics update
  colliderType?: string,       // Collision shape type
  colliderSettings?: any       // Shape parameters
) => {
  const physics = usePhysics()
  const physicsObjects = usePhysicsObjects()

  // Create rigid body descriptor using dynamic property access
  const rigidBodyDesc = (RAPIER.RigidBodyDesc as any)[rigidBodyType]()
  rigidBodyDesc.setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)

  // Create the rigid body (handles physics simulation and collision response)
  const rigidBody = physics.createRigidBody(rigidBodyDesc)

  // Create collision shape based on type
  let colliderDesc

  switch (colliderType) {
    case 'cuboid':
      // Box collision shape - good for most rectangular objects
      {
        const { width, height, depth } = colliderSettings
        colliderDesc = RAPIER.ColliderDesc.cuboid(width, height, depth)
      }
      break

    case 'ball':
      // Sphere collision shape - good for round objects
      {
        const { radius } = colliderSettings
        colliderDesc = RAPIER.ColliderDesc.ball(radius)
      }
      break

    case 'capsule':
      // Capsule collision shape - ideal for characters (cylinder with rounded ends)
      {
        const { halfHeight, radius } = colliderSettings
        colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
      }
      break

    default:
      // Trimesh collision - uses exact mesh geometry (expensive but accurate)
      {
        colliderDesc = RAPIER.ColliderDesc.trimesh(
          mesh.geometry.attributes.position.array as Float32Array,
          mesh.geometry.index?.array as Uint32Array
        )
      }
      break
  }

  if (!colliderDesc) {
    console.error('Collider Mesh Error: collision shape creation failed.')
  }

  // Create the collider (handles collision detection)
  const collider = physics.createCollider(colliderDesc, rigidBody)

  // Create physics object that links visual mesh with physics simulation
  const physicsObject: PhysicsObject = { 
    mesh, 
    collider, 
    rigidBody, 
    fn: postPhysicsFn, 
    autoAnimate 
  }

  // Register with physics system for automatic updates
  physicsObjects.push(physicsObject)

  return physicsObject
}
