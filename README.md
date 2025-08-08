# Advanced Character Controller

A sophisticated Three.js character controller with Rapier physics integration, featuring comprehensive documentation and modular architecture. This project demonstrates advanced game development techniques with WebGL and physics simulation.

## 🎮 Demo Video
[![Dynamic Character Controller With Three.js](https://user-images.githubusercontent.com/64514807/235347853-9411d7d7-1508-42a7-82aa-232650b13ee7.png)](https://youtu.be/ipW-DUyPYlk)

## ✨ Features

### Character Controller System
- **🎯 First/Third Person Camera** - Seamless transitions between camera modes using mouse wheel zoom
- **🖱️ Mouse Look Controls** - Professional FPS-style camera control with automatic pointer lock
- **⌨️ WASD Movement** - Responsive keyboard input with sprint modifier (Shift key)
- **⚡ Physics Integration** - Realistic capsule collision with advanced ground detection
- **🦘 Jump Mechanics** - Smooth jump animation with realistic gravity simulation
- **👀 Head Bobbing** - Natural first-person walking motion for immersion

### Technical Excellence
- **🔬 Rapier Physics Engine** - High-performance WebAssembly-based physics simulation
- **🏗️ Modular Architecture** - Clean separation of concerns across input, physics, rendering, and animation systems
- **📝 TypeScript Support** - Full type safety with comprehensive type definitions
- **⚡ Performance Optimized** - Object pooling, efficient raycasting, and consistent 60fps rendering
- **📚 Comprehensive Documentation** - Extensive comments and architecture explanations throughout the entire codebase

## 📖 Documentation

This project features **extensive documentation** designed to help developers understand and extend the character controller system:

### 🗂️ Documentation Structure
- **`CLAUDE.md`** - Complete development guide with architecture overview and common commands
- **Inline Comments** - Every file contains detailed explanations of complex systems and interactions
- **JSDoc Documentation** - All functions and classes include parameter descriptions and usage examples
- **Architecture Guides** - System integration explanations for physics, input, and rendering

### 🔍 Key Documented Systems
- **Character Controller Architecture** - How input, physics, and camera systems integrate
- **Physics Integration** - Rapier physics setup, collision detection, and ground detection algorithms
- **Input Management** - Pointer lock implementation, keyboard handling, and action mapping
- **Animation Systems** - Head bobbing, zoom transitions, and jump curve mathematics
- **Rendering Pipeline** - Three.js setup, post-processing, and performance optimization

## 🏗️ Architecture Overview

The codebase follows a modular architecture with clear separation of responsibilities:

```
src/
├── render/
│   ├── controllers/          # Character control and input systems
│   │   ├── character-controller.ts  # Main character controller with physics
│   │   ├── tick-manager.ts          # Animation loop management
│   │   └── utils/                   # Mathematical and utility functions
│   ├── physics/              # Physics simulation integration
│   │   ├── physics.ts               # Rapier physics object management
│   │   └── RAPIER.ts                # WebAssembly physics initialization
│   ├── loaders/              # Asset loading utilities
│   └── init.ts               # Engine initialization and component hooks
├── app.ts                    # Demo scene setup
└── index.ts                  # Application entry point
```

### 🎯 Core Components

1. **InputManager** - Handles mouse/keyboard input with pointer lock
2. **CharacterController** - Integrates physics, camera, and movement
3. **HeightController** - Manages gravity, jumping, and ground detection
4. **ZoomController** - Smooth camera distance transitions
5. **TickManager** - Coordinates rendering, physics, and updates

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Latticeworks1/advanced-character-controller.git
cd advanced-character-controller

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm start
```

Visit `http://localhost:8080` to see the character controller in action.

### Production Build

```bash
# Build optimized production bundle
npm run build

# Serve production build (requires http-server)
npm i -g http-server
cd dist && http-server
```

## 🎮 Controls

- **Mouse** - Look around (click to enable pointer lock)
- **WASD** - Move character
- **Shift + WASD** - Sprint
- **Space** - Jump
- **Mouse Wheel** - Zoom camera (first-person ↔ third-person)

## 🛠️ Development Guide

### Project Structure

The project follows a modular architecture optimized for maintainability and extensibility:

- **Engine Core** (`src/render/init.ts`) - Initializes Three.js, physics, and provides component hooks
- **Character System** (`src/render/controllers/`) - Modular character controller with input, physics, and camera
- **Physics Integration** (`src/render/physics/`) - Rapier physics setup and object management
- **Asset Loading** (`src/render/loaders/`) - Unified loading system for 3D models and textures
- **Demo Application** (`src/app.ts`) - Example scene with interactive objects

### Key Development Commands

```bash
npm start        # Development server with hot reload
npm run build    # Production build
npm run lint     # ESLint code analysis
npm run prettify # Format code with Prettier
```

### Extending the Character Controller

The character controller is designed for easy extension:

1. **Custom Input Actions** - Add new key bindings in `InputManager`
2. **Physics Behaviors** - Extend `HeightController` or `CharacterController`
3. **Camera Effects** - Modify `ZoomController` or `HeadBobController`
4. **Animation Systems** - Hook into the `TickManager` for custom animations

See `CLAUDE.md` for detailed development guidance and architecture explanations.

## 🔧 Tech Stack

### Core Technologies
- **[Three.js](https://threejs.org)** - 3D graphics and rendering
- **[Rapier](https://rapier.rs/)** - WebAssembly physics engine
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Build System
- **[Webpack](https://webpack.js.org/)** - Module bundling and optimization
- **[Babel](https://babeljs.io/)** - JavaScript transpilation
- **[Sass](https://sass-lang.com/)** - CSS preprocessing
- **[PostCSS](https://postcss.org/)** - CSS transformations

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting and analysis
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Stats.js](https://github.com/mrdoob/stats.js/)** - Performance monitoring

## 📚 Learning Resources

This project serves as an excellent learning resource for:

- **Game Development** - Character controllers, physics simulation, input handling
- **Three.js** - Advanced 3D graphics programming and optimization techniques
- **WebAssembly** - High-performance physics integration in web applications
- **TypeScript** - Large-scale JavaScript application architecture
- **Documentation** - How to create maintainable, well-documented codebases

## 🤝 Contributing

Contributions are welcome! This project emphasizes:

- **Clean Architecture** - Modular, testable, and maintainable code
- **Comprehensive Documentation** - Every change should include appropriate documentation
- **Performance** - Maintain smooth 60fps performance across all features
- **TypeScript** - Maintain full type safety throughout the codebase

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Original demo concept and implementation
- [Rapier Physics Engine](https://rapier.rs/) for WebAssembly physics
- [Three.js](https://threejs.org) community for 3D graphics foundation
