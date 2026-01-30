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
  private frameCount: number = 0;

  /**
   * Receive the Viewer3D instance (IoC injection)
   * Initialize renderer with DOM container
   */
  override init(viewer: IViewer3D) {
    super.init(viewer);
    viewer.domRef.appendChild(this.object.domElement);
    // Render on-demand when markDirty() is called
    this.markDirty();
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
      this.object.setPixelRatio(window.devicePixelRatio);
    }
  }

  /**
   * Schedule a render on the next available frame if not already scheduled
   */
  private scheduleRender(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.renderFrame();
        this.animationFrameId = null;
      });
    }
  }

  /**
   * Mark the renderer as needing a redraw
   */
  public markDirty(): void {
    this.scheduleRender();
  }

  /**
   * Request an immediate render on the next frame
   */
  public renderNow(): void {
    this.scheduleRender();
  }

  /**
   * Render a single frame
   */
  private renderFrame(): void {
    this.frameCount++;
    console.debug(`[3D Viewer] Rendering frame ${this.frameCount}`);
    this.object.render(this.viewer.scene.object, this.viewer.camera.object);
  }

  /**
   * Clean up renderer resources
   */
  override dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
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
