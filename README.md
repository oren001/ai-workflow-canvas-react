# AI Workflow Canvas

A React-based canvas for visualizing AI workflows with node connections and animations. Built with React, Konva.js, and TypeScript.

## Features

- Interactive node creation and positioning
- Smooth connections between nodes
- Node delegation and task processing
- Visual feedback for active connections
- Zoom and pan functionality
- Responsive design

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Usage

```typescript
import { WorkflowCanvas } from 'ai-workflow-canvas-react';

function App() {
  return (
    <WorkflowCanvas
      width={800}
      height={600}
      nodes={nodes}
      onNodeClick={handleNodeClick}
      onConnect={handleConnect}
      onNodeDrag={handleNodeDrag}
    />
  );
}
```

## License

MIT