# Earth Viewer

An interactive 3D and 2D Earth visualization web application built with React, Three.js, and Leaflet.

## Features

- **3D Earth Visualization**: Explore Earth as a textured 3D globe using Three.js
  - Drag to rotate the globe in all directions
  - Scroll to zoom in and out (1.5x to 5x magnification)
  - Auto-rotation when idle for a dynamic display

- **2D Interactive Map**: View Earth in 2D using Leaflet and OpenStreetMap tiles
  - Classic map perspective with OpenStreetMap base layer
  - Zoom and pan controls

- **Synchronized Views**: Seamless interaction between 3D and 2D perspectives
  - Click on the 3D globe to update the 2D map view
  - Click on the 2D map to update the 3D globe focus
  - Location markers stay synchronized across both views

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd earth
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server with hot reload:
```bash
npm start
# or
npm run dev
```

The application will open at `http://localhost:3000`

### Production Build

Build for production:
```bash
npm run build
```

Optimized files are output to the `dist/` directory.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` / `npm run dev` | Start dev server with hot reload (auto-opens browser) |
| `npm run build` | Create production build in `dist/` |
| `npm run type-check` | Run TypeScript type checker |
| `npm run type-watch` | Watch mode for TypeScript checking |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting without modifying |

## Project Architecture

### Component Structure

```
App (with LocationProvider)
├── EarthViewer (3D visualization)
└── Card
    └── MapCard (2D map in floating panel)
```

### Key Components

- **EarthViewer**: Full-screen 3D Earth using Three.js with interactive controls
- **MapCard**: Floating 2D map panel with Leaflet integration
- **Card**: Reusable floating UI container component
- **LocationContext**: Shared state management for synchronized location updates

### FlatMap Utility

The `FlatMap` utility class provides a clean abstraction over Leaflet functionality:
- Encapsulates map lifecycle management
- Implements composable layer pattern
- Manages resource cleanup and memory efficiency

## Technologies

- **React** 18.2.0: UI framework
- **Three.js** 0.182.0: 3D graphics rendering
- **Leaflet** 1.9.4: 2D mapping library
- **TypeScript** 5.9: Type-safe JavaScript
- **Webpack** 5: Module bundler
- **Babel**: JavaScript transpiler
- **ESLint** 9: Code linting
- **Prettier** 3: Code formatting

## Code Quality

The project maintains high code quality standards:

- **TypeScript**: Strict mode enabled with full type checking
- **ESLint**: Linting rules for both JavaScript and TypeScript
- **Prettier**: Automatic code formatting
- **Tests**: Run type checking and linting before deployment

## Project Structure

```
earth/
├── src/
│   ├── components/          # React components
│   │   ├── EarthViewer.tsx  # 3D Earth component
│   │   ├── MapCard.tsx      # 2D Map component
│   │   └── Card.tsx         # Container component
│   ├── context/             # React context
│   │   └── LocationContext.tsx
│   ├── utils/               # Utility classes
│   │   └── flatmap/         # Leaflet abstraction
│   ├── types/               # TypeScript type definitions
│   ├── styles.css           # Global styles
│   ├── index.tsx            # App entry point
│   └── App.tsx              # Root component
├── dist/                    # Production build output
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── webpack.config.js        # Webpack configuration
├── .prettierrc              # Prettier configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the project.
