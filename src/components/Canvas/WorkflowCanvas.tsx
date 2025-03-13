import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import WorkflowNode from './WorkflowNode';

interface Node {
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
  color?: string;
}

interface WorkflowCanvasProps {
  width: number;
  height: number;
  nodes?: Node[];
  onNodeSettings?: (node: Node) => void;
  onConnect?: (fromNodeId: string, toNodeId: string) => void;
  onNodeClick?: (node: Node) => void;
  onNodeSpread?: (centerNode: Node, newNodes: Node[]) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 1.1;

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
  width, 
  height, 
  nodes = [],
  onNodeSettings,
  onConnect,
  onNodeClick,
  onNodeSpread,
  onNodeDrag
}) => {
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isStageMoving, setIsStageMoving] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * ZOOM_SPEED : oldScale / ZOOM_SPEED;
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  }, []);

  // Handle stage drag for panning
  const handleStageDragStart = () => {
    setIsStageMoving(true);
  };

  const handleStageDragEnd = () => {
    setIsStageMoving(false);
  };

  const handleStageDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Stage 
      width={width} 
      height={height}
      onWheel={handleWheel}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePosition.x}
      y={stagePosition.y}
      draggable={true}
      onDragStart={handleStageDragStart}
      onDragEnd={handleStageDragEnd}
      onDragMove={handleStageDragMove}
      ref={stageRef}
    >
      <Layer>
        {/* Draw nodes */}
        {nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            {...node}
            onSettingsClick={() => onNodeSettings?.(node)}
            onClick={() => onNodeClick?.(node)}
            scale={1 / stageScale}
            isDraggable={!isStageMoving}
            onDragEnd={(id, x, y) => onNodeDrag?.(id, x, y)}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default WorkflowCanvas;