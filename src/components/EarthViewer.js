import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const EarthViewer = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const earthRef = useRef(null);
  const cameraRef = useRef(null);

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

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earth.rotation.y += deltaX * 0.005;
      earth.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
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

      // Slight auto-rotation when not dragging
      if (!isDragging) {
        earth.rotation.y += 0.0001;
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
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default EarthViewer;
