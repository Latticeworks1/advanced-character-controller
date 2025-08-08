/**
 * Animation Loop Manager
 * 
 * This module manages the main animation/game loop for the entire application.
 * It coordinates rendering, physics simulation, character updates, and performance
 * monitoring in the correct order each frame.
 * 
 * The TickManager:
 * - Runs the physics simulation step
 * - Updates physics object positions/rotations
 * - Updates character controller
 * - Renders the scene with post-processing
 * - Dispatches tick events for custom frame callbacks
 * - Monitors and reports performance metrics
 */

import * as THREE from 'three'
import {
  useComposer,
  useControls,
  usePhysics,
  usePhysicsObjects,
  useRenderer,
  useStats,
} from '../init'

// WebXR frame reference (null for regular rendering)
type Frame = XRFrame | null

/**
 * Data passed to tick event listeners each frame
 * Contains timing information and frame context
 */
export type TickData = {
  timestamp: number  // Current timestamp in milliseconds
  timeDiff: number   // Time elapsed since last frame
  fps: number        // Current frames per second
  frame: Frame       // XR frame (null for non-VR)
}

// Reusable tick data object to avoid allocations
const localTickData: TickData = {
  timestamp: 0,
  timeDiff: 0,
  fps: 0,
  frame: null,
}

// Event options for tick events
const localFrameOpts = {
  data: localTickData,
}

// Reusable event object for tick notifications
const frameEvent = new MessageEvent('tick', localFrameOpts)

/**
 * Manages the main animation loop and coordinates all frame-based updates
 * Extends EventTarget to allow custom tick event listeners
 */
class TickManager extends EventTarget {
  timestamp: number      // Current frame timestamp
  timeDiff: number       // Time elapsed since last frame
  frame: Frame           // XR frame reference (if applicable)
  lastTimestamp: number  // Previous frame timestamp
  fps: number           // Current frames per second

  constructor({ timestamp, timeDiff, frame } = localTickData) {
    super()

    this.timestamp = timestamp
    this.timeDiff = timeDiff
    this.frame = frame
    this.lastTimestamp = 0
    this.fps = 0
  }

  /**
   * Start the main animation loop
   * Sets up the render loop that runs every frame
   */
  startLoop() {
    // Get all engine components
    const composer = useComposer()         // Post-processing pipeline
    const renderer = useRenderer()         // WebGL renderer
    const physics = usePhysics()           // Rapier physics world
    const physicsObjects = usePhysicsObjects() // All physics-enabled objects
    const controls = useControls()         // Character controller
    const stats = useStats()               // Performance monitor

    if (!renderer) {
      throw new Error('Animation loop failed: Renderer not initialized')
    }

    /**
     * Main animation callback - executed every frame
     * @param timestamp - Current timestamp from requestAnimationFrame
     * @param frame - XR frame (null for non-VR)
     */
    const animate = (timestamp: number, frame: Frame) => {
      const now = performance.now()
      this.timestamp = timestamp ?? now
      this.timeDiff = timestamp - this.lastTimestamp

      // Cap frame time to prevent huge jumps (max 100ms = 10fps minimum)
      const timeDiffCapped = Math.min(Math.max(this.timeDiff, 0), 100)

      // === PHYSICS SIMULATION ===
      // Step the physics world forward in time
      physics.step()

      // Update all physics objects
      for (let i = 0; i < physicsObjects.length; i++) {
        const po = physicsObjects[i]
        
        // Auto-sync mesh transform with physics body
        if (po.autoAnimate) {
          const mesh = po.mesh
          const collider = po.collider
          // Copy position and rotation from physics to visual mesh
          mesh.position.copy(collider.translation() as THREE.Vector3)
          mesh.quaternion.copy(collider.rotation() as THREE.Quaternion)
        }

        // Execute custom post-physics callback if provided
        const fn = po.fn
        fn && fn()
      }

      // === PERFORMANCE TRACKING ===
      this.fps = 1000 / this.timeDiff
      this.lastTimestamp = this.timestamp

      // === CHARACTER CONTROLLER UPDATE ===
      // Update character with time in seconds
      controls.update(timestamp / 1000, timeDiffCapped / 1000)

      // === RENDERING ===
      // Render with post-processing pipeline
      composer.render()
      // Alternative: Direct rendering without post-processing
      // renderer.render(scene, camera)

      // === TICK EVENTS ===
      // Notify tick event listeners
      this.tick(timestamp, timeDiffCapped, this.fps, frame)

      // === PERFORMANCE STATS ===
      // Update performance monitor display
      stats.update()
    }

    // Start the animation loop
    renderer.setAnimationLoop(animate)
  }

  /**
   * Dispatch tick event to registered listeners
   * @param timestamp - Current timestamp
   * @param timeDiff - Time since last frame
   * @param fps - Current frames per second
   * @param frame - XR frame reference
   */
  tick(timestamp: number, timeDiff: number, fps: number, frame: Frame) {
    // Update shared tick data object
    localTickData.timestamp = timestamp
    localTickData.frame = frame
    localTickData.timeDiff = timeDiff
    localTickData.fps = fps
    
    // Dispatch event to all registered tick listeners
    this.dispatchEvent(frameEvent)
  }
}

export default TickManager
