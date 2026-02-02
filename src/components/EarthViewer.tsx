import React, { useEffect, useRef, ReactElement } from "react";
import { CONFIG } from "../config";
import { useDrone, useDroneControls } from "../context/DroneContext";
import { Viewer3D, MouseWheelHandler, ResizeHandler } from "../utils/3dviewer";
import { Viewer3DTerrainLayer } from "../utils/3dviewer/Viewer3DTerrainLayer";
import { Viewer3DContextLayer } from "../utils/3dviewer/Viewer3DContextLayer";
import { Viewer3DDroneLayer } from "../utils/3dviewer/Viewer3DDroneLayer";
import { KeyboardHandler } from "../utils/3dviewer/handlers/KeyboardHandler";
import { DataManager } from "../utils/dataManager/DataManager";
import { DroneController } from "../utils/droneController/DroneController";
import { ChangeTracker } from "../utils/3dviewer/ChangeTracker";

/**
 * EarthViewer Component (now DroneViewer)
 *
 * Renders a first-person drone flight view using Three.js with the following features:
 * - 3D terrain and contextual objects (buildings, trees, landmarks) around the drone
 * - Fixed cockpit camera at drone position looking forward
 * - Keyboard control: WASD for movement, Space/Ctrl for altitude
 * - Mouse wheel for zoom (FOV adjustment)
 * - Dynamic data loading: terrain/objects load based on drone proximity (2000 meter radius)
 * - Automatic cleanup of distant data to manage memory
 * - Window resize handling
 * - Bidirectional synchronization with MapCard via DroneContext
 *
 * The component manages React effects for:
 * 1. Initialization: Sets up Viewer3D, DataManager, DroneController, layers, and handlers
 * 2. Control input: Updates drone controls from keyboard input
 * 3. Drone update loop: Applies controls and updates drone position each frame
 * 4. Data and scene updates: Updates terrain/context layers when drone moves or data loads
 */
const EarthViewer = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const dataManagerRef = useRef<DataManager | null>(null);
  const droneControllerRef = useRef<DroneController | null>(null);
  const terrainLayerRef = useRef<Viewer3DTerrainLayer | null>(null);
  const contextLayerRef = useRef<Viewer3DContextLayer | null>(null);
  const droneLayerRef = useRef<Viewer3DDroneLayer | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const changeTrackerRef = useRef<ChangeTracker | null>(null);

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
    changeTrackerRef.current = new ChangeTracker();

    // Add terrain and context layers FIRST (attach listeners before data load)
    const terrainLayer = new Viewer3DTerrainLayer(dataManager);
    terrainLayer.setDronePosition(drone.latitude, drone.longitude);
    scene.addItem(terrainLayer);

    const contextLayer = new Viewer3DContextLayer(dataManager);
    contextLayer.setDronePosition(drone.latitude, drone.longitude);
    scene.addItem(contextLayer);

    // Add drone layer
    const droneLayer = new Viewer3DDroneLayer(drone);
    scene.addItem(droneLayer);

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
        viewer.camera.updateZoom(
          delta * CONFIG.INTERACTION.ZOOM_ADJUSTMENT_MULTIPLIER
        );
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
    droneLayerRef.current = droneLayer;

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
      droneLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Update loop: Apply drone controls and update position
   * Renders only when drone/camera state changes (event-driven rendering)
   */
  useEffect(() => {
    if (
      !droneControllerRef.current ||
      !viewerRef.current ||
      !changeTrackerRef.current
    )
      return;

    let animationFrameId: number;
    let lastPositionLat = drone.latitude;
    let lastPositionLng = drone.longitude;

    const updateLoop = () => {
      if (!changeTrackerRef.current) return;

      const now = Date.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000; // seconds
      const deltaTimeMs = deltaTime * 1000; // milliseconds
      lastFrameTimeRef.current = now;

      // 1. Update drone physics (always runs)
      const newDroneState = droneControllerRef.current!.update(
        controls,
        deltaTime
      );

      // 2. Update propeller animation (time-based, frame-rate independent)
      droneLayerRef.current?.updateTime(deltaTimeMs);

      // 3. Prepare camera state for change detection
      const newCameraState = {
        position: viewerRef.current!.camera.object.position.clone(),
        fov: viewerRef.current!.camera.object.fov,
      };

      // 4. Update camera position (prepare for potential render)
      viewerRef.current!.camera.updatePositionForDrone(
        0,
        0,
        newDroneState.elevation,
        newDroneState.heading ?? 0
      );

      // 5. Check if position changed for data loading (threshold-based, not change-tracked)
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

        lastPositionLat = newDroneState.latitude;
        lastPositionLng = newDroneState.longitude;
      }

      // 6. Update drone layer state (heading rotation)
      droneLayerRef.current?.setDroneState(newDroneState);
      droneLayerRef.current?.render();

      // 7. Detect meaningful changes and render only if needed
      const changes = changeTrackerRef.current.detectChanges(
        newDroneState,
        newCameraState
      );

      if (
        changes.positionChanged ||
        changes.headingChanged ||
        changes.cameraChanged
      ) {
        viewerRef.current!.renderer.markDirty();
      }

      // 8. Sync position to context (always, for UI updates)
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
  }, [
    controls,
    setDroneState,
    drone.latitude,
    drone.longitude,
    changeTrackerRef,
  ]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
