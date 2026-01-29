import L from "leaflet";
import { FlatMapEventHandler } from "../../../utils/flatmap";

export class ClickEventHandler extends FlatMapEventHandler {
  private callback: (lat: number, lng: number) => void;

  constructor(callback: (lat: number, lng: number) => void) {
    super();
    this.callback = callback;
  }

  /**
   * Get the event type
   */
  protected getEventType(): "click" {
    return "click";
  }

  /**
   * Get the event callback handler
   */
  protected getEventCallback(): L.LeafletMouseEventHandlerFn {
    return (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.callback(lat, lng);
    };
  }
}
