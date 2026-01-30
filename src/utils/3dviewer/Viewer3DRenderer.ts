import { WebGLRenderer } from "three";
import { Viewer3DItem } from "./Viewer3DItem";
import type { IViewer3D } from "./IViewer3D";
import { IViewer3DRenderer } from "./IViewer3DRenderer";

/**
 * Renderer component for 3D viewer
 * Manages WebGL renderer lifecycle, sizing, and DOM attachment
 * Extends Viewer3DItem to follow the composable component pattern
 */
export class Viewer3DRenderer
  extends Viewer3DItem<WebGLRenderer>
  implements IViewer3DRenderer
{
  private animationFrameId: number | null = null;

  /**
   * Receive the Viewer3D instance (IoC injection)
   * Initialize renderer with DOM container
   */
  override init(viewer: IViewer3D) {
    super.init(viewer);
    viewer.domRef.appendChild(this.object.domElement);
    this.start();
  }

  /**
   * Create and configure the WebGL renderer
   */
  protected makeObject(): WebGLRenderer {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
  }

  /**
   * Handle window resize
   */
  handleResize(): void {
    if (this.initialized) {
      this.object.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Start the render loop
   */
  private start(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.renderFrame();
    };
    animate();
  }

  /**
   * Start the render loop
   */
  private stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render a single frame
   */
  private renderFrame(): void {
    this.object.render(this.viewer.scene.object, this.viewer.camera.object);
  }

  /**
   * Clean up renderer resources
   */
  override dispose(): void {
    this.stop();
    if (
      this.initialized &&
      this.object.domElement.parentElement === this.viewer.domRef
    ) {
      this.viewer.domRef.removeChild(this.object.domElement);
      this.object.dispose();
      super.dispose();
    }
  }
}
