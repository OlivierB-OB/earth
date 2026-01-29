import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLocation } from "../context/LocationContext";

const EarthViewer = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const earthRef = useRef(null);
  const cameraRef = useRef(null);
  const focusMarkerRef = useRef(null);
  const lastInteractionTimeRef = useRef(0);
  const { location, setFocusedLocation } = useLocation();

  const isUserDraggingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Earth sphere
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Load NASA Blue Marble Earth texture from CORS-enabled CDN
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "https://cdn.jsdelivr.net/npm/three-globe@2.29.4/example/img/earth-day.jpg",
    );

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 5,
    });

    const earth = new THREE.Mesh(geometry, material);
    earth.rotation.z = 0.3;
    scene.add(earth);
    earthRef.current = earth;

    // Create focus marker (small sphere at focused location)
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const focusMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    focusMarker.position.z = 1.05; // Slightly above Earth surface
    scene.add(focusMarker);
    focusMarkerRef.current = {
      mesh: focusMarker,
      geometry: markerGeometry,
      material: markerMaterial,
    };

    // Mouse controls for rotation and clicking
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      isDragging = true;
      isUserDraggingRef.current = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      lastInteractionTimeRef.current = Date.now();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earth.rotation.y += deltaX * 0.005;
      earth.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
      lastInteractionTimeRef.current = Date.now();

      // Update focused location to the center of screen based on Earth rotation
      updateFocusLocationFromEarthRotation();
    };

    const updateFocusLocationFromEarthRotation = () => {
      // The center of the screen points to the center of the Earth's visible face
      // We need to convert Earth's rotation to lat/lon coordinates
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
        -earth.rotation,
      );

      // Vector pointing from Earth center outward (initially forward)
      const centerVector = new THREE.Vector3(0, 0, 1);
      centerVector.applyMatrix4(rotationMatrix);

      // Convert to lat/lon
      const latitude = Math.asin(centerVector.y) * (180 / Math.PI);
      const longitude =
        Math.atan2(centerVector.x, centerVector.z) * (180 / Math.PI);

      setFocusedLocation(latitude, longitude);
    };

    const onMouseUp = (e) => {
      isDragging = false;
      isUserDraggingRef.current = false;

      // Check if it was a click (not a drag)
      const deltaX = Math.abs(e.clientX - previousMousePosition.x);
      const deltaY = Math.abs(e.clientY - previousMousePosition.y);

      if (deltaX < 5 && deltaY < 5) {
        // Convert mouse position to normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycasting to find intersection with Earth
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earth);

        if (intersects.length > 0) {
          const point = intersects[0].point;
          // Normalize to get coordinates on unit sphere
          const normalized = point.normalize();

          // Convert Cartesian to lat/lon
          const latitude = Math.asin(normalized.y) * (180 / Math.PI);
          const longitude =
            Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);

          setFocusedLocation(latitude, longitude);
        }
      }
    };

    // Mouse wheel zoom
    const onMouseWheel = (e) => {
      e.preventDefault();

      const zoomSpeed = 0.1;
      const direction = e.deltaY > 0 ? 1 : -1;

      camera.position.z += direction * zoomSpeed;
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onMouseWheel, {
      passive: false,
    });

    // Handle window resize
    const onWindowResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", onWindowResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update focus marker position based on location context
      if (focusMarkerRef.current && location) {
        const lat = location.latitude * (Math.PI / 180);
        const lon = location.longitude * (Math.PI / 180);

        const radius = 1.05;
        const x = radius * Math.cos(lat) * Math.sin(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.cos(lon);

        focusMarkerRef.current.mesh.position.set(x, y, z);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("wheel", onMouseWheel);
      containerRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      if (focusMarkerRef.current) {
        focusMarkerRef.current.geometry.dispose();
        focusMarkerRef.current.material.dispose();
      }
      renderer.dispose();
    };
  }, [setFocusedLocation, location]);

  // Rotate Earth to center on focused location when changed from map
  useEffect(() => {
    if (!earthRef.current || isUserDraggingRef.current) return;

    const lat = location.latitude * (Math.PI / 180);
    const lon = location.longitude * (Math.PI / 180);

    // Calculate target rotation to center this location on the front of the sphere
    // We want the location to appear at the center of the screen
    const targetRotationY = -lon;
    const targetRotationX = -lat;

    // Smooth animation
    const startRotationX = earthRef.current.rotation.x;
    const startRotationY = earthRef.current.rotation.y;
    const startTime = Date.now();
    const duration = 500; // ms

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (earthRef.current) {
        earthRef.current.rotation.x =
          startRotationX + (targetRotationX - startRotationX) * progress;
        earthRef.current.rotation.y =
          startRotationY + (targetRotationY - startRotationY) * progress;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [location]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
