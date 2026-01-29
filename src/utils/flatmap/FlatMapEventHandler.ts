import L from "leaflet";
import type { IFlatMap } from "./IFlatMap";
import type { IFlatMapEventHandler } from "./IFlatMapEventHandler";

/**
 * FlatMapEventHandler - Abstract base class for FlatMap event handlers
 * Provides lifecycle management for composable event handlers
 */
export abstract class FlatMapEventHandler implements IFlatMapEventHandler {
  protected flatMap: IFlatMap | null = null;
  protected attached: boolean = false;

  /**
   * Get the event type (e.g., "click", "dblclick", "mouseover")
   */
  protected abstract getEventType():
    | "click"
    | "dblclick"
    | "mousedown"
    | "mouseup"
    | "mouseover"
    | "mouseout"
    | "mousemove"
    | "contextmenu"
    | "preclick";

  /**
   * Get the event callback handler
   */
  protected abstract getEventCallback(): L.LeafletMouseEventHandlerFn;

  /**
   * Initialize the event handler with a reference to the parent FlatMap
   * Override in subclasses to set up initial state and resources
   * @param flatMap - The parent FlatMap instance
   */
  init(flatMap: IFlatMap): void {
    this.flatMap = flatMap;
  }

  /**
   * Attach the event handler to the map
   */
  attach(): void {
    if (!this.flatMap?.map) {
      throw new Error("FlatMap not initialized");
    }

    if (this.attached) {
      return;
    }

    const eventType = this.getEventType();
    const callback = this.getEventCallback();

    this.flatMap.map.on(eventType, callback);
    this.attached = true;
  }

  /**
   * Detach the event handler from the map
   */
  detach(): void {
    if (!this.flatMap?.map || !this.attached) {
      return;
    }

    const eventType = this.getEventType();
    this.flatMap.map.off(eventType);
    this.attached = false;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detach();
    this.flatMap = null;
  }
}
