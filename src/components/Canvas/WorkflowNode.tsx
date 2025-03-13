import React, { useState, useCallback } from 'react';
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
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);
  
  const style = getNodeStyle(type, isProcessing, color);
  
  const fontSize = {
    title: Math.max(10, 14 * scale),
    output: Math.max(8, 12 * scale),
    role: Math.max(7, 10 * scale)
  };

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

  const handleDragStart = useCallback((e: any) => {
    if (!isDraggable) return;
    e.cancelBubble = true;
    setIsDragging(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (pos) {
      setDragStartPos({
        x: pos.x,
        y: pos.y
      });
    }
  }, [isDraggable]);

  const handleDragMove = useCallback((e: any) => {
    if (!isDraggable || !isDragging) return;
    e.cancelBubble = true;
  }, [isDraggable, isDragging]);

  const handleDragEnd = useCallback((e: any) => {
    if (!isDraggable || !isDragging) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos || !onDragEnd) return;

    const dx = pos.x - dragStartPos.x;
    const dy = pos.y - dragStartPos.y;

    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      onClick?.();
      setIsDragging(false);
      return;
    }

    const worldDx = dx / stage.scaleX();
    const worldDy = dy / stage.scaleY();

    onDragEnd(id, x + worldDx, y + worldDy);
    setIsDragging(false);
  }, [isDraggable, isDragging, dragStartPos, onDragEnd, onClick, id, x, y]);

  return (
    <Group
      x={x}
      y={y}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <Rect
        width={150}
        height={80}
        {...style}
        shadowEnabled={true}
      />

      <Text
        text={text}
        width={150}
        height={20}
        align="center"
        verticalAlign="middle"
        fontSize={fontSize.title}
        fontStyle="bold"
        fill="#1a1a1a"
        y={5}
      />

      {role && (
        <Group>
          <Rect
            width={100}
            height={16}
            x={25}
            y={25}
            fill={color || '#2D9CDB'}
            opacity={0.1}
            cornerRadius={8}
          />
          <Text
            text={role}
            width={100}
            height={16}
            x={25}
            align="center"
            verticalAlign="middle"
            fontSize={fontSize.role}
            fill={color || '#2D9CDB'}
            y={25}
          />
        </Group>
      )}

      {role === 'coordinator' && !output && (
        <Group
          x={35}
          y={45}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          onClick={(e) => {
            e.cancelBubble = true;
            onClick?.();
          }}
        >
          <Rect
            width={80}
            height={24}
            fill={isButtonHovered ? '#2D9CDB' : '#4dabdd'}
            cornerRadius={12}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.2}
            shadowOffsetY={2}
          />
          <Text
            text="Add Topic"
            width={80}
            height={24}
            align="center"
            verticalAlign="middle"
            fontSize={12}
            fill="white"
          />
        </Group>
      )}

      {output && (
        <Text
          text={formatOutput(output)}
          width={140}
          height={35}
          x={5}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize.output}
          fill="#333333"
          y={42}
        />
      )}

      {onSettingsClick && (
        <Group
          x={125}
          y={5}
          onMouseEnter={() => setIsSettingsHovered(true)}
          onMouseLeave={() => setIsSettingsHovered(false)}
          onClick={(e) => {
            e.cancelBubble = true;
            onSettingsClick();
          }}
        >
          <Rect
            width={20}
            height={20}
            fill={isSettingsHovered ? '#e0e0e0' : '#f0f0f0'}
            cornerRadius={4}
          />
          <Text
            text="⚙️"
            width={20}
            height={20}
            fontSize={12}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
};

export default WorkflowNode;