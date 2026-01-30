import React, { useEffect, useRef, ReactElement } from "react";
import { useLocation } from "../context/LocationContext";
import {
  Viewer3D,
  Viewer3DEarthLayer,
  Viewer3DMarkerLayer,
  MouseDragHandler,
  MouseClickHandler,
  MouseWheelHandler,
  ResizeHandler,
  CoordinateConverter,
  AnimationController,
} from "../utils/3dviewer";

/**
 * EarthViewer Component
 *
 * Renders a full-screen interactive 3D Earth using Three.js with the following features:
 * - Textured sphere with NASA Blue Marble texture
 * - Mouse drag rotation (X/Y axes)
 * - Mouse wheel zoom (1.5 to 5 units from center)
 * - Click-to-focus with raycasting
 * - Smooth animation when location changes (from MapCard)
 * - Red focus marker showing the currently selected location
 * - Window resize handling
 * - Bidirectional synchronization with MapCard via LocationContext
 *
 * The component manages three React effects:
 * 1. Initialization: Sets up Viewer3D, layers, and event handlers
 * 2. Marker updates: Positions the focus marker when location context changes
 * 3. Earth rotation animation: Smoothly rotates Earth when location updates from map
 *    (unless user is actively dragging)
 */
const EarthViewer = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const markerLayerRef = useRef<Viewer3DMarkerLayer | null>(null);
  const earthLayerRef = useRef<Viewer3DEarthLayer | null>(null);
  const dragHandlerRef = useRef<MouseDragHandler | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  const { location, setFocusedLocation } = useLocation();

  /**
   * Initialize Viewer3D with all scene components and handlers.
   * Creates the renderer, Earth layer, marker layer, and attaches event handlers:
   * - Drag handler: Updates Earth rotation and syncs location to context
   * - Click handler: Sets location to clicked point via raycasting
   * - Wheel handler: Adjusts camera zoom distance
   * - Resize handler: Updates camera aspect ratio on window resize
   * Cleanup disposes all resources on unmount.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer3D();
    const scene = viewer.scene;

    const earthLayer = new Viewer3DEarthLayer();
    scene.addItem(earthLayer);

    const markerLayer = new Viewer3DMarkerLayer();
    scene.addItem(markerLayer);

    // Initialize with DOM container - starts renderer and render loop
    viewer.init(containerRef.current);

    // Add event handlers with callbacks that update context
    dragHandlerRef.current = new MouseDragHandler(
      (deltaX, deltaY) => {
        // Update Earth rotation from drag
        const earth = earthLayer.getEarthMesh();
        if (earth) {
          earth.rotation.y += deltaX * 0.005;
          earth.rotation.x += deltaY * 0.005;

          // Convert to lat/lng and update context
          const [lat, lng] = CoordinateConverter.earthRotationToLatLng(
            earth.rotation.x,
            earth.rotation.y
          );
          setFocusedLocation(lat, lng);
        }
      },
      () => {
        // On drag end - nothing special needed
      }
    );
    viewer.addEventHandler(dragHandlerRef.current);

    viewer.addEventHandler(
      new MouseClickHandler((lat, lng) => {
        setFocusedLocation(lat, lng);
      })
    );

    viewer.addEventHandler(
      new MouseWheelHandler((delta) => {
        viewer.camera.updateZoom(delta);
      })
    );

    viewer.addEventHandler(
      new ResizeHandler((width, height) => {
        viewer.camera.updateAspectRatio(width, height);
        viewer.renderer.handleResize();
      })
    );

    viewerRef.current = viewer;
    earthLayerRef.current = earthLayer;
    markerLayerRef.current = markerLayer;

    return () => {
      viewerRef.current?.dispose();
      viewerRef.current = null;
      earthLayerRef.current = null;
      markerLayerRef.current = null;
    };
  }, [setFocusedLocation]);

  /**
   * Update marker position when location context changes.
   * This keeps the red focus marker on the 3D Earth synchronized with the current location.
   */
  useEffect(() => {
    markerLayerRef.current?.setPosition(location.latitude, location.longitude);
  }, [location]);

  /**
   * Animate Earth rotation when location changes externally (from MapCard).
   * Calculates target rotation from new lat/lng, then animates from current rotation
   * over 500ms using AnimationController.
   * Skips animation if user is actively dragging the Earth.
   * Previous animation is disposed and replaced with the new one.
   */
  useEffect(() => {
    if (!earthLayerRef.current || dragHandlerRef.current?.isDraggingNow())
      return;

    const targetRotation = CoordinateConverter.latLngToEarthRotation(
      location.latitude,
      location.longitude
    );
    const currentRotation = earthLayerRef.current.getRotation();

    animationControllerRef.current?.dispose();
    animationControllerRef.current = new AnimationController();
    animationControllerRef.current.startAnimation(
      currentRotation,
      targetRotation,
      500,
      (rotation) => {
        const earth = earthLayerRef.current?.getEarthMesh();
        if (earth) {
          earth.rotation.copy(rotation);
        }
      }
    );

    return () => {
      animationControllerRef.current?.dispose();
    };
  }, [location]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
