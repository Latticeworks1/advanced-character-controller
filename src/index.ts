/**
 * Main entry point for the Advanced Character Controller demo
 * 
 * This file bootstraps the entire application by:
 * 1. Loading TypeScript type resets for better type safety
 * 2. Importing global styles
 * 3. Initializing the Three.js + Rapier physics engine
 * 4. Starting the demo application with scene setup
 */

// TypeScript type safety improvements by Matt Pocock
import '@total-typescript/ts-reset'

// Global application styles
import '@/styles/index.scss'

// Core engine initialization (Three.js + Rapier physics)
import { initEngine } from './render/init'

// Demo application with scene objects and lighting
import startApp from './app'

// Application bootstrap sequence
(async () => {
  await initEngine()  // Initialize renderer, physics world, and character controller
  await startApp()    // Setup demo scene with ground, cubes, and lighting
})()
