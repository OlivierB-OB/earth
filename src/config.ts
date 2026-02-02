/**
 * Global configuration for the Earth Viewer application
 * Contains all magic numbers organized by feature area
 */

export const CONFIG = {
  // ============================================
  // CAMERA SETTINGS
  // ============================================
  CAMERA: {
    // Field of view and clipping planes
    FOV: 75,
    FOV_MIN: 30,
    FOV_MAX: 120,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1000000,

    // Default camera position (relative to origin)
    DEFAULT_POSITION_Y: 600,
    DEFAULT_POSITION_Z: 2000,

    // Camera offset from drone (for drone-following mode)
    DRONE_CAMERA_OFFSET_Y: 1, // 1 meter above drone
    DRONE_CAMERA_OFFSET_Z: 2, // 2 meters behind drone

    // Zoom sensitivity
    ZOOM_DELTA_SCALE: 10,
  },

  // ============================================
  // LIGHTING SETTINGS
  // ============================================
  LIGHTING: {
    // Ambient light
    AMBIENT_COLOR: 0xffffff,
    AMBIENT_INTENSITY: 0.6,

    // Directional light (sun)
    DIRECTIONAL_COLOR: 0xffffff,
    DIRECTIONAL_INTENSITY: 0.8,
    DIRECTIONAL_POSITION_X: 5,
    DIRECTIONAL_POSITION_Y: 3,
    DIRECTIONAL_POSITION_Z: 5,
  },

  // ============================================
  // EARTH RENDERING
  // ============================================
  EARTH: {
    // Sphere geometry segments (resolution)
    GEOMETRY_WIDTH_SEGMENTS: 64,
    GEOMETRY_HEIGHT_SEGMENTS: 64,

    // Material properties
    MATERIAL_SHININESS: 5,

    // Axial tilt (in radians, ~23.5 degrees)
    AXIAL_TILT_Z: 0.3,
  },

  // ============================================
  // DRONE PHYSICS & CONSTRAINTS
  // ============================================
  DRONE: {
    // Movement speed constraints (m/s)
    MAX_SPEED_HORIZONTAL: 30, // ~108 km/h
    MAX_SPEED_VERTICAL: 15,

    // Acceleration (m/s²)
    ACCELERATION: 10,

    // Damping/friction coefficients
    HORIZONTAL_DAMPING: 0.85,
    VERTICAL_DAMPING: 0.9,

    // Altitude constraints (meters)
    MIN_ELEVATION: 5,
    MAX_ELEVATION: 500,

    // Velocity threshold for heading updates
    VELOCITY_THRESHOLD: 0.1,

    // Default starting elevation
    DEFAULT_ELEVATION: 450,

    // Coordinate bounds
    LATITUDE_MIN: -90,
    LATITUDE_MAX: 90,

    // Heading normalization
    HEADING_NORMALIZE_360: 360,

    // Longitude normalization
    LONGITUDE_NORMALIZE_MOD: 360,
    LONGITUDE_NORMALIZE_CALC: 360,

    // Angle conversions
    DEGREES_TO_RADIANS_180: 180,
    RADIANS_TO_DEGREES_180: 180,

    // Propeller animation (time-based rotation speed)
    // 0.0003 rad/ms ≈ 0.3 rad/frame at 60 FPS (27 RPM)
    PROPELLER_ROTATION_SPEED: 0.0003,
  },

  // ============================================
  // TERRAIN GENERATION
  // ============================================
  TERRAIN: {
    // Geographic constants
    METERS_PER_DEGREE_LAT: 111,
    METERS_PER_DEGREE_LNG: 111,

    // Base elevation generation
    BASE_ELEVATION_OFFSET: 50,
    BASE_ELEVATION_LAT_FREQ: 0.05,
    BASE_ELEVATION_LAT_AMP: 100,
    BASE_ELEVATION_LNG_FREQ: 0.05,
    BASE_ELEVATION_LNG_AMP: 80,

    // Hill generation
    HILL_LAT_FREQ: 2,
    HILL_LNG_FREQ: 2,
    HILL_AMP: 60,

    // Feature generation
    FEATURE_LAT_LNG_FREQ: 1.5,
    FEATURE_AMP: 40,

    // Medium features
    MEDIUM_FEATURE_FREQ: 5,
    MEDIUM_FEATURE_LNG_FREQ: 5,
    MEDIUM_FEATURE_AMP: 20,

    // Detail generation
    DETAIL_FREQ: 3,
    DETAIL_AMP: 15,

    // Fine detail
    FINE_DETAIL_LAT_FREQ: 13,
    FINE_DETAIL_LNG_FREQ: 11,
    FINE_DETAIL_AMP: 5,

    // Elevation clamping
    ELEVATION_MIN: 0,
    ELEVATION_MAX: 500,
  },

  // ============================================
  // PROCEDURAL OBJECTS (BUILDINGS, TREES, LANDMARKS)
  // ============================================
  PROCEDURAL_OBJECTS: {
    // Building defaults
    BUILDING_WIDTH: 10,
    BUILDING_DEPTH: 10,
    BUILDING_HEIGHT: 20,
    BUILDING_COLOR_R: 0.7,
    BUILDING_COLOR_G: 0.7,
    BUILDING_COLOR_B: 0.7,

    // Tree trunk
    TREE_TRUNK_RADIUS_TOP: 0.5,
    TREE_TRUNK_RADIUS_BOTTOM: 0.8,
    TREE_TRUNK_HEIGHT_MULT: 0.3,
    TREE_TRUNK_SEGMENTS: 8,
    TREE_TRUNK_COLOR_R: 0.4,
    TREE_TRUNK_COLOR_G: 0.2,
    TREE_TRUNK_COLOR_B: 0,

    // Tree foliage
    TREE_FOLIAGE_WIDTH: 5,
    TREE_FOLIAGE_HEIGHT_MULT: 0.7,
    TREE_FOLIAGE_SEGMENTS: 8,
    TREE_FOLIAGE_COLOR_R: 0.2,
    TREE_FOLIAGE_COLOR_G: 0.5,
    TREE_FOLIAGE_COLOR_B: 0.1,
    TREE_FOLIAGE_POSITION_Y_MULT: 0.65,

    // Landmark (monument/POI)
    LANDMARK_WIDTH: 15,
    LANDMARK_DEPTH: 15,
    LANDMARK_HEIGHT: 50,
    LANDMARK_COLOR_R: 0.8, // Gold
    LANDMARK_COLOR_G: 0.6,
    LANDMARK_COLOR_B: 0.2,

    // Generic structure
    STRUCTURE_WIDTH: 8,
    STRUCTURE_DEPTH: 8,
    STRUCTURE_HEIGHT: 15,
    STRUCTURE_COLOR_R: 0.6,
    STRUCTURE_COLOR_G: 0.6,
    STRUCTURE_COLOR_B: 0.6,

    // Material emissive
    EMISSIVE_COLOR_R: 0.2,
    EMISSIVE_COLOR_G: 0.2,
    EMISSIVE_COLOR_B: 0.2,

    // Height division (for centering objects)
    HEIGHT_DIVISION: 2,
  },

  // ============================================
  // CONTEXTUAL DATA GENERATION
  // ============================================
  CONTEXT_DATA: {
    // Items per block
    ITEMS_PER_BLOCK_MIN: 5,
    ITEMS_PER_BLOCK_MAX: 15,

    // Hash/seed constants
    SEED_INCREMENT: 12345,
    COORDINATE_HASH_MULT: 1000,
    HASH_INITIAL_VALUE: 5381,
    HASH_SHIFT_LEFT: 5,
    SEEDED_RANDOM_MULT: 10000,

    // Item spawn probabilities
    LANDMARK_PROBABILITY: 0.1,

    // Landmark generation
    LANDMARK_HEIGHT_MIN: 30,
    LANDMARK_HEIGHT_RANGE: 40,

    // Building generation
    BUILDING_PROBABILITY: 0.3,
    BUILDING_HEIGHT_MIN: 10,
    BUILDING_HEIGHT_RANGE: 20,

    // Tree generation
    TREE_HEIGHT_MIN: 15,
    TREE_HEIGHT_RANGE: 20,

    // Item dimensions
    ITEM_WIDTH_MAX: 10,
    ITEM_WIDTH_OFFSET: 5,
    ITEM_DEPTH_MAX: 10,
    ITEM_DEPTH_OFFSET: 5,
  },

  // ============================================
  // DATA MANAGEMENT & STREAMING
  // ============================================
  DATA_MANAGEMENT: {
    // Chunk loading strategy (in meters)
    BLOCK_SIZE_M: 1000,
    LOAD_RADIUS_M: 2000,
    UNLOAD_DISTANCE_M: 2500,

    // Movement threshold for triggering updates (in meters)
    MOVEMENT_THRESHOLD_M: 100,
  },

  // ============================================
  // MAP & UI
  // ============================================
  MAP: {
    // Leaflet map initial zoom level
    INITIAL_ZOOM: 2,
  },

  UI: {
    // Floating card (map panel) styling
    CARD_BOTTOM_PX: 20,
    CARD_RIGHT_PX: 20,
    CARD_WIDTH_PX: 350,
    CARD_HEIGHT_PX: 300,
    CARD_BORDER_RADIUS_PX: 8,
    CARD_Z_INDEX: 100,

    // Card shadow
    CARD_SHADOW_OFFSET_X_PX: 0,
    CARD_SHADOW_OFFSET_Y_PX: 4,
    CARD_SHADOW_BLUR_PX: 12,
    CARD_SHADOW_SPREAD_PX: 0,
    CARD_SHADOW_OPACITY: 0.15,
  },

  // ============================================
  // INTERACTION & INPUT
  // ============================================
  INTERACTION: {
    // Mouse wheel zoom sensitivity
    ZOOM_SPEED_MULTIPLIER: 0.1,

    // Click/drag threshold
    CLICK_DRAG_THRESHOLD_PX: 5,

    // Zoom adjustment in EarthViewer
    ZOOM_ADJUSTMENT_MULTIPLIER: 5,
  },

  // ============================================
  // ANIMATION
  // ============================================
  ANIMATION: {
    // Progress threshold for completion
    PROGRESS_THRESHOLD: 1,
  },

  // ============================================
  // COORDINATE TRANSFORMS
  // ============================================
  COORDINATE_TRANSFORMS: {
    // Angle conversion constants
    RADIANS_TO_DEGREES: 180,
    DEGREES_TO_RADIANS: 180,

    // NDC (Normalized Device Coordinates) transforms
    NDC_SCALE: 2,
    NDC_OFFSET: 1,
  },
};
