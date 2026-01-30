import type { IViewer3DSceneItem } from "./IViewer3DSceneItem";
import type { IViewer3DScene } from "./IViewer3DScene";
import { Scene, AmbientLight, DirectionalLight, Color } from "three";
import { Viewer3DItem } from "./Viewer3DItem";
import type { IViewer3D } from "./IViewer3D";

/**
 * Concrete scene component that wraps the THREE.Scene
 * Manages the lifecycle of all scene components added to it
 * Unlike other scene components, this doesn't get added to another scene
 */
export class Viewer3DScene
  extends Viewer3DItem<Scene>
  implements IViewer3DScene
{
  private items: Set<IViewer3DSceneItem> = new Set();

  /**
   * Receive the Viewer3D instance (IoC injection)
   * Initialize renderer with DOM container
   */
  override init(viewer: IViewer3D) {
    super.init(viewer);
    this.items.forEach((item) => {
      item.init(this);
      item.render();
    });
  }

  protected makeObject(): Scene {
    const scene = new Scene();

    // Set background to sky blue
    scene.background = new Color(0x87ceeb);

    // Add ambient light for general illumination
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light for shadows and depth
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    return scene;
  }

  public refresh(): void {
    // Initialize all scene item
    this.items.forEach((item) => {
      item.render();
    });
  }

  /**
   * Add a scene item with IoC initialization
   */
  addItem(item: IViewer3DSceneItem): void {
    this.items.add(item);
    if (this.initialized) {
      item.init(this);
      item.render();
    }
  }

  /**
   * Remove a scene item
   */
  removeItem(item: IViewer3DSceneItem): void {
    if (this.items.has(item)) {
      item.dispose();
      this.items.delete(item);
    }
  }

  /**
   * Override dispose to clean up scene items
   */
  override dispose(): void {
    this.items.forEach((item) => {
      item.dispose();
    });
    this.items.clear();

    super.dispose();
    this.initialized = false;
  }
}
