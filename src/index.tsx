/**
 * Application Entry Point
 *
 * Initializes React application by:
 * 1. Creating React root on #root DOM element
 * 2. Rendering App component with LocationProvider context
 * 3. Loading global CSS styles
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
