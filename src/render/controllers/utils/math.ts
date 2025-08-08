/**
 * Mathematical Utility Functions
 * 
 * This module provides commonly used mathematical functions for animation,
 * interpolation, easing, and general math operations used throughout the
 * character controller system.
 */

/**
 * Linear interpolation between two values
 * @param x - Start value
 * @param y - End value  
 * @param a - Interpolation factor (0 = x, 1 = y)
 * @returns Interpolated value between x and y
 */
export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a

/**
 * Exponential ease-out curve
 * Starts fast and slows down approaching the end
 * @param x - Input value (typically 0-1)
 * @returns Eased output value
 */
export const easeOutExpo = (x: number) => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

/**
 * Circular ease-out curve
 * Creates a smooth deceleration curve
 * @param x - Input value (0-1)
 * @returns Eased output value following circular curve
 */
export const EaseOutCirc = (x: number) => {
  return Math.sqrt(1.0 - Math.pow(x - 1.0, 2.0))
}

/**
 * Up-down circular motion curve
 * Creates a smooth arc that goes up and then down
 * Perfect for jump animations
 * @param x - Input value (0-1)
 * @returns Output value following sine curve of circular easing
 */
export const UpDownCirc = (x: number) => {
  return Math.sin(EaseOutCirc(x) * Math.PI)
}

/**
 * Clamp a value between minimum and maximum bounds
 * @param x - Value to clamp
 * @param a - Minimum bound
 * @param b - Maximum bound
 * @returns Clamped value between a and b
 */
export const clamp = (x: number, a: number, b: number) => {
  return Math.min(Math.max(x, a), b)
}
