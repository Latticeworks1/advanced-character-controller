/**
 * Demo Application Setup
 * 
 * This file creates the demo scene for the character controller, including:
 * - Ground plane with physics collision
 * - Random colored cubes that fall and can be interacted with
 * - Basic lighting setup (directional + ambient)
 * 
 * The character controller is automatically initialized in init.ts and can
 * move around this scene using WASD keys, mouse look, and space to jump.
 */

import * as THREE from 'three'
import {
  addPass,
  useCamera,
  useControls,
  useGui,
  useLoader,
  useRenderSize,
  useScene,
  useTick,
} from './render/init'

// Post-processing effects (currently unused but available)
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// Physics integration utilities
import { addPhysics } from './render/physics/physics'

// Type definitions for animation loop
import { TickData } from './render/controllers/tick-manager'

// Motion blur configuration (currently unused)
const MOTION_BLUR_AMOUNT = 0.5

const startApp = async () => {
  // Get engine components initialized in init.ts
  const scene = useScene()
  const camera = useCamera()
  
  // Position camera for initial overview (character controller takes over after first click)
  camera.position.x += 10
  camera.position.y += 10
  camera.lookAt(new THREE.Vector3(0))
  
  const gui = useGui()
  const { width, height } = useRenderSize()

  // Setup basic lighting for the scene
  const dirLight = new THREE.DirectionalLight('#ffffff', 1)
  dirLight.position.y += 1
  dirLight.position.x += 0.5

  const dirLightHelper = new THREE.DirectionalLightHelper(dirLight)
  // dirLight.add(dirLightHelper) // Uncomment to visualize light direction

  const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)

  /**
   * Creates the ground plane that the character can walk on
   * Uses a thin cuboid collider for physics simulation
   */
  const _addGroundMesh = () => {
    // Ground dimensions
    const planeWidth = 100
    const planeHeight = 100

    // Create visual mesh
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    const material = new THREE.MeshPhysicalMaterial({
      color: '#333',
      side: THREE.DoubleSide
    })
    const plane = new THREE.Mesh(geometry, material)

    // Add physics collision with a thin cuboid
    const collider = addPhysics(
      plane,
      'fixed',         // Static rigid body (won't move)
      true,            // Auto-animate (sync mesh with physics)
      () => {
        // Post-physics callback: rotate plane to be horizontal
        plane.rotation.x -= Math.PI / 2
      },
      'cuboid',        // Use box collider instead of mesh for performance
      {
        width: planeWidth / 2,    // Rapier uses half-extents
        height: 0.001,            // Very thin to act as ground
        depth: planeHeight / 2,
      }
    ).collider

    scene.add(plane)
  }

  _addGroundMesh()

  /**
   * Creates a dynamic cube that falls due to gravity and can be pushed around
   * Each cube gets a random color and is positioned randomly in 3D space
   */
  const _addCubeMesh = (pos: THREE.Vector3) => {
    const size = 6

    // Create cube mesh with random color
    const geometry = new THREE.BoxGeometry(size, size, size)
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(Math.min(Math.random() + 0.15, 1) * 0xffffff),
      side: THREE.DoubleSide,
    })
    const cube = new THREE.Mesh(geometry, material)

    cube.position.copy(pos)
    cube.position.y += 2  // Offset slightly above ground

    // Add dynamic physics (affected by gravity, can be pushed)
    const collider = addPhysics(cube, 'dynamic', true, undefined, 'cuboid', {
      width: size / 2,     // Half-extents for Rapier
      height: size / 2,
      depth: size / 2,
    }).collider

    scene.add(cube)
  }

  // Create a stack of cubes at random positions
  const NUM_CUBES = 10
  for (let i = 0; i < NUM_CUBES; i++) {
    _addCubeMesh(
      new THREE.Vector3(
        (Math.random() - 0.5) * 20,  // Random X position
        10 + i * 5,                  // Stacked vertically
        (Math.random() - 0.5) * 20   // Random Z position
      )
    )
  }
}

export default startApp
