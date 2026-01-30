import React, { useEffect, useRef, ReactElement } from "react";
import { useLocation } from "../context/LocationContext";
import { Viewer3D } from "../utils/3dviewer/Viewer3D";
import { Viewer3DEarthLayer } from "../utils/3dviewer/Viewer3DEarthLayer";
import { Viewer3DMarkerLayer } from "../utils/3dviewer/Viewer3DMarkerLayer";
import { MouseDragHandler } from "../utils/3dviewer/handlers/MouseDragHandler";
import { MouseClickHandler } from "../utils/3dviewer/handlers/MouseClickHandler";
import { MouseWheelHandler } from "../utils/3dviewer/handlers/MouseWheelHandler";
import { ResizeHandler } from "../utils/3dviewer/handlers/ResizeHandler";
import { CoordinateConverter } from "../utils/3dviewer/utils/CoordinateConverter";
import { AnimationController } from "../utils/3dviewer/utils/AnimationController";

const EarthViewer = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const markerLayerRef = useRef<Viewer3DMarkerLayer | null>(null);
  const earthLayerRef = useRef<Viewer3DEarthLayer | null>(null);
  const dragHandlerRef = useRef<MouseDragHandler | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  const { location, setFocusedLocation } = useLocation();

  // Initialize Viewer3D with all scene components and handlers
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
        if (viewer.camera) {
          viewer.camera.object.position.z = Math.max(
            1.5,
            Math.min(5, viewer.camera.object.position.z + delta)
          );
        }
      })
    );

    viewer.addEventHandler(
      new ResizeHandler((width, height) => {
        if (viewer.camera) {
          viewer.camera.object.aspect = width / height;
          viewer.camera.object.updateProjectionMatrix();
        }
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

  // Update marker position when location changes
  useEffect(() => {
    markerLayerRef.current?.setPosition(location.latitude, location.longitude);
  }, [location]);

  // Animate Earth rotation when location changes externally (from map)
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
