'use client';

import React, { useMemo, memo, useCallback, useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
  useReactFlow,
  useUpdateNodeInternals,
  Handle,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCodeMRIStore } from '@/lib/store';
import { getLayoutedElements } from '@/lib/getLayoutedElements';
import { FileText, Folder, AlertTriangle, RefreshCw } from 'lucide-react';

// Custom Node Components
const CustomRootNode = memo(({ data }: any) => {
  return (
    <div className="px-4 py-3 bg-slate-700/90 backdrop-blur-sm border-2 border-slate-500 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105">
      <Handle
        id="target"
        type="target"
        position={Position.Left}
      />
      <div className="flex-1">
        <div className="text-white font-bold text-sm">{data.label}</div>
        <div className="text-slate-400 text-xs">{data.category}</div>
      </div>
      <Handle
        id="source"
        type="source"
        position={Position.Right}
      />
    </div>
  );
});

const CustomFolderNode = memo(({ data }: any) => {
  return (
    <div className="px-4 py-3 bg-slate-800/90 backdrop-blur-sm border-2 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105">
      <Handle
        id="target"
        type="target"
        position={Position.Left}
      />
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">{data.label}</div>
        <div className="text-gray-400 text-xs">{data.category}</div>
      </div>
      <Handle
        id="source"
        type="source"
        position={Position.Right}
      />
    </div>
  );
});

const CustomFileNode = memo(({ data }: any) => {
  return (
    <div className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm border-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105">
      <Handle
        id="target"
        type="target"
        position={Position.Left}
      />
      <div className="flex-1">
        <div className="text-white font-semibold text-xs">{data.label}</div>
        <div className="text-gray-400 text-xs">{data.category}</div>
      </div>
      <Handle
        id="source"
        type="source"
        position={Position.Right}
      />
    </div>
  );
});

// TypeScript interfaces for strict typing
interface GraphNodeData {
  label: string;
  category: string;
  technology: string;
  riskScore?: number;
  type: 'folder' | 'file';
  language?: string;
}

type RFNode = Node<GraphNodeData>;

interface GraphEdgeData {
  strength: number;
}

type GraphEdge = Edge<GraphEdgeData>;

interface GraphAnalysisProps {
  className?: string;
  onNodeSelect?: (fileName: string) => void;
  selectedNode?: string;
}

// Language to architecture layer mapping
function mapToArchitectureLayer(language: string): {
  layer: number;
  category: string;
  color: string;
} {
  const lowerLang = language.toLowerCase();
  
  if (['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby', 'jsx', 'tsx', 'html', 'css', 'tailwind', 'scss', 'sass'].includes(lowerLang)) {
    return { layer: 1, category: 'Frontend', color: '#06b6d4' };
  }
  
  if (['express', 'koa', 'fastify', 'nest', 'apollo', 'graphql', 'rest', 'api'].includes(lowerLang)) {
    return { layer: 2, category: 'API', color: '#8b5cf6' };
  }
  
  if (['node', 'node.js', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c#', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'dart'].includes(lowerLang)) {
    return { layer: 3, category: 'Backend', color: '#10b981' };
  }
  
  if (['postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'supabase', 'prisma', 'typeorm', 'sequelize', 'mongoose'].includes(lowerLang)) {
    return { layer: 4, category: 'Database', color: '#f59e0b' };
  }
  
  if (['aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'twilio', 'stripe', 'firebase', 'github', 'gitlab', 'docker', 'kubernetes'].includes(lowerLang)) {
    return { layer: 5, category: 'External', color: '#ef4444' };
  }
  
  return { layer: 3, category: 'Backend', color: '#10b981' };
}

// Risk-based color calculation
function getRiskBasedColor(baseColor: string, riskScore?: number): string {
  if (!riskScore) return baseColor;
  
  if (riskScore >= 80) {
    return '#dc2626';
  } else if (riskScore >= 60) {
    return '#d97706';
  } else {
    return '#06b6d4';
  }
}

// Hierarchical graph building with proper tree structure
const buildGraph = (scanResult: any): { nodes: RFNode[]; edges: GraphEdge[] } => {
  const files = scanResult.files || [];
  
  const nodes: RFNode[] = [];
  const edges: GraphEdge[] = [];

  // Create root node
  const rootNode: RFNode = {
    id: "root",
    type: "input",
    position: { x: 0, y: 0 },
    data: {
      label: "Project Root",
      category: "Root",
      technology: "root",
      type: 'folder' as const
    }
  };
  nodes.push(rootNode);

  // Build file nodes from scan
  const fileNodes = files.map((file: any) => ({
    id: file.path,
    type: "file" as const,
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      label: file.name || file.path.split('/').pop() || file.path,
      path: file.path,
      category: 'File',
      technology: file.path.split('.').pop() || 'unknown',
      type: 'file' as const,
      language: file.path.split('.').pop() || 'unknown'
    }
  }));
  nodes.push(...fileNodes);

  // Create hierarchy edges
  files.forEach((file: any) => {
    if (file.imports && Array.isArray(file.imports) && file.imports.length > 0) {
      file.imports.forEach((dep: string) => {
        const targetFile = files.find((f: any) => 
          f.path.includes(dep) || 
          f.name === dep || 
          f.name === `${dep}.js` || 
          f.name === `${dep}.ts` ||
          f.path.endsWith(`/${dep}`) ||
          f.path.endsWith(`/${dep}.js`) ||
          f.path.endsWith(`/${dep}.ts`)
        );
        
        if (targetFile) {
          edges.push({
            id: `${file.path}-${targetFile.path}`,
            source: file.path,
            target: targetFile.path,
            sourceHandle: "source",
            targetHandle: "target",
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "#8b5cf6",
              strokeWidth: 1.5,
              opacity: 0.8,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#8b5cf6",
              strokeWidth: 1.5,
            },
            data: {
              strength: 1.0
            }
          });
        }
      });
    }
    
    // Connect to root as fallback for tree structure
    if (!edges.some(edge => edge.target === file.path)) {
      edges.push({
        id: `root-${file.path}`,
        source: "root",
        target: file.path,
        sourceHandle: "source",
        targetHandle: "target",
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "#06b6d4",
          strokeWidth: 2,
          opacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#06b6d4",
          strokeWidth: 2,
        },
        data: {
          strength: 1.0
        }
      });
    }
  });
  
  return { nodes, edges };
};

const RootNode = memo(({ data }: { data: GraphNodeData }) => {
  return (
    <div className="px-4 py-3 bg-slate-700/90 backdrop-blur-sm border-2 border-slate-500 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105">
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      <Folder className="h-6 w-6 text-slate-400" />
      <div className="flex-1">
        <div className="text-white font-bold text-sm">{data.label}</div>
        <div className="text-slate-400 text-xs">{data.category}</div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
    </div>
  );
});

const FolderNode = memo(({ data }: { data: GraphNodeData }) => {
  const riskGlow = data.riskScore && data.riskScore >= 80 
    ? 'shadow-red-500/50' 
    : data.riskScore && data.riskScore >= 60 
    ? 'shadow-amber-500/50' 
    : 'shadow-cyan-500/30';

  return (
    <div className={`px-4 py-3 bg-slate-800/90 backdrop-blur-sm border-2 rounded-xl flex items-center gap-3 ${riskGlow} transition-all duration-300 hover:scale-105`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      <Folder className="h-5 w-5 text-purple-400" />
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">{data.label}</div>
        <div className="text-gray-400 text-xs">{data.category}</div>
      </div>
      {data.riskScore && (
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          data.riskScore >= 80 ? 'bg-red-500 text-white' :
          data.riskScore >= 60 ? 'bg-amber-500 text-white' :
          'bg-cyan-500 text-white'
        }`}>
          {data.riskScore}
        </div>
      )}
    </div>
  );
});

const FileNode = memo(({ data }: { data: GraphNodeData }) => {
  const riskGlow = data.riskScore && data.riskScore >= 80 
    ? 'shadow-red-500/50' 
    : data.riskScore && data.riskScore >= 60 
    ? 'shadow-amber-500/50' 
    : 'shadow-cyan-500/30';

  const extension = data.technology?.split('.').pop()?.toLowerCase() || '';
  const languageColors: Record<string, string> = {
    'js': 'bg-yellow-500',
    'ts': 'bg-blue-500',
    'jsx': 'bg-cyan-500',
    'tsx': 'bg-blue-600',
    'py': 'bg-green-500',
    'java': 'bg-orange-500',
    'go': 'bg-cyan-600',
    'rs': 'bg-orange-600',
    'php': 'bg-purple-500',
    'rb': 'bg-red-500',
    'cs': 'bg-purple-600',
    'cpp': 'bg-blue-700',
    'c': 'bg-gray-500',
  };

  const badgeColor = languageColors[extension] || 'bg-gray-500';

  return (
    <div className={`px-3 py-2 bg-slate-800/90 backdrop-blur-sm border-2 rounded-lg flex items-center gap-2 ${riskGlow} transition-all duration-300 hover:scale-105`}>
      <FileText className="h-4 w-4 text-blue-400" />
      <div className="flex-1">
        <div className="text-white font-medium text-xs">{data.label}</div>
        <div className={`inline-block px-2 py-0.5 rounded text-white text-xs font-medium ${badgeColor}`}>
          {extension.toUpperCase()}
        </div>
      </div>
      {data.riskScore && (
        <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          data.riskScore >= 80 ? 'bg-red-500 text-white' :
          data.riskScore >= 60 ? 'bg-amber-500 text-white' :
          'bg-cyan-500 text-white'
        }`}>
          {data.riskScore}
        </div>
      )}
    </div>
  );
});

// Error Boundary for the ReactFlow graph
interface GraphErrorBoundaryProps {
  children: ReactNode;
}

interface GraphErrorBoundaryState {
  hasError: boolean;
}

class GraphErrorBoundary extends Component<GraphErrorBoundaryProps, GraphErrorBoundaryState> {
  constructor(props: GraphErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): GraphErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silently caught — no console output
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="text-center max-w-md p-8 bg-slate-800/80 backdrop-blur-sm border border-red-500/30 rounded-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Graph failed to render</h3>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred while rendering the dependency graph.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inner component that uses ReactFlow hooks
const GraphAnalysisInner = memo(function GraphAnalysisInner({ className = '', onNodeSelect, selectedNode }: GraphAnalysisProps) {
  const { scanResult, isScanning } = useCodeMRIStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView, setCenter } = useReactFlow();

  // Memoize nodeTypes to prevent recreation on every render
  const nodeTypes = useMemo(() => ({
    input: CustomRootNode,
    folder: CustomFolderNode,
    file: CustomFileNode,
  }), []);

  // Build raw graph data
  const rawGraphData = useMemo(() => {
    return buildGraph(scanResult);
  }, [scanResult]);

  // Apply Dagre layout for automatic positioning
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (rawGraphData.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    
    return getLayoutedElements(rawGraphData.nodes, rawGraphData.edges);
  }, [rawGraphData.nodes, rawGraphData.edges]);

  // Memoized nodes and edges for performance
  const memoNodes = useMemo(() => layoutedNodes, [layoutedNodes]);
  const memoEdges = useMemo(() => layoutedEdges, [layoutedEdges]);

  // Ensure node internals are refreshed after layout
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    layoutedNodes.forEach((node) => {
      updateNodeInternals(node.id);
    });
  }, [layoutedNodes, updateNodeInternals]);

  // Ensure ReactFlow re-renders after layout
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 150);
  }, [memoNodes.length]);

  const [nodes, setNodes, onNodesChange] = useNodesState(memoNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(memoEdges as any);

  // Update nodes and edges when layout changes
  useEffect(() => {
    setNodes(memoNodes as any);
    setEdges(memoEdges as any);
  }, [memoNodes, memoEdges, setNodes, setEdges]);

  // Safe node click handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: RFNode) => {
    if (onNodeSelect && (node.type === 'file' || node.type === 'input')) {
      onNodeSelect(node.id); // node.id is the file path
    }
  }, [onNodeSelect]);

  // Handle selectedNode focus
  useEffect(() => {
    if (!scanResult) return;
    
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: n.id === selectedNode
    })));

    if (selectedNode) {
      const node = memoNodes.find(n => n.id === selectedNode);
      if (node) {
        fitView({ nodes: [{ id: selectedNode }], duration: 500, maxZoom: 1.5 });
      }
    }
  }, [selectedNode, memoNodes, setNodes, fitView, scanResult]);

  // Proper fit view handler
  const handleFitView = useCallback(() => {
    fitView({ 
      padding: 0.2, 
      duration: 400,
      includeHiddenNodes: true
    });
  }, [fitView]);

  // Reset layout handler
  const handleResetLayout = useCallback(() => {
    const { nodes: resetNodes, edges: resetEdges } = getLayoutedElements(rawGraphData.nodes, rawGraphData.edges);
    setNodes(resetNodes as any);
    setEdges(resetEdges as any);
    
    setTimeout(() => {
      fitView({ 
        padding: 0.2, 
        duration: 400,
        includeHiddenNodes: true
      });
    }, 100);
  }, [rawGraphData, setNodes, setEdges, fitView]);

  // Proper fullscreen handler
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fullscreen not supported or denied
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Loading state
  if (isScanning) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-l-2 border-cyan-400"></div>
          <p className="text-cyan-300 text-lg">Analyzing code architecture...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!scanResult || nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <div className="text-slate-400 text-xl mb-4">No architecture data available</div>
          <div className="text-slate-500 text-sm">Run a scan to visualize your code architecture</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-slate-900 ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2">
        <button
          onClick={handleFitView}
          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          🎯 Fit View
        </button>
        <button
          onClick={handleResetLayout}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          🔄 Reset Layout
        </button>
        <button
          onClick={handleFullscreen}
          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          {isFullscreen ? '🧭 Exit Fullscreen' : '🖥️ Fullscreen'}
        </button>
      </div>

      {/* React Flow Graph */}
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={true}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "#8b5cf6",
              strokeWidth: 1.5,
              opacity: 0.8,
              strokeDasharray: "5,5",
            },
          }}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            width: '100%',
            height: '100%'
          }}
          className="bg-slate-900"
        >
          <Background 
            color="#1e293b" 
            gap={20}
            size={1}
          />
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={false}
            position="top-right"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '8px'
            }}
          />
          
          {/* Hide React Flow attribution and handles, enhance edge visibility */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .react-flow__attribution {
                display: none !important;
              }
              .react-flow__edges {
                z-index: 5 !important;
              }
              .react-flow__edge {
                pointer-events: all !important;
              }
              .react-flow__node.dragging {
                opacity: 0.8 !important;
                cursor: grabbing !important;
                filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)) !important;
                z-index: 1000 !important;
              }
              .react-flow__node.selected {
                box-shadow: 0 0 0 3px #06b6d4 !important;
                z-index: 10 !important;
              }
              .react-flow__handle {
                opacity: 0 !important;
              }
            `
          }} />
        </ReactFlow>
      </div>
    </div>
  );
});

// Main component wrapped with ReactFlowProvider and Error Boundary
const GraphAnalysis = memo(function GraphAnalysis({ className = '', onNodeSelect, selectedNode }: GraphAnalysisProps) {
  return (
    <GraphErrorBoundary>
      <ReactFlowProvider>
        <GraphAnalysisInner className={className} onNodeSelect={onNodeSelect} selectedNode={selectedNode} />
      </ReactFlowProvider>
    </GraphErrorBoundary>
  );
});

export default GraphAnalysis;
