/**
 * Character Controller System
 * 
 * This file implements a sophisticated first/third-person character controller with:
 * - Mouse look with pointer lock for camera control
 * - WASD movement with physics integration
 * - Smooth camera zoom transitions between first/third person modes
 * - Head bobbing in first-person mode
 * - Gravity, jumping, and ground detection via raycasting
 * - Kinematic character physics with capsule collision
 * 
 * Architecture:
 * - InputManager: Handles all keyboard/mouse input with pointer lock
 * - HeadBobController: Manages first-person head bobbing animation
 * - ZoomController: Smooth camera distance transitions
 * - HeightController: Gravity, jumping, and vertical movement
 * - CharacterController: Main controller integrating all systems
 * - AvatarController: High-level wrapper managing mesh and character
 */

import * as THREE from 'three'
import { Object3D } from 'three'
import { RAPIER, usePhysics, useRenderSize, useScene } from '../init'
import { useRenderer } from './../init'
import { PhysicsObject, addPhysics } from '../physics/physics'
import Rapier from '@dimforge/rapier3d'
import { GRAVITY } from '../physics/utils/constants'
import { _calculateObjectSize } from './utils/objects'
import { clamp, lerp, easeOutExpo, EaseOutCirc, UpDownCirc } from './utils/math'

// ============================================================================
// CONSTANTS AND HELPERS
// ============================================================================

// Mathematical constants
const HALF_PI = Math.PI / 2

// Directional vectors for movement calculations
const FORWARD = new THREE.Vector3(0, 0, -1)  // Forward in world space
const LEFT = new THREE.Vector3(-1, 0, 0)     // Left in world space  
const UP = new THREE.Vector3(0, 1, 0)        // Up in world space
const RIGHT = new THREE.Vector3(1, 0, 0)     // Right in world space
const DOWN = new THREE.Vector3(0, -1, 0)     // Down in world space

// Camera zoom configuration
const MIN_ZOOM_LEVEL = 0.001        // Minimum zoom (first-person, needs to be > 0)
const MAX_ZOOM_LEVEL = 20           // Maximum zoom distance (far third-person)
const SCROLL_LEVEL_STEP = 1.5       // How much each scroll wheel step changes zoom
const SCROLL_ANIMATION_SPEED = 2    // Speed of zoom animation transitions

// Jump mechanics configuration
const JUMP_DURATION = 0.5           // How long jump animation lasts (seconds)
const JUMP_AMPLITUDE = 0.5          // Maximum height boost from jumping

// Reusable objects to avoid garbage collection during animation loop
const quaternion_0 = new THREE.Quaternion()  // For rotation calculations
const quaternion_1 = new THREE.Quaternion()  // For rotation calculations
const vec3_0 = new THREE.Vector3()           // For vector calculations
const vec3_1 = new THREE.Vector3()           // For vector calculations
let ray_0: Rapier.Ray                        // Reusable ray for physics queries

// Helper functions for input system (used with runActionByKey)
const ONE = () => 1    // Normal movement speed multiplier
const FIVE = () => 5   // Sprint speed multiplier (when Shift held)
const ZERO = () => 0   // No movement

// Keyboard key codes for movement controls
enum KEYS {
  a = 'KeyA',        // Move left
  s = 'KeyS',        // Move backward
  w = 'KeyW',        // Move forward
  d = 'KeyD',        // Move right
  space = 'Space',   // Jump
  shiftL = 'ShiftLeft',  // Sprint modifier
  shiftR = 'ShiftRight', // Sprint modifier
}

// Mouse input state tracking
type MouseState = {
  leftButton: boolean      // Left mouse button pressed
  rightButton: boolean     // Right mouse button pressed
  mouseXDelta: number      // Horizontal mouse movement (for look)
  mouseYDelta: number      // Vertical mouse movement (for look)  
  mouseWheelDelta: number  // Accumulated scroll wheel input (for zoom)
}

// ============================================================================
// INPUT MANAGER
// Handles all user input including keyboard, mouse, and pointer lock
// ============================================================================

/**
 * Manages all user input for the character controller
 * Features:
 * - Pointer lock for FPS-style mouse look
 * - Keyboard state tracking with key combinations
 * - Mouse button and wheel input
 * - Helper methods for conditional actions based on input
 */
class InputManager {
  target: Document                        // Event target (usually document)
  currentMouse: MouseState               // Current mouse input state
  currentKeys: Map<string, boolean>      // Currently pressed keys
  pointerLocked: boolean                 // Whether mouse is locked to canvas

  constructor(target?: Document) {
    this.target = target || document
    
    // Initialize mouse state
    this.currentMouse = {
      leftButton: false,
      rightButton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseWheelDelta: 0,
    }
    
    this.currentKeys = new Map<string, boolean>()
    this.pointerLocked = false

    this.init()
  }

  /**
   * Initialize all input event listeners and pointer lock functionality
   */
  init() {
    // Mouse input event handlers
    this.target.addEventListener('mousedown', (e) => this.onMouseDown(e), false)
    this.target.addEventListener('mousemove', (e) => this.onMouseMove(e), false)
    this.target.addEventListener('mouseup', (e) => this.onMouseUp(e), false)
    
    // Mouse wheel for camera zoom (global listener)
    addEventListener('wheel', (e) => this.onMouseWheel(e), false)

    // Keyboard input event handlers
    this.target.addEventListener('keydown', (e) => this.onKeyDown(e), false)
    this.target.addEventListener('keyup', (e) => this.onKeyUp(e), false)

    const renderer = useRenderer()

    // Setup pointer lock for FPS-style mouse look
    const addPointerLockEvent = async () => {
      await renderer.domElement.requestPointerLock()
    }
    
    // Request pointer lock on any interaction with canvas
    renderer.domElement.addEventListener('click', addPointerLockEvent)
    renderer.domElement.addEventListener('dblclick', addPointerLockEvent)
    renderer.domElement.addEventListener('mousedown', addPointerLockEvent)

    // Track pointer lock state changes
    const setPointerLocked = () => {
      this.pointerLocked = document.pointerLockElement === renderer.domElement
    }
    document.addEventListener('pointerlockchange', setPointerLocked, false)
  }

  /**
   * Handle mouse wheel input for camera zoom
   * Only responds when pointer is locked to prevent accidental zoom
   */
  onMouseWheel(e: WheelEvent) {
    if (this.pointerLocked) {
      if (e.deltaY < 0) {
        // Scrolling up: zoom in (decrease distance)
        this.currentMouse.mouseWheelDelta = Math.max(
          this.currentMouse.mouseWheelDelta - SCROLL_LEVEL_STEP,
          MIN_ZOOM_LEVEL
        )
      } else if (e.deltaY > 0) {
        // Scrolling down: zoom out (increase distance)
        this.currentMouse.mouseWheelDelta = Math.min(
          this.currentMouse.mouseWheelDelta + SCROLL_LEVEL_STEP,
          MAX_ZOOM_LEVEL
        )
      }
    }
  }

  /**
   * Track mouse movement for look controls
   * Uses movement delta (raw mouse movement) for smooth camera control
   */
  onMouseMove(e: MouseEvent) {
    if (this.pointerLocked) {
      this.currentMouse.mouseXDelta = e.movementX  // Horizontal look
      this.currentMouse.mouseYDelta = e.movementY  // Vertical look
    }
  }

  /**
   * Handle mouse button press events
   */
  onMouseDown(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)  // Update mouse position

      // Track which mouse buttons are pressed
      switch (e.button) {
        case 0:  // Left mouse button
          this.currentMouse.leftButton = true
          break
        case 2:  // Right mouse button
          this.currentMouse.rightButton = true
          break
      }
    }
  }

  /**
   * Handle mouse button release events
   */
  onMouseUp(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)  // Update mouse position

      // Track which mouse buttons are released
      switch (e.button) {
        case 0:  // Left mouse button
          this.currentMouse.leftButton = false
          break
        case 2:  // Right mouse button
          this.currentMouse.rightButton = false
          break
      }
    }
  }

  /**
   * Handle key press events - only when pointer is locked for game-like behavior
   */
  onKeyDown(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, true)
    }
  }

  /**
   * Handle key release events
   */
  onKeyUp(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, false)
    }
  }

  /**
   * Check if a specific key is currently pressed
   * @param keyCode - The key code to check (e.g., 'KeyW', 'Space')
   * @returns true if key is pressed and pointer is locked
   */
  isKeyDown(keyCode: string | number) {
    if (this.pointerLocked) {
      const hasKeyCode = this.currentKeys.get(keyCode as string)
      if (hasKeyCode) {
        return hasKeyCode
      }
    }
    return false
  }

  /**
   * Reset per-frame mouse deltas - call at end of each frame
   * This prevents mouse movement from accumulating between frames
   */
  update() {
    this.currentMouse.mouseXDelta = 0
    this.currentMouse.mouseYDelta = 0
  }

  /**
   * Run an action conditionally based on key state
   * @param key - Key code to check
   * @param action - Function to run if key is pressed
   * @param inAction - Optional function to run if key is not pressed
   * @returns The result of the executed function
   */
  runActionByKey(key: string, action: Function, inAction?: Function) {
    if (this.isKeyDown(key)) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  /**
   * Run an action if ANY of the specified keys is pressed
   * Useful for checking multiple keys that do the same thing (e.g., left/right Shift)
   * @param keys - Array of key codes to check
   * @param action - Function to run if any key is pressed
   * @param inAction - Optional function to run if no keys are pressed
   * @returns The result of the executed function
   */
  runActionByOneKey(keys: Array<string>, action: Function, inAction?: Function) {
    let check = false
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (check) {
        break  // Found at least one pressed key
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  /**
   * Run an action if ALL specified keys are pressed simultaneously
   * Useful for complex key combinations
   * @param keys - Array of key codes that must all be pressed
   * @param action - Function to run if all keys are pressed
   * @param inAction - Optional function to run if not all keys are pressed
   * @returns The result of the executed function
   */
  runActionByAllKeys(keys: Array<string>, action: Function, inAction?: Function) {
    let check = true
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (!check) {
        break  // At least one key is not pressed
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }
}

// ============================================================================
// HEAD BOB CONTROLLER
// Manages first-person head bobbing animation during movement
// ============================================================================

/**
 * Controls head bobbing animation in first-person mode
 * Creates a natural walking motion by oscillating the camera vertically
 * Only active when the character is moving and in first-person view
 */
class HeadBobController {
  headBobTimer: number        // Tracks time for sine wave calculation
  headBobAmount: number       // Current head bob offset
  lastHeadBobDiff: number     // Previous sine wave phase (for cycle detection)
  headBobActive: boolean      // Whether head bob is currently active

  constructor() {
    this.headBobTimer = 0
    this.lastHeadBobDiff = 0
    this.headBobAmount = 0
    this.headBobActive = false
  }

  /**
   * Calculate head bob offset for current frame
   * @param timeDiff - Time elapsed since last frame
   * @param isMoving - Whether character is currently moving
   * @returns Vertical offset to apply to camera
   */
  getHeadBob(timeDiff: number, isMoving: boolean) {
    // Head bob animation parameters
    const HEAD_BOB_DURATION = 0.1    // Base duration for timing
    const HEAD_BOB_FREQUENCY = 0.8   // How fast the bobbing occurs
    const HEAD_BOB_AMPLITUDE = 0.3   // How much vertical movement

    // Start head bob when movement begins
    if (!this.headBobActive) {
      this.headBobActive = isMoving
    }

    if (this.headBobActive) {
      const STEP = Math.PI  // One half cycle of sine wave

      // Calculate current position in sine wave
      const currentAmount = this.headBobTimer * HEAD_BOB_FREQUENCY * (1 / HEAD_BOB_DURATION)
      const headBobDiff = currentAmount % STEP

      // Update timer and calculate sine wave offset
      this.headBobTimer += timeDiff
      this.headBobAmount = Math.sin(currentAmount) * HEAD_BOB_AMPLITUDE

      // Stop head bob when sine wave completes a half cycle
      if (headBobDiff < this.lastHeadBobDiff) {
        this.headBobActive = false
      }

      this.lastHeadBobDiff = headBobDiff
    }

    return this.headBobAmount
  }
}

// ============================================================================
// ZOOM CONTROLLER  
// Manages smooth camera distance transitions between first/third person
// ============================================================================

/**
 * Controls camera zoom distance from character
 * Provides smooth animated transitions between zoom levels
 * Determines first-person vs third-person view based on zoom distance
 */
class ZoomController {
  zoom: number                // Current zoom distance
  lastZoomLevel: number       // Previous target zoom level
  startZoomAnimation: number  // When current animation started
  isAnimating: boolean        // Whether zoom is currently animating
  startingZoom: number        // Zoom distance when animation started

  constructor() {
    this.zoom = MIN_ZOOM_LEVEL  // Start in first-person mode
    this.startingZoom = 0
    this.lastZoomLevel = 0
    this.startZoomAnimation = 0
    this.isAnimating = false
  }

  /**
   * Update zoom distance with smooth animation
   * @param zoomLevel - Target zoom level from input
   * @param timestamp - Current animation timestamp
   * @param timeDiff - Time since last frame
   */
  update(zoomLevel: number, timestamp: number, timeDiff: number) {
    const time = timestamp * SCROLL_ANIMATION_SPEED
    const zlClamped = clamp(zoomLevel, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL)

    // Check if zoom target has changed
    const zoomLevelHasChanged = this.lastZoomLevel !== zoomLevel
    if (zoomLevelHasChanged) {
      // Start new zoom animation
      this.startingZoom = this.zoom            // Current zoom becomes start
      this.startZoomAnimation = time           // Reset animation timer
      this.isAnimating = true
    }

    // Animate to target zoom level
    if (this.isAnimating) {
      const progress = time - this.startZoomAnimation
      
      // Use easing function for smooth animation
      this.zoom = lerp(this.startingZoom, zlClamped, easeOutExpo(progress))

      // End animation when complete
      if (progress >= 1) {
        this.isAnimating = false
      }
    }

    this.lastZoomLevel = zoomLevel
  }
}

// ============================================================================
// HEIGHT CONTROLLER
// Manages vertical movement including gravity, jumping, and grounding
// ============================================================================

/**
 * Controls character's vertical movement and physics
 * Features:
 * - Gravity simulation with realistic falling
 * - Jump mechanics with smooth animation curves
 * - Ground detection and response
 * - Separate jump and gravity systems that combine naturally
 */
class HeightController {
  height: number              // Current height offset from ground
  lastHeight: number          // Previous height (for delta calculation)
  movePerFrame: number        // Vertical movement to apply this frame
  lastGroundHeight: number    // Y position of last detected ground
  startFallAnimation: number  // When gravity simulation started
  isAnimating: boolean        // Whether falling animation is active
  grounded: boolean           // Whether character is on ground
  jumpFactor: number          // Jump input strength (0-1)
  startJumpAnimation: number  // When jump animation started

  constructor() {
    this.height = 0
    this.lastHeight = this.height
    this.movePerFrame = 0
    this.lastGroundHeight = this.height
    this.startFallAnimation = 0
    this.startJumpAnimation = 0
    this.jumpFactor = 0
    this.isAnimating = false
    this.grounded = false
  }

  /**
   * Update vertical movement for current frame
   * Combines gravity and jump systems
   * @param timestamp - Current animation timestamp
   * @param timeDiff - Time since last frame
   */
  update(timestamp: number, timeDiff: number) {
    // Gravity simulation (only when not grounded)
    this.isAnimating = !this.grounded

    if (this.isAnimating) {
      // Apply gravity using physics equation: h = 0.5 * g * t^2
      const t = timestamp - this.startFallAnimation
      this.height = 0.5 * GRAVITY.y * t * t
      
      // Calculate movement delta for this frame
      this.movePerFrame = this.height - this.lastHeight
    } else {
      // Reset gravity when grounded
      this.height = 0
      this.lastHeight = 0
      this.movePerFrame = 0
      this.startFallAnimation = timestamp
    }

    // Jump animation system (separate from gravity)
    const jt = timestamp - this.startJumpAnimation
    
    if (this.grounded && jt > JUMP_DURATION) {
      // Reset jump when grounded and animation complete
      this.jumpFactor = 0
      this.startJumpAnimation = timestamp
    } else {
      // Apply jump motion using smooth up-down curve
      this.movePerFrame += lerp(
        0,
        this.jumpFactor * JUMP_AMPLITUDE,
        UpDownCirc(clamp(jt / JUMP_DURATION, 0, 1))  // Smooth jump curve
      )
    }

    this.lastHeight = this.height
  }

  /**
   * Set whether character is on ground (called by ground detection)
   * @param grounded - true if character is touching ground
   */
  setGrounded(grounded: boolean) {
    this.grounded = grounded
  }

  /**
   * Set jump input strength (called when space key pressed)
   * @param jumpFactor - Jump strength (0 = no jump, 1 = full jump)
   */
  setJumpFactor(jumpFactor: number) {
    this.jumpFactor = jumpFactor
  }
}

// * Responsible for controlling the character movement, rotation and physics
// ============================================================================
// CHARACTER CONTROLLER
// Main controller that integrates all character systems
// ============================================================================

/**
 * Main character controller that integrates:
 * - Input handling (keyboard/mouse)
 * - Camera control (first/third person)
 * - Physics simulation (movement, jumping, collision)
 * - Visual effects (head bobbing, smooth zoom)
 * 
 * This extends THREE.Mesh to participate in the scene graph and physics world.
 * The controller manages the invisible physics capsule while the avatar manages the visual mesh.
 */
class CharacterController extends THREE.Mesh {
  camera: THREE.PerspectiveCamera      // Camera controlled by this character
  inputManager: InputManager           // Handles all user input
  headBobController: HeadBobController // First-person head bobbing
  heightController: HeightController   // Gravity and jumping
  phi: number                          // Horizontal camera rotation (yaw)
  theta: number                        // Vertical camera rotation (pitch)
  objects: any                         // Legacy property (unused)
  isMoving2D: boolean                  // Whether character is moving horizontally
  startZoomAnimation: number           // Animation timing (unused)
  zoomController: ZoomController       // Camera zoom control
  physicsObject: PhysicsObject         // Physics body for collision
  avatar: AvatarController             // Reference to avatar that owns this controller

  constructor(avatar: AvatarController, camera: THREE.PerspectiveCamera) {
    super()

    // Initialize position to match avatar
    this.position.copy(avatar.avatar.position)

    this.camera = camera
    this.avatar = avatar

    // Initialize all subsystems
    this.inputManager = new InputManager()
    this.headBobController = new HeadBobController()
    this.zoomController = new ZoomController()
    this.heightController = new HeightController()

    // Setup physics collision
    this.physicsObject = this.initPhysics(avatar)

    // NOTE: Rapier's built-in character controller has issues, so we implement our own
    // this.characterController = physics.createCharacterController(OFFSET)

    this.startZoomAnimation = 0

    // Camera rotation angles
    this.phi = 0    // Horizontal rotation (left/right)
    this.theta = 0  // Vertical rotation (up/down)

    this.isMoving2D = false
  }

  /**
   * Initialize physics collision for the character
   * Creates a capsule collider that matches the avatar's dimensions
   * @param avatar - Avatar controller containing mesh dimensions
   * @returns Physics object with capsule collider
   */
  initPhysics(avatar: AvatarController) {
    // Initialize reusable ray for ground detection
    ray_0 = new RAPIER.Ray(vec3_0, vec3_0)

    // Create capsule collider matching avatar dimensions
    const radius = avatar.width / 2                    // Capsule radius
    const halfHeight = avatar.height / 2 - radius      // Capsule half-height (excluding spherical ends)
    
    const physicsObject = addPhysics(
      this,                           // Mesh to attach physics to
      'kinematicPositionBased',       // Kinematic body (moved by code, not physics)
      false,                          // Don't auto-animate (we control position manually)
      undefined,                      // No post-physics callback
      'capsule',                      // Capsule collision shape
      { halfHeight, radius }          // Capsule dimensions
    )

    return physicsObject
  }

  detectGround() {
    const physics = usePhysics()
    const avatarHalfHeight = this.avatar.height / 2

    // set collider position
    const colliderPosition = vec3_0.copy(this.position)
    this.physicsObject.collider.setTranslation(colliderPosition)

    // hitting the ground
    const rayOrigin = vec3_1.copy(this.position)
    // ray origin is at the foot of the avatar
    rayOrigin.y -= avatarHalfHeight

    const ray = ray_0
    ray.origin = rayOrigin
    ray.dir = DOWN

    const groundUnderFootHit = physics.castRay(
      ray,
      1000,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
      undefined,
      this.physicsObject.collider,
      this.physicsObject.rigidBody
    )

    if (groundUnderFootHit) {
      const hitPoint = ray.pointAt(groundUnderFootHit.toi) as THREE.Vector3
      const distance = rayOrigin.y - hitPoint.y
      if (distance <= 0) {
        // * Grounded
        this.heightController.setGrounded(true)
      } else {
        this.heightController.lastGroundHeight = hitPoint.y + avatarHalfHeight
        this.heightController.setGrounded(false)
      }
    } else {
      // * Shoot another ray up to see if we've passed the ground
      ray.dir = UP
      const groundAboveFootHit = physics.castRay(
        ray,
        this.avatar.height / 2,
        true,
        RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
        undefined,
        this.physicsObject.collider,
        this.physicsObject.rigidBody
      )

      if (groundAboveFootHit) {
        // * passed the ground
        this.position.y = this.heightController.lastGroundHeight
        this.heightController.setGrounded(true)
      } else {
        this.heightController.setGrounded(false)
      }
    }

    // ! Rapier.js character controller is bugged
    {
      // this.characterController.computeColliderMovement(
      //   this.physicsObject.collider, // The collider we would like to move.
      //   this.position // The movement we would like to apply if there wasn’t any obstacle.
      // )
      // // Read the result
      // const correctedMovement = this.characterController.computedMovement()
      // this.position.copy(correctedMovement as THREE.Vector3)
    }
  }

  update(timestamp: number, timeDiff: number) {
    this.updateRotation()
    this.updateTranslation(timeDiff)
    this.updateGravity(timestamp, timeDiff)
    this.detectGround()
    this.updateZoom(timestamp, timeDiff)
    this.updateCamera(timestamp, timeDiff)
    this.inputManager.update()
  }

  updateZoom(timestamp: number, timeDiff: number) {
    this.zoomController.update(
      this.inputManager.currentMouse.mouseWheelDelta,
      timestamp,
      timeDiff
    )
  }

  updateGravity(timestamp: number, timeDiff: number) {
    this.heightController.update(timestamp, timeDiff)
  }

  updateCamera(timestamp: number, timeDiff: number) {
    this.camera.position.copy(this.position)
    // this.camera.position.y += this.avatar.height / 2

    // moving by the camera angle
    const circleRadius = this.zoomController.zoom
    const cameraOffset = vec3_0.set(
      circleRadius * Math.cos(-this.phi),
      circleRadius * Math.cos(this.theta + HALF_PI),
      circleRadius * Math.sin(-this.phi)
    )
    this.camera.position.add(cameraOffset)
    this.camera.lookAt(this.position)

    // head bob
    const isFirstPerson = this.zoomController.zoom <= this.avatar.width
    if (isFirstPerson) {
      this.camera.position.y += this.headBobController.getHeadBob(timeDiff, this.isMoving2D)

      // keep looking at the same position in the object in front
      const physics = usePhysics()

      const rayOrigin = vec3_1.copy(this.camera.position)
      const rayDirection = vec3_0.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize()
      const ray = ray_0
      ray.origin = rayOrigin
      ray.dir = rayDirection

      const hit = physics.castRay(ray, 1000, false)

      if (hit) {
        const point = ray.pointAt(hit.toi)
        const hitPoint = vec3_0.set(point.x, point.y, point.z)
        this.camera.lookAt(hitPoint)
      }
    }
  }

  updateTranslation(timeDiff: number) {
    const timeDiff_d10 = timeDiff * 10

    const shiftSpeedUpAction = () =>
      this.inputManager.runActionByOneKey([KEYS.shiftL, KEYS.shiftR], FIVE, ONE)

    const forwardVelocity =
      this.inputManager.runActionByKey(KEYS.w, shiftSpeedUpAction, ZERO) -
      this.inputManager.runActionByKey(KEYS.s, shiftSpeedUpAction, ZERO)

    const sideVelocity =
      this.inputManager.runActionByKey(KEYS.a, shiftSpeedUpAction, ZERO) -
      this.inputManager.runActionByKey(KEYS.d, shiftSpeedUpAction, ZERO)

    const qx = quaternion_1
    qx.setFromAxisAngle(UP, this.phi + HALF_PI)

    vec3_0.copy(FORWARD)
    vec3_0.applyQuaternion(qx)
    vec3_0.multiplyScalar(forwardVelocity * timeDiff_d10)

    vec3_1.copy(LEFT)
    vec3_1.applyQuaternion(qx)
    vec3_1.multiplyScalar(sideVelocity * timeDiff_d10)

    this.position.add(vec3_0)
    this.position.add(vec3_1)

    // Height
    const elevationFactor = this.inputManager.runActionByKey(KEYS.space, ONE, ZERO)

    // Jump
    if (this.heightController.grounded) {
      this.heightController.setJumpFactor(elevationFactor)
    }

    this.position.y += this.heightController.movePerFrame

    this.isMoving2D = forwardVelocity != 0 || sideVelocity != 0
  }

  updateRotation() {
    const windowSize = useRenderSize()
    const xh = this.inputManager.currentMouse.mouseXDelta / windowSize.width
    const yh = this.inputManager.currentMouse.mouseYDelta / windowSize.height

    const PHI_SPEED = 2.5
    const THETA_SPEED = 2.5
    this.phi += -xh * PHI_SPEED
    this.theta = clamp(this.theta + -yh * THETA_SPEED, -Math.PI / 2, Math.PI / 2)

    const qx = quaternion_0
    qx.setFromAxisAngle(UP, this.phi)
    const qz = quaternion_1
    qz.setFromAxisAngle(RIGHT, this.theta)

    const q = qx.multiply(qz)

    this.quaternion.copy(q)
  }
}

// * Responsible for controlling the avatar mesh and the character controller
class AvatarController {
  avatar: THREE.Mesh
  characterController: CharacterController
  height: number
  width: number

  constructor(avatar: THREE.Mesh, camera: THREE.PerspectiveCamera) {
    this.avatar = avatar

    const size = _calculateObjectSize(avatar)
    this.width = size.x
    this.height = size.y
    this.characterController = new CharacterController(this, camera)
  }

  update(timestamp: number, timeDiff: number) {
    this.characterController.update(timestamp, timeDiff)
    this.avatar.position.copy(this.characterController.position)
  }
}

export default AvatarController
