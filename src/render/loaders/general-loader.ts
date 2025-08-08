/**
 * General Asset Loader
 * 
 * This module provides a unified interface for loading various types of 3D assets
 * including GLTF models, VRM avatars, and textures. It automatically determines
 * the loader to use based on file extension and provides progress feedback.
 * 
 * Supported formats:
 * - .gltf - 3D models and scenes
 * - .vrm - Virtual avatar models  
 * - .png/.jpg - Textures and images
 */

import { useGltfLoader, useTextureLoader } from '../init'
import * as THREE from 'three'

// Type definition for loader progress callbacks
type LoaderProgress = ProgressEvent<EventTarget>

/**
 * Load a GLTF 3D model file
 * @param path - Path to the .gltf file
 * @returns Promise resolving to loaded GLTF object
 */
const _loadGltf = async (path: string) => {
  const gltfLoader = useGltfLoader()
  const gltf = await gltfLoader.loadAsync(
    path,
    // Progress callback with percentage logging
    (progress: LoaderProgress) =>
      console.log(
        `Loading gltf file from ${path} ...`,
        100.0 * (progress.loaded / progress.total),
        '%'
      )
  )

  return gltf
}
/**
 * Load a VRM avatar model file
 * VRM files are loaded using the GLTF loader as they're based on GLTF format
 * @param path - Path to the .vrm file
 * @returns Promise resolving to loaded VRM object
 */
const _loadVrm = async (path: string) => {
  const gltfLoader = useGltfLoader()
  const vrm = await gltfLoader.loadAsync(
    path,
    // Progress callback with percentage logging
    (progress: LoaderProgress) =>
      console.log(
        `Loading vrm file from ${path} ...`,
        100.0 * (progress.loaded / progress.total),
        '%'
      )
  )

  return vrm
}

/**
 * Load a texture image file
 * @param path - Path to the image file (.png, .jpg, etc.)
 * @returns Promise resolving to loaded Three.js Texture
 */
const _loadTexture = async (path: string) => {
  const textureLoader = useTextureLoader()
  const texture = await textureLoader.loadAsync(
    path,
    // Progress callback with percentage logging
    (progress: LoaderProgress) =>
      console.log(`Loading image from ${path} ...`, 100.0 * (progress.loaded / progress.total), '%')
  )

  // Set texture to repeat for tiling patterns
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return texture
}

/**
 * General purpose asset loader that automatically selects the appropriate
 * loader based on file extension and returns the loaded asset.
 * 
 * Usage:
 * ```typescript
 * const loader = new GeneralLoader()
 * const model = await loader.load('path/to/model.gltf')
 * const texture = await loader.load('path/to/texture.png')
 * ```
 */
class GeneralLoader {
  constructor() {}

  /**
   * Load an asset file automatically detecting the appropriate loader
   * @param path - Path to the asset file
   * @returns Promise resolving to the loaded asset (scene for models, texture for images)
   */
  async load(path: string) {
    const fileType = path.split('.').pop()?.toLowerCase()

    let file = null

    switch (fileType) {
      case 'gltf': {
        file = await _loadGltf(path)
        return file?.scene  // Return the scene from GLTF
      }

      case 'vrm': {
        file = await _loadVrm(path)
        return file?.scene  // Return the scene from VRM
      }

      case 'png':
      case 'jpg':
      case 'jpeg': {
        file = await _loadTexture(path)
        return file  // Return the texture directly
      }

      default: {
        console.error(`GeneralLoader: File type '${fileType}' is not supported.`)
        console.log('Supported formats: .gltf, .vrm, .png, .jpg, .jpeg')
        return null
      }
    }
  }
}

export default GeneralLoader
