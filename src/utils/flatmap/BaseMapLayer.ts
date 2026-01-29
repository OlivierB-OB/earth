import L from "leaflet";
import { FlatMapLayer } from "./FlatMapLayer";

/**
 * BaseMapLayer - FlatMapLayer implementation for base tile layer
 * Manages OpenStreetMap tiles as a composable layer
 */
export class BaseMapLayer extends FlatMapLayer<L.TileLayer> {
  /**
   * Render the tile layer
   */
  protected renderLayer(): L.TileLayer {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    });
  }
}
