import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';

interface WorkflowNodeProps {
  id: string;
  x: number;
  y: number;
  text: string;
  type: string;
  systemPrompt?: string;
  temperature?: number;
  connections: string[];
  role?: string;
  output?: string;
  isProcessing?: boolean;
  isCompleted?: boolean;
  scale?: number;
  color?: string;
  isDraggable?: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onSettingsClick?: () => void;
  onClick?: () => void;
}

const getNodeStyle = (type: string, isProcessing?: boolean, color?: string) => {
  const baseStyle = {
    fill: '#ffffff',
    stroke: color || '#2D9CDB',
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOpacity: 0.1,
    cornerRadius: 8,
  };

  if (isProcessing) {
    return {
      ...baseStyle,
      shadowColor: color || '#2D9CDB',
      shadowBlur: 15,
      shadowOpacity: 0.3,
    };
  }

  return baseStyle;
};

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  id,
  x,
  y,
  text,
  type,
  systemPrompt,
  temperature,
  connections,
  role,
  output,
  isProcessing,
  isCompleted,
  scale = 1,
  color,
  isDraggable = true,
  onDragEnd,
  onSettingsClick,
  onClick
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const style = getNodeStyle(type, isProcessing, color);
  const fontSize = {
    title: Math.max(10, 14 * scale),
    output: Math.max(8, 12 * scale),
    role: Math.max(7, 10 * scale)
  };

  // Format output text to prevent overlap
  const formatOutput = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    const maxLines = Math.max(1, Math.floor(3 * scale));
    
    if (lines.length > maxLines) {
      if (maxLines === 1) {
        return `${lines[0].substring(0, 20)}...`;
      }
      return `${lines[0]}\n...\n${lines[lines.length - 1]}`;
    }
    return text;
  };

  const handleDragStart = (e: any) => {
    if (!isDraggable) return;
    
    // Stop event from bubbling up to stage
    e.cancelBubble = true;
    
    setIsDragging(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Store the initial position in stage coordinates
    setDragStartPos({
      x: pos.x,
      y: pos.y
    });
  };

  const handleDragMove = (e: any) => {
    if (!isDraggable || !isDragging) return;
    // Stop event from bubbling up to stage
    e.cancelBubble = true;
  };

  const handleDragEnd = (e: any) => {
    if (!isDraggable || !isDragging) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos || !onDragEnd) return;

    // Calculate distance moved in stage coordinates
    const dx = pos.x - dragStartPos.x;
    const dy = pos.y - dragStartPos.y;

    // If barely moved, treat as a click
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      onClick?.();
      setIsDragging(false);
      return;
    }

    // Convert movement to world coordinates
    const worldDx = dx / stage.scaleX();
    const worldDy = dy / stage.scaleY();

    onDragEnd(id, x + worldDx, y + worldDy);
    setIsDragging(false);
  };

  return (
    <Group
      x={x}
      y={y}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {/* Main node body */}
      <Rect
        width={150}
        height={80}
        {...style}
      />

      {/* Title */}
      <Text
        text={text}
        width={150}
        height={20}
        align="center"
        verticalAlign="middle"
        fontSize={fontSize.title}
        fill="#333333"
        y={5}
      />

      {/* Role (if exists) */}
      {role && (
        <Text
          text={role}
          width={150}
          height={15}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize.role}
          fill="#666666"
          y={25}
        />
      )}

      {/* Output */}
      {output && (
        <Text
          text={formatOutput(output)}
          width={150}
          height={35}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize.output}
          fill="#333333"
          y={40}
        />
      )}

      {/* Settings button */}
      {onSettingsClick && (
        <Group
          x={130}
          y={5}
          onClick={(e) => {
            e.cancelBubble = true;
            onSettingsClick();
          }}
        >
          <Rect
            width={15}
            height={15}
            fill="#f0f0f0"
            cornerRadius={3}
          />
          <Text
            text="⚙️"
            width={15}
            height={15}
            fontSize={10}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
};

export default WorkflowNode;