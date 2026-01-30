import React, { useEffect, useRef, ReactElement } from "react";
import { useDrone, useDroneControls } from "../context/DroneContext";
import {
  Viewer3D,
  Viewer3DMarkerLayer,
  MouseWheelHandler,
  ResizeHandler,
} from "../utils/3dviewer";
import { Viewer3DTerrainLayer } from "../utils/3dviewer/Viewer3DTerrainLayer";
import { Viewer3DContextLayer } from "../utils/3dviewer/Viewer3DContextLayer";
import { KeyboardHandler } from "../utils/3dviewer/handlers/KeyboardHandler";
import { DataManager } from "../utils/dataManager/DataManager";
import { DroneController } from "../utils/droneController/DroneController";

/**
 * EarthViewer Component (now DroneViewer)
 *
 * Renders a first-person drone flight view using Three.js with the following features:
 * - 3D terrain and contextual objects (buildings, trees, landmarks) around the drone
 * - Fixed cockpit camera at drone position looking forward
 * - Keyboard control: WASD for movement, Space/Ctrl for altitude
 * - Mouse wheel for zoom (FOV adjustment)
 * - Dynamic data loading: terrain/objects load based on drone proximity (2km radius)
 * - Automatic cleanup of distant data to manage memory
 * - Window resize handling
 * - Bidirectional synchronization with MapCard via DroneContext
 *
 * The component manages React effects for:
 * 1. Initialization: Sets up Viewer3D, DataManager, DroneController, layers, and handlers
 * 2. Control input: Updates drone controls from keyboard input
 * 3. Drone update loop: Applies controls and updates drone position each frame
 * 4. Data and scene updates: Updates terrain/context layers when drone moves or data loads
 * 5. Marker position: Keeps the marker synchronized with drone position
 */
const EarthViewer = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const dataManagerRef = useRef<DataManager | null>(null);
  const droneControllerRef = useRef<DroneController | null>(null);
  const terrainLayerRef = useRef<Viewer3DTerrainLayer | null>(null);
  const contextLayerRef = useRef<Viewer3DContextLayer | null>(null);
  const markerLayerRef = useRef<Viewer3DMarkerLayer | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const { drone, setDroneState, setControls } = useDrone();
  const { controls } = useDroneControls();

  /**
   * Initialize Viewer3D, DataManager, DroneController, and all layers
   * Runs once on mount. Viewer3D persists for component lifetime.
   * Drone position updates happen via the update loop, not re-initialization.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    // Create main components
    const viewer = new Viewer3D();
    const scene = viewer.scene;
    const dataManager = new DataManager();

    // Add terrain and context layers FIRST (attach listeners before data load)
    const terrainLayer = new Viewer3DTerrainLayer(dataManager);
    terrainLayer.setDronePosition(drone.latitude, drone.longitude);
    scene.addItem(terrainLayer);

    const contextLayer = new Viewer3DContextLayer(dataManager);
    contextLayer.setDronePosition(drone.latitude, drone.longitude);
    scene.addItem(contextLayer);

    // Add marker layer for drone position
    const markerLayer = new Viewer3DMarkerLayer();
    scene.addItem(markerLayer);

    // Initialize viewer with DOM FIRST (this initializes the scene and subscribes layers to data changes)
    viewer.init(containerRef.current);

    // Load initial data AFTER viewer initialization (so subscribed layers receive the events)
    dataManager.updateDronePosition(drone.latitude, drone.longitude);
    console.log(
      "Initial data loaded:",
      dataManager.getLoadedBlocks().length,
      "blocks"
    );

    // Create drone controller with current drone state
    const droneController = new DroneController(drone, dataManager);

    // Add keyboard handler
    const keyboardHandler = new KeyboardHandler((droneControls) => {
      setControls(droneControls);
    });
    viewer.addEventHandler(keyboardHandler);

    // Add wheel handler for zoom
    viewer.addEventHandler(
      new MouseWheelHandler((delta) => {
        viewer.camera.updateZoom(delta * 5); // Adjust FOV
        viewer.renderer.markDirty(); // Mark dirty when camera changes
      })
    );

    // Add resize handler
    viewer.addEventHandler(
      new ResizeHandler((width, height) => {
        viewer.camera.updateAspectRatio(width, height);
        viewer.renderer.handleResize();
        viewer.renderer.markDirty(); // Mark dirty on resize
      })
    );

    // Store references
    viewerRef.current = viewer;
    dataManagerRef.current = dataManager;
    droneControllerRef.current = droneController;
    terrainLayerRef.current = terrainLayer;
    contextLayerRef.current = contextLayer;
    markerLayerRef.current = markerLayer;

    lastFrameTimeRef.current = Date.now();

    return () => {
      droneControllerRef.current?.stop();
      dataManagerRef.current?.dispose();
      viewerRef.current?.dispose();
      viewerRef.current = null;
      dataManagerRef.current = null;
      droneControllerRef.current = null;
      terrainLayerRef.current = null;
      contextLayerRef.current = null;
      markerLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Update loop: Apply drone controls and update position
   * Runs at a fixed rate and marks renderer dirty when state changes
   */
  useEffect(() => {
    if (!droneControllerRef.current || !viewerRef.current) return;

    let animationFrameId: number;
    let lastPositionLat = drone.latitude;
    let lastPositionLng = drone.longitude;

    const updateLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000; // seconds
      lastFrameTimeRef.current = now;

      // Update drone with current controls
      const newDroneState = droneControllerRef.current!.update(
        controls,
        deltaTime
      );

      // Check if position actually changed
      const positionChanged =
        newDroneState.latitude !== lastPositionLat ||
        newDroneState.longitude !== lastPositionLng;

      if (positionChanged) {
        // Update data manager to load/unload blocks based on new drone position
        // This triggers terrain/context layer updates via data change events
        dataManagerRef.current?.updateDronePosition(
          newDroneState.latitude,
          newDroneState.longitude
        );

        // Update drone position in layers (will be used for newly created meshes)
        terrainLayerRef.current?.setDronePosition(
          newDroneState.latitude,
          newDroneState.longitude
        );
        contextLayerRef.current?.setDronePosition(
          newDroneState.latitude,
          newDroneState.longitude
        );

        // Update camera to follow drone (drone is always at world origin)
        viewerRef.current!.camera.updatePositionForDrone(
          0,
          0,
          newDroneState.elevation
        );

        // Mark renderer dirty since scene and camera were updated
        viewerRef.current!.renderer.markDirty();

        lastPositionLat = newDroneState.latitude;
        lastPositionLng = newDroneState.longitude;
      }

      // Sync position to context (always, for UI updates)
      setDroneState({
        latitude: newDroneState.latitude,
        longitude: newDroneState.longitude,
        elevation: newDroneState.elevation,
        heading: newDroneState.heading,
      });

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [controls, setDroneState, drone.latitude, drone.longitude]);

  /**
   * Update marker position when drone position changes
   */
  useEffect(() => {
    markerLayerRef.current?.setPosition(drone.latitude, drone.longitude);
  }, [drone.latitude, drone.longitude]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
