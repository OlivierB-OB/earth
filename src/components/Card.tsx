import React, { ReactNode } from "react";

interface CardProps {
  /** Child components to render inside the card */
  children: ReactNode;
}

/**
 * Card Component
 *
 * Reusable container component for floating UI panels.
 * Positions content in a fixed box at the bottom-right corner with styling:
 * - 350x300px dimensions
 * - White background with rounded corners and shadow
 * - Z-index 100 (above main content)
 * - Handles overflow with hidden
 */
const Card = ({ children }: CardProps): React.ReactElement => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "350px",
        height: "300px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

export default Card;
