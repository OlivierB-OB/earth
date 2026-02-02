import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
} from "three";
import { Viewer3DSceneItem } from "./Viewer3DSceneItem";
import type { IViewer3DScene } from "./IViewer3DScene";
import type { DroneState } from "../../types/Drone";
import { CONFIG } from "../../config";

/**
 * Viewer3DDroneLayer: Renders a 3D quadcopter drone in the scene
 *
 * Features:
 * - Quadcopter design: fuselage, 4 cross-boom arms, 4 propellers, landing gear
 * - Positioned at world origin (where terrain and camera align)
 * - Updates heading rotation based on drone state
 * - Continuously rotates propellers for visual feedback
 *
 * The drone is positioned at origin but typically not visible in cockpit view
 * (positioned below/behind camera offset). Visible in external views.
 */
export class Viewer3DDroneLayer extends Viewer3DSceneItem<Group> {
  private droneState: DroneState | null = null;
  private fuselageGroup: Group | null = null;
  private propellerGroups: Group[] = [];
  private propellerStartTime: number = 0; // milliseconds since initialization
  private elapsedTime: number = 0; // milliseconds

  constructor(droneState: DroneState) {
    super();
    this.droneState = droneState;
  }

  /**
   * Initialize the drone layer
   */
  override init(scene: IViewer3DScene): void {
    super.init(scene);

    // Initialize time tracking
    this.propellerStartTime = Date.now();
    this.elapsedTime = 0;

    // Initial render to create the mesh
    this.render();
  }

  /**
   * Update drone state reference (called from parent component during animation loop)
   */
  setDroneState(droneState: DroneState): void {
    this.droneState = droneState;
  }

  /**
   * Update elapsed time for propeller animation (time-based, not frame-based)
   * Called from parent component's animation loop with deltaTime in seconds
   */
  updateTime(deltaTimeMs: number): void {
    this.elapsedTime += deltaTimeMs;
  }

  /**
   * Create the complete quadcopter drone mesh
   */
  protected makeObject(): Group {
    const droneGroup = new Group();

    // Create fuselage (main body)
    const fuselage = this.createFuselage();
    droneGroup.add(fuselage);
    this.fuselageGroup = fuselage;

    // Create 4 cross-boom arms with propellers at the tips
    const armPositions = [
      { x: 1, z: 1, name: "front-right" }, // Front-right
      { x: -1, z: 1, name: "front-left" }, // Front-left
      { x: 1, z: -1, name: "rear-right" }, // Rear-right
      { x: -1, z: -1, name: "rear-left" }, // Rear-left
    ];

    this.propellerGroups = [];

    armPositions.forEach((pos) => {
      const arm = this.createArm(pos.x, pos.z);
      droneGroup.add(arm);

      const propellerGroup = this.createPropeller(pos.x * 8.5, pos.z * 8.5);
      droneGroup.add(propellerGroup);
      this.propellerGroups.push(propellerGroup);
    });

    // Create landing gear (4 support legs at corners of fuselage)
    const gearPositions = [
      { x: 1.5, z: 3 },
      { x: -1.5, z: 3 },
      { x: 1.5, z: -3 },
      { x: -1.5, z: -3 },
    ];

    gearPositions.forEach((pos) => {
      const gear = this.createLandingGear(pos.x, pos.z);
      droneGroup.add(gear);
    });

    return droneGroup;
  }

  /**
   * Create fuselage (main body of drone)
   * White/aluminum colored rectangular box
   */
  private createFuselage(): Group {
    const fuselageGroup = new Group();

    // Main fuselage body: 4m wide, 8m long, 2m tall
    const fuselageGeometry = new BoxGeometry(4, 2, 8);
    const fuselageMaterial = new MeshPhongMaterial({
      color: 0xcccccc, // White/aluminum
      emissive: 0x333333,
      shininess: 100,
    });
    const fuselageMesh = new Mesh(fuselageGeometry, fuselageMaterial);
    fuselageGroup.add(fuselageMesh);

    return fuselageGroup;
  }

  /**
   * Create a boom arm extending from fuselage
   * Arms are positioned at 45-degree angles in cross pattern
   */
  private createArm(xDir: number, zDir: number): Group {
    const armGroup = new Group();

    // Calculate angle for 45-degree positioning (π/4 radians)
    const armLength = 8;
    const angle = Math.PI / 4;
    const xOffset = xDir * armLength * Math.cos(angle);
    const zOffset = zDir * armLength * Math.cos(angle);

    // Arm cylinder
    const armGeometry = new CylinderGeometry(0.3, 0.3, armLength, 8);
    const armMaterial = new MeshPhongMaterial({
      color: 0x333333, // Matte black
    });
    const armMesh = new Mesh(armGeometry, armMaterial);

    // Position and rotate arm
    armMesh.position.set(xOffset / 2, 0, zOffset / 2);
    // Rotate to align along XZ axis (not Y)
    armMesh.rotation.x = xDir !== 0 ? Math.PI / 2 : 0;
    armMesh.rotation.z = xDir === 0 ? Math.PI / 2 : 0;

    armGroup.add(armMesh);

    return armGroup;
  }

  /**
   * Create a propeller at arm tip
   * Thin rectangular blades that will rotate on Z-axis
   */
  private createPropeller(xPos: number, zPos: number): Group {
    const propellerGroup = new Group();
    propellerGroup.position.set(xPos, 0, zPos);

    // Propeller blade (thin box): 0.5m wide, 15m long, 0.2m thick
    const propellerGeometry = new BoxGeometry(0.5, 0.2, 15);
    const propellerMaterial = new MeshBasicMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0.6,
    });
    const propellerMesh = new Mesh(propellerGeometry, propellerMaterial);
    propellerGroup.add(propellerMesh);

    return propellerGroup;
  }

  /**
   * Create landing gear support leg
   * Simple vertical support at fuselage corner
   */
  private createLandingGear(xPos: number, zPos: number): Group {
    const gearGroup = new Group();
    gearGroup.position.set(xPos, -1, zPos);

    // Gear leg: thin vertical cylinder
    const gearGeometry = new CylinderGeometry(0.15, 0.15, 2, 6);
    const gearMaterial = new MeshPhongMaterial({
      color: 0x222222, // Black
    });
    const gearMesh = new Mesh(gearGeometry, gearMaterial);
    gearMesh.position.y = -0.5;
    gearGroup.add(gearMesh);

    return gearGroup;
  }

  /**
   * Update drone heading rotation and propeller animation
   * Called once per render frame
   */
  override render(): void {
    // Create mesh if it doesn't exist yet
    if (!this._object) {
      super.render();
    }

    // Get current drone heading from state and update rotation
    if (this.droneState && this._object) {
      const heading = this.droneState.heading ?? 0;
      const headingRadians = (heading * Math.PI) / 180;

      // Update drone Y-axis rotation based on heading
      // Heading: 0° = North, 90° = East, 180° = South, 270° = West
      this._object.rotation.y = headingRadians;
    }

    // Animate propellers
    this.animatePropellers();
  }

  /**
   * Rotate all propellers based on elapsed time (time-based, not frame-based)
   * Frame-rate independent propeller rotation
   */
  private animatePropellers(): void {
    // Calculate propeller angle from elapsed time
    const rotationSpeed = CONFIG.DRONE.PROPELLER_ROTATION_SPEED; // radians per millisecond
    const propellerAngle = (this.elapsedTime * rotationSpeed) % (Math.PI * 2);

    // Apply rotation to all propellers
    this.propellerGroups.forEach((propeller) => {
      propeller.rotation.z = propellerAngle;
    });
  }

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    if (this.fuselageGroup) {
      this.fuselageGroup = null;
    }
    this.propellerGroups = [];
    this.droneState = null;
    super.dispose();
  }
}
