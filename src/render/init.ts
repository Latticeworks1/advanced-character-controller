/**
 * Core Engine Initialization
 * 
 * This file is the heart of the engine, responsible for:
 * - Initializing Three.js renderer, scene, camera, and post-processing pipeline
 * - Setting up Rapier physics world with gravity
 * - Creating the character controller with capsule avatar
 * - Providing hooks system for accessing engine components throughout the app
 * - Managing the main render loop via TickManager
 * 
 * All components are initialized once and accessed via useX() hooks elsewhere.
 */

import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import TickManager from './controllers/tick-manager'

// WebAssembly physics engine
import Rapier from '@dimforge/rapier3d'
import AvatarController from './controllers/character-controller'
import { _addCapsule } from './controllers/utils/meshes'
import GeneralLoader from './loaders/general-loader'
import InitRapier from './physics/RAPIER'
import { PhysicsObject } from './physics/physics'
import { GRAVITY } from './physics/utils/constants'

// Debug GUI
const GUI = require('three/examples/jsm/libs/lil-gui.module.min.js').GUI

// Global engine state - initialized once and accessed via hooks
let scene: THREE.Scene,               // Three.js scene graph
  camera: THREE.PerspectiveCamera,     // Main camera (controlled by character controller)
  renderer: THREE.WebGLRenderer,       // WebGL renderer with shadows enabled
  renderTarget: THREE.WebGLRenderTarget, // High-quality render target for post-processing
  composer: EffectComposer,            // Post-processing pipeline
  controls: AvatarController,          // Character controller with physics integration
  stats: Stats,                        // Performance monitor
  gui: typeof GUI,                     // Debug controls
  renderWidth: number,                 // Current viewport width
  renderHeight: number,                // Current viewport height
  renderAspectRatio: number,           // Aspect ratio for camera
  gltfLoader: GLTFLoader,              // GLTF model loader
  textureLoader: THREE.TextureLoader,  // Texture loader
  generalLoader: GeneralLoader,        // Custom asset loader
  RAPIER: typeof Rapier,               // Rapier physics engine reference
  physicsWorld: Rapier.World,          // Physics simulation world
  physicsObjects: Array<PhysicsObject> // All objects with physics simulation

// Main render loop manager - handles animation frame callbacks
const renderTickManager = new TickManager()

/**
 * Initialize the entire engine system
 * Must be called before any other engine functions
 */
export const initEngine = async () => {
  // Initialize physics engine first (WebAssembly module)
  RAPIER = await InitRapier()
  physicsWorld = new RAPIER.World(GRAVITY)  // Create physics world with gravity
  physicsObjects = [] // Track all physics-enabled objects

  // Initialize Three.js rendering system
  scene = new THREE.Scene()

  // Setup viewport dimensions
  renderWidth = window.innerWidth
  renderHeight = window.innerHeight
  renderAspectRatio = renderWidth / renderHeight

  // Create perspective camera (75° FOV, near=0.01, far=1000)
  camera = new THREE.PerspectiveCamera(75, renderAspectRatio, 0.01, 1000)
  camera.position.z = 5  // Initial position (character controller takes over)

  // Setup WebGL renderer with high pixel ratio for sharp visuals
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(renderWidth, renderHeight)
  renderer.setPixelRatio(window.devicePixelRatio * 1.5)

  // Enable shadow mapping with soft shadows
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Add renderer canvas to DOM
  document.body.appendChild(renderer.domElement)

  // Setup high-quality render target with MSAA
  renderTarget = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
    samples: 8,  // 8x multisampling for smooth edges
  })
  
  // Initialize post-processing pipeline
  composer = new EffectComposer(renderer, renderTarget)
  composer.setSize(renderWidth, renderHeight)
  composer.setPixelRatio(renderer.getPixelRatio())

  // Add basic render pass (more effects can be added via addPass())
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  // Setup performance monitoring
  stats = Stats()
  document.body.appendChild(stats.dom)

  // Initialize debug GUI
  gui = new GUI()

  // Handle window resize events
  window.addEventListener(
    'resize',
    () => {
      // Update viewport dimensions
      renderWidth = window.innerWidth
      renderHeight = window.innerHeight
      renderAspectRatio = renderWidth / renderHeight

      // Reset pixel ratio (may change on monitor switch)
      renderer.setPixelRatio(window.devicePixelRatio)

      // Update camera projection
      camera.aspect = renderAspectRatio
      camera.updateProjectionMatrix()

      // Resize renderer and post-processing chain
      renderer.setSize(renderWidth, renderHeight)
      composer.setSize(renderWidth, renderHeight)
    },
    false
  )

  // Create character avatar (capsule mesh) and initialize controller
  const capsule = _addCapsule(1.5, 0.5, 10, 10)  // height=1.5, radius=0.5, segments
  controls = new AvatarController(capsule, camera) // Handles input, movement, physics

  // Initialize asset loaders
  generalLoader = new GeneralLoader()  // Custom loading utilities
  gltfLoader = new GLTFLoader()        // For 3D models
  textureLoader = new THREE.TextureLoader()  // For textures

  // Start the main render loop
  renderTickManager.startLoop()
}

// ============================================================================
// HOOKS SYSTEM
// These functions provide access to engine components from anywhere in the app
// All components must be initialized via initEngine() before using these hooks
// ============================================================================

// Rendering hooks
export const useRenderer = () => renderer
export const useRenderSize = () => ({ width: renderWidth, height: renderHeight })
export const useScene = () => scene
export const useCamera = () => camera
export const useRenderTarget = () => renderTarget
export const useComposer = () => composer

// Character controller hook
export const useControls = () => controls

// Debug and utility hooks
export const useStats = () => stats
export const useGui = () => gui

/**
 * Add a post-processing pass to the render pipeline
 * Passes are executed in the order they're added
 */
export const addPass = (pass: Pass) => {
  composer.addPass(pass)
}

/**
 * Register a function to be called every animation frame
 * @param fn - Function to call with tick data (timestamp, deltaTime)
 */
export const useTick = (fn: Function) => {
  if (renderTickManager) {
    const _tick = (e: any) => {
      fn(e.data)
    }
    renderTickManager.addEventListener('tick', _tick)
  }
}

// Asset loading hooks
export const useGltfLoader = () => gltfLoader
export const useTextureLoader = () => textureLoader
export const useLoader = () => generalLoader

// Physics hooks
export const usePhysics = () => physicsWorld
export const usePhysicsObjects = () => physicsObjects

// Export Rapier reference for direct access to physics types
export { RAPIER }
