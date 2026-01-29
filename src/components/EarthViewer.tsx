import React, { useEffect, useRef, ReactElement } from "react";
import * as THREE from "three";
import { useLocation } from "../context/LocationContext";
import { Viewer3D } from "../utils/3dviewer/Viewer3D";
import { Viewer3DScene } from "../utils/3dviewer/Viewer3DScene";
import { Viewer3DCameraComponent } from "../utils/3dviewer/Viewer3DCameraComponent";
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
  const viewer3DRef = useRef<Viewer3D | null>(null);
  const markerLayerRef = useRef<Viewer3DMarkerLayer | null>(null);
  const earthLayerRef = useRef<Viewer3DEarthLayer | null>(null);
  const dragHandlerRef = useRef<MouseDragHandler | null>(null);
  const animationControllerRef = useRef<AnimationController | null>(null);
  const { location, setFocusedLocation } = useLocation();

  // Initialize Viewer3D with all scene components and handlers
  useEffect(() => {
    if (!containerRef.current) return;

    viewer3DRef.current = new Viewer3D();

    // Add scene components to the viewer
    viewer3DRef.current.addSceneComponent(new Viewer3DScene());
    viewer3DRef.current.addSceneComponent(new Viewer3DCameraComponent());

    earthLayerRef.current = new Viewer3DEarthLayer();
    viewer3DRef.current.addSceneComponent(earthLayerRef.current);

    markerLayerRef.current = new Viewer3DMarkerLayer();
    viewer3DRef.current.addSceneComponent(markerLayerRef.current);

    // Add event handlers with callbacks that update context
    dragHandlerRef.current = new MouseDragHandler(
      (deltaX, deltaY) => {
        // Update Earth rotation from drag
        const earth = earthLayerRef.current?.getEarthMesh();
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
    viewer3DRef.current.addEventHandler(dragHandlerRef.current);

    viewer3DRef.current.addEventHandler(
      new MouseClickHandler((lat, lng) => {
        setFocusedLocation(lat, lng);
      })
    );

    viewer3DRef.current.addEventHandler(
      new MouseWheelHandler((delta) => {
        const camera = viewer3DRef.current?.getCamera();
        if (camera && camera instanceof THREE.PerspectiveCamera) {
          camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + delta));
        }
      })
    );

    viewer3DRef.current.addEventHandler(
      new ResizeHandler((width, height) => {
        const camera = viewer3DRef.current?.getCamera();
        if (camera && camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      })
    );

    // Initialize with DOM container - starts renderer and render loop
    viewer3DRef.current.init(containerRef.current);

    return () => {
      viewer3DRef.current?.dispose();
      viewer3DRef.current = null;
    };
  }, [setFocusedLocation]);

  // Update marker position when location changes
  useEffect(() => {
    markerLayerRef.current?.setPosition(location.latitude, location.longitude);
  }, [location]);

  // Animate Earth rotation when location changes externally (from map)
  useEffect(() => {
    if (!earthLayerRef.current || dragHandlerRef.current?.isDraggingNow()) return;

    const targetRotation = CoordinateConverter.latLngToEarthRotation(
      location.latitude,
      location.longitude
    );
    const currentRotation = earthLayerRef.current.getRotation();

    animationControllerRef.current?.dispose();
    animationControllerRef.current = new AnimationController();
    animationControllerRef.current.startAnimation(currentRotation, targetRotation, 500, (rotation) => {
      const earth = earthLayerRef.current?.getEarthMesh();
      if (earth) {
        earth.rotation.copy(rotation);
      }
    });

    return () => {
      animationControllerRef.current?.dispose();
    };
  }, [location]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
