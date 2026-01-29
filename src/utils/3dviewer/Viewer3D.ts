import * as THREE from "three";
import type { IViewer3D } from "./IViewer3D";
import type { Viewer3DSceneBase } from "./Viewer3DSceneBase";
import type { Viewer3DEventHandler } from "./Viewer3DEventHandler";
import { Viewer3DScene } from "./Viewer3DScene";

/**
 * Main facade for 3D viewer using Three.js
 * Encapsulates renderer, scene, and component lifecycle management
 * Uses IoC pattern for scene components and event handlers
 */
export class Viewer3D implements IViewer3D {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private sceneComponents: Set<Viewer3DSceneBase<THREE.Object3D>> = new Set();
  private eventHandlers: Set<Viewer3DEventHandler> = new Set();
  private animationFrameId: number | null = null;
  private domRef: HTMLDivElement | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the viewer with a DOM container
   */
  init(domRef: HTMLDivElement): void {
    if (this.isInitialized) {
      console.warn("Viewer3D already initialized");
      return;
    }

    this.domRef = domRef;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    domRef.appendChild(this.renderer.domElement);

    // Initialize all scene components (which triggers their init and render)
    this.sceneComponents.forEach((component) => {
      if (!component) return;
      // IoC: inject this viewer into component
      component.init(this);
      // Render component (creates its object)
      component.render();
    });

    // Get scene and camera from components
    const sceneComponent = Array.from(this.sceneComponents).find(
      (c) => c instanceof Viewer3DScene
    ) as Viewer3DScene | undefined;
    this.scene = sceneComponent?.getScene() || null;
    this.camera = this.getCamera();

    // Attach all event handlers (which triggers their init and attach)
    this.eventHandlers.forEach((handler) => {
      if (!handler) return;
      // IoC: inject this viewer into handler
      handler.init(this);
      // Attach handler to event targets
      handler.attach();
    });

    // Start render loop
    this.startRenderLoop();

    this.isInitialized = true;
  }

  /**
   * Add a scene component with IoC initialization
   */
  addSceneComponent(component: Viewer3DSceneBase<THREE.Object3D>): void {
    this.sceneComponents.add(component);

    // If already initialized, init and render immediately
    if (this.isInitialized) {
      component.init(this);
      component.render();
    }
  }

  /**
   * Remove a scene component
   */
  removeSceneComponent(component: Viewer3DSceneBase<THREE.Object3D>): void {
    if (this.sceneComponents.has(component)) {
      component.dispose();
      this.sceneComponents.delete(component);
    }
  }

  /**
   * Add an event handler with IoC initialization
   */
  addEventHandler(handler: Viewer3DEventHandler): void {
    this.eventHandlers.add(handler);

    // If already initialized, init and attach immediately
    if (this.isInitialized) {
      handler.init(this);
      handler.attach();
    }
  }

  /**
   * Remove an event handler
   */
  removeEventHandler(handler: Viewer3DEventHandler): void {
    if (this.eventHandlers.has(handler)) {
      handler.dispose();
      this.eventHandlers.delete(handler);
    }
  }

  /**
   * Re-render all components
   */
  render(): void {
    this.sceneComponents.forEach((component) => {
      component.refresh();
    });
  }

  /**
   * Get the scene
   */
  getScene(): THREE.Scene | null {
    if (this.scene) return this.scene;

    // Try to find scene in components
    const sceneComponent = Array.from(this.sceneComponents).find(
      (c) => c instanceof Viewer3DScene
    ) as Viewer3DScene | undefined;

    if (sceneComponent) {
      this.scene = sceneComponent.getScene();
    }

    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.Camera | null {
    if (this.camera) return this.camera;

    // Try to find camera in components
    for (const component of this.sceneComponents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const componentAny = component as any;
      if (componentAny.getCamera) {
        this.camera = componentAny.getCamera();
        if (this.camera) break;
      }
    }

    return this.camera;
  }

  /**
   * Get the renderer
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.renderFrame();
    };

    animate();
  }

  /**
   * Render a single frame
   */
  private renderFrame(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Complete cleanup
   */
  dispose(): void {
    // Cancel animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose all event handlers
    this.eventHandlers.forEach((handler) => {
      handler.dispose();
    });
    this.eventHandlers.clear();

    // Dispose all scene components
    this.sceneComponents.forEach((component) => {
      component.dispose();
    });
    this.sceneComponents.clear();

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.domRef && this.renderer.domElement.parentElement === this.domRef) {
        this.domRef.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.domRef = null;
    this.isInitialized = false;
  }
}
