import React, { useState, useEffect } from 'react';
import './App.css';
import WorkflowCanvas from './components/Canvas/WorkflowCanvas';
import Toolbar from './components/Toolbar/Toolbar';
import NodeSettings from './components/NodeSettings/NodeSettings';
import Modal from './components/Modal/Modal';

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
  isCompleted?: boolean;
  groupId?: string;
  color?: string;
}

interface Task {
  type: 'WRITE_POEM';
  prompt: string;
  verses?: { [nodeId: string]: string };
}

interface WorkflowCanvasProps {
  width: number;
  height: number;
  nodes: Node[];
  onNodeSettings?: (node: Node) => void;
  onConnect?: (fromNodeId: string, toNodeId: string) => void;
  onNodeClick?: (node: Node) => void;
  onNodeSpread?: (centerNode: Node, newNodes: Node[]) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
}

// Add color palette at the top of the file
const GROUP_COLORS = [
  { fill: '#e3f2fd', stroke: '#1976d2' }, // Blue group
  { fill: '#f3e5f5', stroke: '#7b1fa2' }, // Purple group
  { fill: '#e8f5e9', stroke: '#388e3c' }, // Green group
  { fill: '#fff3e0', stroke: '#f57c00' }, // Orange group
];

interface AppState {
  canvasSize: { width: number; height: number };
  nodes: Node[];
  selectedNode: Node | null;
  currentTask: Task | null;
  usedColors: number[];
  isTopicModalOpen: boolean;
  isPoemModalOpen: boolean;
  finalPoem: string;
  selectedCoordinator: string | null;
}

interface Communication {
  fromId: string;
  toId: string;
}

interface WorkerNode extends Node {
  role: string;
  prompt: string;
}

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [usedColors, setUsedColors] = useState<number[]>([]);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isPoemModalOpen, setIsPoemModalOpen] = useState(false);
  const [finalPoem, setFinalPoem] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState<string | null>(null);
  const [activeCommunications, setActiveCommunications] = useState<Communication[]>([]);

  useEffect(() => {
    const updateSize = () => {
      const main = document.querySelector('.app-main');
      if (main) {
        setCanvasSize({
          width: main.clientWidth - 40,
          height: main.clientHeight - 40,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleAddNode = () => {
    const centerX = canvasSize.width / 2 - 75;
    const centerY = canvasSize.height / 2 - 40;
    
    // Find a free spot for the new coordinator
    let offset = 0;
    while (nodes.some(n => 
      Math.abs(n.x - (centerX + offset)) < 200 && 
      Math.abs(n.y - centerY) < 150
    )) {
      offset += 250;
    }

    // Find next available color
    let colorIndex = 0;
    while (usedColors.includes(colorIndex)) {
      colorIndex = (colorIndex + 1) % GROUP_COLORS.length;
    }
    setUsedColors([...usedColors, colorIndex]);

    const groupId = Date.now().toString();
    const newNode: Node = {
      id: groupId,
      x: centerX + offset,
      y: centerY,
      text: 'Task Coordinator',
      type: 'coordinator',
      systemPrompt: 'You are a task coordinator. Your task is to delegate work to connected nodes and combine their responses.',
      temperature: 0.7,
      connections: [],
      role: 'coordinator',
      groupId,
      color: GROUP_COLORS[colorIndex].stroke
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleNodeClick = (node: Node) => {
    console.log('Node clicked:', node); // Add debug logging
    if (node.role === 'coordinator') {
      if (!node.output) {
        setSelectedCoordinator(node.id);
        setIsTopicModalOpen(true);
      } else if (node.output) {
        setFinalPoem(node.output);
        setIsPoemModalOpen(true);
      }
    }
  };

  const handleTopicSubmit = async (topic: string) => {
    if (!selectedCoordinator) return;
    const coordinatorNode = nodes.find(node => node.id === selectedCoordinator);
    if (coordinatorNode) {
      await processVerse(coordinatorNode, topic);
      setSelectedCoordinator(null); // Reset selected coordinator after processing
    }
  };

  const handleNodeSettings = (node: Node) => {
    setSelectedNode(node);
  };

  const handleSettingsSave = (id: string, updates: { systemPrompt: string; temperature: number }) => {
    setNodes(nodes.map(node =>
      node.id === id ? { ...node, ...updates } : node
    ));
    setSelectedNode(null);
  };

  const handleConnect = (fromNodeId: string, toNodeId: string) => {
    // Check if connection already exists
    const sourceNode = nodes.find(n => n.id === fromNodeId);
    if (!sourceNode) return;

    // Prevent connecting to self
    if (fromNodeId === toNodeId) {
      console.warn('Cannot connect a node to itself');
      return;
    }

    // Check for existing connection
    if (sourceNode.connections.includes(toNodeId)) {
      console.warn('Connection already exists');
      return;
    }

    setNodes(nodes.map(node => {
      if (node.id === fromNodeId) {
        return {
          ...node,
          connections: [...node.connections, toNodeId]
        };
      }
      return node;
    }));
  };

  const setConnectionActive = (fromNodeId: string, toNodeId: string, isActive: boolean) => {
    setNodes(prev => {
      const newNodes = [...prev];
      const sourceNode = newNodes.find(n => n.id === fromNodeId);
      if (sourceNode) {
        const connectionIndex = sourceNode.connections.indexOf(toNodeId);
        if (connectionIndex !== -1) {
          // Update the connection in the nodes array
          return newNodes.map(node => 
            node.id === fromNodeId ? {
              ...node,
              connections: node.connections.map((conn, i) => 
                i === connectionIndex ? (isActive ? `${conn}:active` : conn.split(':')[0]) : conn
              )
            } : node
          );
        }
      }
      return prev;
    });
  };

  const handleNodeCommunication = (fromId: string, toId: string) => {
    setActiveCommunications(prev => [...prev, { fromId, toId }]);
    // Remove the communication after animation completes
    setTimeout(() => {
      setActiveCommunications(prev => 
        prev.filter(comm => !(comm.fromId === fromId && comm.toId === toId))
      );
    }, 1000);
  };

  const processVerse = async (coordinator: Node, topic: string) => {
    // Update coordinator with the topic
    setNodes(prev => prev.map(node => 
      node.id === coordinator.id 
        ? { ...node, text: `Topic: ${topic}`, isProcessing: true }
        : node
    ));

    // Create worker nodes
    const workerNodes = await createWorkerNodes(coordinator, topic);
    
    // Show communication when delegating to workers
    workerNodes.forEach(worker => {
      handleNodeCommunication(coordinator.id, worker.id);
    });

    // Process each worker node
    const results = await Promise.all(workerNodes.map(async worker => {
      // Show communication when worker starts processing
      handleNodeCommunication(worker.id, coordinator.id);
      
      // Process the worker's task
      const result = await processWorkerNode(worker, topic);
      
      // Show communication when worker completes
      handleNodeCommunication(worker.id, coordinator.id);
      
      return result;
    }));

    // Combine results
    const combinedPoem = await combineResults(coordinator, results);
    
    // Update coordinator with final result
    setNodes(prev => prev.map(node => 
      node.id === coordinator.id 
        ? { ...node, output: combinedPoem, isProcessing: false }
        : node
    ));
  };

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { 
        ...node, 
        x: Math.round(x), // Round to prevent floating point issues
        y: Math.round(y)
      } : node
    ));
  };

  const createWorkerNodes = async (coordinator: Node, topic: string): Promise<WorkerNode[]> => {
    const poetRoles = [
      { 
        text: 'Nature Poet', 
        prompt: 'You are a poet specializing in nature imagery. Create verses that incorporate natural elements and metaphors.' 
      },
      { 
        text: 'Emotion Poet', 
        prompt: 'You are a poet focusing on emotional depth. Create verses that explore feelings and human experience.' 
      },
      { 
        text: 'Abstract Poet', 
        prompt: 'You are a poet crafting abstract concepts. Create verses that blend philosophical and metaphysical elements.' 
      }
    ];

    const radius = 200;
    const workerNodes = poetRoles.map((role, index) => {
      const angle = (2 * Math.PI * index) / poetRoles.length;
      return {
        id: `poet-${Date.now()}-${index}`,
        x: coordinator.x + radius * Math.cos(angle),
        y: coordinator.y + radius * Math.sin(angle),
        text: role.text,
        type: 'process',
        systemPrompt: role.prompt,
        temperature: 0.8,
        connections: [],
        role: 'poet',
        prompt: role.prompt,
        groupId: coordinator.groupId,
        color: coordinator.color
      };
    });

    // Get worker node IDs
    const workerNodeIds = workerNodes.map(node => node.id);
    
    // Update the coordinator node with connections to all workers
    setNodes(prev => prev.map(node => 
      node.id === coordinator.id 
        ? { ...node, connections: [...node.connections, ...workerNodeIds] }
        : node
    ));

    // Add nodes to the canvas
    setNodes(prev => [...prev, ...workerNodes]);
    
    return workerNodes;
  };

  const processWorkerNode = async (worker: WorkerNode, topic: string): Promise<string> => {
    // Update node to show processing state
    setNodes(prev => prev.map(node =>
      node.id === worker.id ? { ...node, isProcessing: true } : node
    ));

    // Simulate AI processing with unique verses for each poet type
    const verses = {
      'Nature Poet': [
        topic.toLowerCase().includes('cake') ? 
          `Sweet ${topic} rises like morning dew,\nIn garden's warmth, a flavor new.\nThrough layers rich with nature's grace,\nA treat that time cannot erase.` :
          `In ${topic}'s dance with morning light,\nNature weaves a tapestry bright.\nThrough meadow, stream, and forest deep,\nWild wonders start to softly leap.`,
        topic.toLowerCase().includes('space') ?
          `Among the stars where ${topic} roam,\nCelestial gardens make their home.\nIn cosmic winds that gently sway,\nStardust paints the Milky Way.` :
          `The ${topic} blooms in spring's embrace,\nLike wildflowers finding their place.\nIn mountain streams and valley floors,\nNature opens endless doors.`
      ],
      'Emotion Poet': [
        topic.toLowerCase().includes('cake') ?
          `Each slice of ${topic} brings delight,\nJoy bubbles up, pure and bright.\nIn memories sweet of childhood days,\nLaughter echoes in countless ways.` :
          `Deep within where ${topic} dwells,\nEmotions rise like ocean swells.\nThrough storms of doubt and seas of change,\nFeelings flow in endless range.`,
        topic.toLowerCase().includes('space') ?
          `The ${topic} fill our hearts with awe,\nWonder pure without a flaw.\nIn dreams that reach beyond Earth's sphere,\nHope conquers every mortal fear.` :
          `When ${topic} touches tender hearts,\nA thousand feelings freshly start.\nIn depths of love and heights of peace,\nSoul's expression finds release.`
      ],
      'Abstract Poet': [
        topic.toLowerCase().includes('cake') ?
          `Beyond the realm of ${topic}'s form,\nTranscendent flavors break the norm.\nIn quantum taste and time's sweet flow,\nExistence's layers start to show.` :
          `The ${topic} transcends our mortal plane,\nWhere thought and form are split in twain.\nThrough metaphysical design,\nReality's borders intertwine.`,
        topic.toLowerCase().includes('space') ?
          `Where ${topic} bend dimensions thin,\nParadox and truth begin.\nIn cosmic dance of now and then,\nInfinity loops back again.` :
          `Through ${topic}'s abstract paradigm,\nConsciousness weaves space and time.\nIn patterns none can comprehend,\nBeginning circles back to end.`
      ]
    };

    // Get verses for this poet type
    const poetVerses = verses[worker.text as keyof typeof verses];
    // Select a random verse that best matches the topic
    const verse = poetVerses[Math.floor(Math.random() * poetVerses.length)];

    // Update node with result
    setNodes(prev => prev.map(node =>
      node.id === worker.id ? { ...node, isProcessing: false, output: verse } : node
    ));

    return verse;
  };

  const combineResults = async (coordinator: Node, results: string[]): Promise<string> => {
    return `✨ Poem Complete! ✨\n\nTheme: "${coordinator.text}"\n\n${results.join('\n\n')}`;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Workflow Canvas</h1>
      </header>
      <main className="app-main">
        <Toolbar onAddNode={handleAddNode} />
        <WorkflowCanvas 
          width={canvasSize.width} 
          height={canvasSize.height}
          nodes={nodes}
          onNodeSettings={handleNodeSettings}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onNodeSpread={(centerNode, spreadingNodes) => {
            // Calculate new positions for only the specified nodes
            const radius = 200;
            const angleStep = (2 * Math.PI) / spreadingNodes.length;

            // Animate nodes to new positions
            const animateNodes = async () => {
              const frames = 30;
              const duration = 1000;
              const frameTime = duration / frames;

              for (let frame = 0; frame <= frames; frame++) {
                const progress = frame / frames;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

                setNodes(prev => prev.map(node => {
                  if (node.id === centerNode.id) {
                    // Keep coordinator in place
                    return node;
                  } else if (spreadingNodes.find(n => n.id === node.id)) {
                    // Move only the nodes being spread
                    const nodeIndex = spreadingNodes.findIndex(n => n.id === node.id);
                    const angle = angleStep * nodeIndex;
                    const targetX = centerNode.x + radius * Math.cos(angle);
                    const targetY = centerNode.y + radius * Math.sin(angle);

                    return {
                      ...node,
                      x: Math.round(node.x + (targetX - node.x) * easedProgress),
                      y: Math.round(node.y + (targetY - node.y) * easedProgress)
                    };
                  }
                  // Leave other nodes unchanged
                  return node;
                }));

                await new Promise(resolve => setTimeout(resolve, frameTime));
              }
            };

            animateNodes();
          }}
          onNodeDrag={handleNodeDrag}
          activeCommunications={activeCommunications}
        />
        {selectedNode && (
          <NodeSettings
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSave={handleSettingsSave}
          />
        )}
      </main>
      
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="Enter Poem Topic"
      >
        <div style={{ padding: '20px' }}>
          <input
            type="text"
            placeholder="Enter a topic for the poem..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #2D9CDB',
              borderRadius: '8px',
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const topic = e.currentTarget.value;
                setIsTopicModalOpen(false);
                handleTopicSubmit(topic);
              }
            }}
          />
          <p style={{ marginTop: '12px', color: '#666' }}>
            Press Enter to submit
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isPoemModalOpen}
        onClose={() => setIsPoemModalOpen(false)}
        title="Final Poem"
      >
        <div style={{ 
          padding: '20px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          lineHeight: '1.6',
          color: '#1a1a1a'
        }}>
          {finalPoem}
        </div>
      </Modal>
    </div>
  );
}

export default App;
