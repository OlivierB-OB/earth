import React, { ReactNode } from "react";
import { CONFIG } from "../config";

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
  const shadowColor = `rgba(0, 0, 0, ${CONFIG.UI.CARD_SHADOW_OPACITY})`;
  const boxShadow = `${CONFIG.UI.CARD_SHADOW_OFFSET_X_PX}px ${CONFIG.UI.CARD_SHADOW_OFFSET_Y_PX}px ${CONFIG.UI.CARD_SHADOW_BLUR_PX}px ${CONFIG.UI.CARD_SHADOW_SPREAD_PX}px ${shadowColor}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: `${CONFIG.UI.CARD_BOTTOM_PX}px`,
        right: `${CONFIG.UI.CARD_RIGHT_PX}px`,
        width: `${CONFIG.UI.CARD_WIDTH_PX}px`,
        height: `${CONFIG.UI.CARD_HEIGHT_PX}px`,
        backgroundColor: "white",
        borderRadius: `${CONFIG.UI.CARD_BORDER_RADIUS_PX}px`,
        boxShadow,
        zIndex: CONFIG.UI.CARD_Z_INDEX,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

export default Card;
