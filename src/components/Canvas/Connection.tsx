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
  if (points.length < 4) return null;

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
    />
  );
};

export default Connection;