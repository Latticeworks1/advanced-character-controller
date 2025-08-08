# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm start` - Start development server (localhost:8080)
- `npm run build` - Build for production (outputs to dist/)
- `npm run lint` - Run ESLint on src/**/*.js files
- `npm run prettify` - Format code using Prettier
- `npm run compile` - Compile WASM Rust code (if present)

### Deployment
After building, serve production files from dist/ using http-server:
```bash
cd dist && http-server
```

## Architecture Overview

This is a Three.js-based character controller with physics simulation using Rapier3D. The architecture follows a modular design with clear separation between rendering, physics, and input handling.

### Core Systems

**Physics Engine (Rapier3D)**
- Uses WebAssembly-based Rapier physics engine for realistic character movement
- Physics objects are managed through a centralized system in `src/render/physics/physics.ts`
- Character physics uses capsule colliders with kinematic position-based rigid bodies
- Ground detection via raycasting for proper grounding and jumping mechanics

**Character Controller Architecture**
- `AvatarController` - High-level controller managing mesh and character logic
- `CharacterController` - Core movement, rotation, camera, and physics integration  
- `InputManager` - Handles keyboard/mouse input with pointer lock support
- `HeightController` - Manages gravity, jumping, and vertical movement
- `ZoomController` - Smooth camera zoom transitions between first/third person
- `HeadBobController` - First-person head bobbing during movement

**Engine Initialization (`src/render/init.ts`)**
- Centralized initialization of Three.js scene, camera, renderer, and Rapier physics world
- Provides hooks system for accessing engine components throughout the codebase
- Post-processing pipeline setup with EffectComposer

### Key Implementation Details

**Input System**
- WASD movement with Shift for speed boost
- Mouse look with pointer lock (click to capture cursor)  
- Space for jumping
- Mouse wheel for camera zoom

**Camera System**
- Supports both first-person and third-person modes based on zoom level
- First-person includes head bobbing and look-at raycasting for natural movement
- Third-person orbits around character with smooth zoom animations

**Physics Integration**
- Character uses kinematic character controller with capsule collision shape
- Ground detection through downward raycasting from character feet
- Custom gravity and jump mechanics implemented in HeightController
- Physics objects stored in centralized array for batch processing

### File Structure
```
src/
├── render/
│   ├── controllers/          # Character control logic
│   │   ├── character-controller.ts  # Main character controller
│   │   ├── tick-manager.ts          # Animation loop management
│   │   └── utils/                   # Math, mesh, and object utilities
│   ├── physics/              # Physics simulation
│   │   ├── physics.ts               # Physics object management
│   │   ├── RAPIER.ts               # Rapier initialization
│   │   └── utils/constants.ts       # Physics constants (gravity, etc.)
│   ├── loaders/              # Asset loading utilities
│   └── init.ts               # Engine initialization and hooks
```

## TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Target ES2016 with CommonJS modules  
- Source files in src/ compile to dist/
- Includes Three.js type definitions

## Development Notes
- Uses Webpack for bundling with separate dev/prod configurations
- SASS for styling with PostCSS processing
- ESLint + Prettier for code quality
- Performance monitoring via Three.js Stats
- Debug GUI available via lil-gui