import { Euler } from "three";

/**
 * Manages smooth animation between rotation states
 * Used for animating Earth rotation when location changes externally (from map clicks)
 */
export class AnimationController {
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private duration: number = 0;
  private fromEuler: Euler | null = null;
  private targetEuler: Euler | null = null;
  private onFrameCallback: ((euler: Euler) => void) | null = null;

  /**
   * Start a smooth animation from one rotation to another
   * @param fromEuler Starting rotation
   * @param targetEuler Target rotation
   * @param duration Animation duration in milliseconds
   * @param onFrame Callback invoked each frame with current interpolated rotation
   */
  startAnimation(
    fromEuler: Euler,
    targetEuler: Euler,
    duration: number,
    onFrame: (euler: Euler) => void
  ): void {
    // Cancel any existing animation
    this.cancel();

    this.fromEuler = fromEuler.clone();
    this.targetEuler = targetEuler.clone();
    this.duration = duration;
    this.onFrameCallback = onFrame;
    this.startTime = Date.now();

    this.animate();
  }

  /**
   * Check if animation is currently running
   */
  isAnimating(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Cancel the current animation
   */
  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Internal animation loop using linear interpolation
   */
  private animate = (): void => {
    if (!this.fromEuler || !this.targetEuler || !this.onFrameCallback) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Linear interpolation between euler angles
    const current = new Euler(
      this.fromEuler.x + (this.targetEuler.x - this.fromEuler.x) * progress,
      this.fromEuler.y + (this.targetEuler.y - this.fromEuler.y) * progress,
      this.fromEuler.z + (this.targetEuler.z - this.fromEuler.z) * progress
    );

    this.onFrameCallback(current);

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
    }
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancel();
    this.fromEuler = null;
    this.targetEuler = null;
    this.onFrameCallback = null;
  }
}
