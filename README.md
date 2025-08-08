# Advanced Character Controller

A sophisticated Three.js character controller with Rapier physics integration, featuring comprehensive documentation and modular architecture.

## Demo Video
[![Dynamic Character Controller With Three.js](https://user-images.githubusercontent.com/64514807/235347853-9411d7d7-1508-42a7-82aa-232650b13ee7.png)](https://youtu.be/ipW-DUyPYlk)

## Features

### Character Controller System
- **First/Third Person Camera** - Smooth transitions between camera modes with mouse wheel zoom
- **Mouse Look Controls** - FPS-style camera control with pointer lock
- **WASD Movement** - Responsive keyboard input with sprint modifier (Shift)
- **Physics Integration** - Capsule collision with ground detection and realistic physics
- **Jump Mechanics** - Smooth jump animation with gravity simulation
- **Head Bobbing** - Natural first-person walking motion

### Technical Features
- **Rapier Physics Engine** - High-performance WebAssembly physics simulation
- **Modular Architecture** - Clean separation of input, physics, rendering, and animation systems
- **TypeScript Support** - Full type safety with comprehensive type definitions
- **Performance Optimized** - Object pooling, efficient raycasting, and smooth 60fps rendering
- **Comprehensive Documentation** - Detailed comments and architecture explanations throughout codebase

## Installation

Clone this repo and npm install.

```bash
npm i
```

## Usage

### Development server

```bash
npm start
```

You can view the development server at `localhost:8080`.

### Production build

```bash
npm run build
```

> Note: Install [http-server](https://www.npmjs.com/package/http-server) globally to deploy a simple server.

```bash
npm i -g http-server
```

You can view the deploy by creating a server in `dist`.

```bash
cd dist && http-server
```

## Features

- [Three](https://threejs.org)
- [Webpack](https://webpack.js.org/)
- [Babel](https://babeljs.io/)
- [Sass](https://sass-lang.com/)
- [PostCSS](https://postcss.org/)
- [Gsap](https://greensock.com/gsap/)

## License

This project is open source and available under the [MIT License](LICENSE).
