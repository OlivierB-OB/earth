import { Viewer3DEventHandler } from "../Viewer3DEventHandler";
import { DroneControls } from "../../../types/Drone";

/**
 * Event handler for keyboard input to control drone
 * Maps WASD + Space/Ctrl to drone movement controls
 */
export class KeyboardHandler extends Viewer3DEventHandler {
  private onKeyChange: ((controls: Partial<DroneControls>) => void) | null =
    null;

  // Track which keys are currently pressed
  private keysPressed: Map<string, boolean> = new Map();

  constructor(onKeyChange?: (controls: Partial<DroneControls>) => void) {
    super();
    this.onKeyChange = onKeyChange || null;

    // Initialize key tracking for WASD and control keys
    ["w", "a", "s", "d", " ", "control"].forEach((key) => {
      this.keysPressed.set(key.toLowerCase(), false);
    });
  }

  /**
   * Get event type
   */
  protected getEventType(): string {
    return "keydown";
  }

  /**
   * Get event target (window for keyboard)
   */
  protected getTarget(): HTMLElement | Window {
    return window;
  }

  /**
   * Override attach to handle both keydown and keyup
   */
  override attach(): void {
    if (this.attached) return;

    const callback = this.getEventCallback();
    window.addEventListener("keydown", callback);
    window.addEventListener("keyup", callback);
    this.attached = true;
  }

  /**
   * Override detach to remove both keydown and keyup listeners
   */
  private removeListeners(): void {
    if (!this.attached) return;

    const callback = this.getEventCallback();
    window.removeEventListener("keydown", callback);
    window.removeEventListener("keyup", callback);
    this.attached = false;
  }

  /**
   * Handle keyboard event
   */
  private handleKeyEvent = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    if (event.type === "keydown") {
      this.keysPressed.set(key, true);
      event.preventDefault();
      console.debug(`[User Control] Key pressed: ${key}`);
    } else if (event.type === "keyup") {
      this.keysPressed.set(key, false);
      event.preventDefault();
      console.debug(`[User Control] Key released: ${key}`);
    }

    // Update controls based on current key state
    this.updateControls();
  };

  /**
   * Map key state to drone controls
   */
  private updateControls(): void {
    if (!this.onKeyChange) return;

    const controls: Partial<DroneControls> = {
      moveForward: this.keysPressed.get("w") || false,
      moveBack: this.keysPressed.get("s") || false,
      moveLeft: this.keysPressed.get("a") || false,
      moveRight: this.keysPressed.get("d") || false,
      ascend: this.keysPressed.get(" ") || false, // Space for up
      descend: this.keysPressed.get("control") || false, // Ctrl for down
    };

    const activeControls = Object.entries(controls)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    if (activeControls.length > 0) {
      console.debug(`[User Control] Drone controls active: ${activeControls.join(', ')}`);
    }

    this.onKeyChange(controls);
  }

  /**
   * Get event callback function
   */
  protected getEventCallback(): (e: Event) => void {
    return this.handleKeyEvent as (e: Event) => void;
  }

  /**
   * Cleanup on detach
   */
  override detach(): void {
    this.removeListeners();
    this.keysPressed.clear();
    this.onKeyChange = null;
  }
}
