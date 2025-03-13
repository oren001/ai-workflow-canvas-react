import React from 'react';
import { Line } from 'react-konva';

interface ConnectionProps {
  points: number[];
  isActive?: boolean;
  color?: string;
  onClick?: () => void;
}

const Connection: React.FC<ConnectionProps> = ({ 
  points, 
  isActive = false,
  color = '#2D9CDB',
  onClick 
}) => {
  if (points.length < 8) return null; // We need 8 points for a bezier curve

  return (
    <Line
      points={points}
      stroke={color}
      strokeWidth={isActive ? 3 : 2}
      opacity={isActive ? 1 : 0.6}
      onClick={onClick}
      hitStrokeWidth={20}
      shadowColor={isActive ? color : undefined}
      shadowBlur={isActive ? 10 : 0}
      shadowOpacity={0.5}
      lineCap="round"
      lineJoin="round"
      bezier={true} // Enable bezier curve rendering
      tension={0.5} // Add some tension to make the curve smoother
      perfectDrawEnabled={true} // Improve line rendering quality
      listening={true} // Enable mouse events
    />
  );
};

export default Connection;