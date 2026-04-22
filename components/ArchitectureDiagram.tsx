'use client';

// Production-grade Architecture Diagram using React Flow
import React, { useMemo, memo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCodeMRIStore } from '@/lib/store';

interface ArchitectureDiagramProps {
  className?: string;
}

// Language to architecture layer mapping
function mapToArchitectureLayer(language: string): {
  layer: number;
  category: string;
  color: string;
} {
  const lowerLang = language.toLowerCase();
  
  // Frontend Layer (1)
  if (['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby', 'jsx', 'tsx', 'html', 'css', 'tailwind', 'scss', 'sass'].includes(lowerLang)) {
    return { layer: 1, category: 'Frontend', color: '#06b6d4' };
  }
  
  // API Layer (2)
  if (['express', 'koa', 'fastify', 'nest', 'apollo', 'graphql', 'rest', 'api'].includes(lowerLang)) {
    return { layer: 2, category: 'API', color: '#8b5cf6' };
  }
  
  // Backend Layer (3)
  if (['node', 'node.js', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c#', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'dart'].includes(lowerLang)) {
    return { layer: 3, category: 'Backend', color: '#10b981' };
  }
  
  // Database Layer (4)
  if (['postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'supabase', 'prisma', 'typeorm', 'sequelize', 'mongoose'].includes(lowerLang)) {
    return { layer: 4, category: 'Database', color: '#f59e0b' };
  }
  
  // External Services Layer (5)
  if (['aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'twilio', 'stripe', 'firebase', 'github', 'gitlab', 'docker', 'kubernetes'].includes(lowerLang)) {
    return { layer: 5, category: 'External', color: '#ef4444' };
  }
  
  // Default to Backend
  return { layer: 3, category: 'Backend', color: '#10b981' };
}

// Stable graph building helper
function buildGraph(scanResult: any) {
  if (!scanResult?.dependencyGraph) {
    return { nodes: [], edges: [] };
  }

  // Create positioned nodes with improved multi-column layout
  const positionedNodes: any[] = [];
  const nodeMap = new Map<string, any>();
  const nodeSpacing = 80;   // Reduced vertical spacing
  const verticalSpacing = 60; // Reduced category spacing
  const startX = 50; // Start from left edge
  const startY = 50; // Start from top edge
  
  // First, categorize all nodes
  const categorizedNodes = scanResult.dependencyGraph.nodes.map((node: any) => {
    const { layer, category, color } = mapToArchitectureLayer(node.type);
    return {
      id: node.id,
      type: node.type,
      category,
      color,
      layer
    };
  });

  // Group nodes by category for better layout
  const categoryGroups = new Map<string, any[]>();
  categorizedNodes.forEach((node: any) => {
    if (!categoryGroups.has(node.category)) {
      categoryGroups.set(node.category, []);
    }
    categoryGroups.get(node.category)!.push(node);
  });

  // Position nodes in a professional, non-overlapping layout
  const maxColumns = 8; // Use 8 columns for maximum horizontal spread
  const layerNodeCounts = new Map<number, number>();
  categoryGroups.forEach((nodes, category) => {
    const layer = nodes[0].layer;
    layerNodeCounts.set(layer, (layerNodeCounts.get(layer) || 0) + nodes.length);
  });

  // Calculate total graph dimensions
  const totalLayers = Math.max(...Array.from(layerNodeCounts.keys()));
  const maxNodesPerLayer = Math.max(...Array.from(layerNodeCounts.values()));
  
  // Professional spacing calculations to prevent overlap at any zoom level
  const maxGraphWidth = 2400; // Much wider canvas for professional spacing
  const maxGraphHeight = 900; // Adequate height for professional layout
  const nodeWidth = 140; // Professional node size
  const nodeHeight = 50; // Professional node height
  const horizontalPadding = 150; // Professional horizontal spacing
  const verticalPadding = 80; // Professional vertical spacing
  const layerPadding = 200; // Professional layer separation
  
  // Professional spacing calculations
  const columnWidth = nodeWidth + horizontalPadding; // 290px per column
  const layerSpacing = Math.max(400, maxGraphWidth / totalLayers); // Minimum 400px between layers

  let categoryIndex = 0;
  Array.from(categoryGroups.keys()).sort().forEach((category) => {
    const nodesInCategory = categoryGroups.get(category)!;
    const layer = nodesInCategory[0].layer;
    
    // Calculate professional columns for this layer
    const totalLayerNodes = layerNodeCounts.get(layer) || 0;
    const columnsForLayer = Math.min(maxColumns, Math.max(7, Math.ceil(totalLayerNodes / 1)));
    
    nodesInCategory.forEach((node, nodeIndex) => {
      // Calculate column and row within the layer
      const columnInLayer = nodeIndex % columnsForLayer;
      const rowInLayer = Math.floor(nodeIndex / columnsForLayer);
      
      // Calculate X position with professional spacing
      const layerStartX = startX + (layer - 1) * (layerSpacing + layerPadding);
      const x = layerStartX + columnInLayer * columnWidth;
      
      // Calculate Y position with professional spacing
      const y = startY + categoryIndex * (verticalSpacing + verticalPadding) + rowInLayer * (nodeHeight + verticalPadding);
      
      // Ensure nodes fit professionally with generous safety margins
      const boundedX = Math.min(x, maxGraphWidth - nodeWidth - 200);
      const boundedY = Math.min(y, maxGraphHeight - nodeHeight - 100);
      
      const positionedNode = {
        id: node.id,
        type: 'default',
        position: { x: boundedX, y: boundedY },
        data: {
          label: node.id.length > 16 ? node.id.substring(0, 13) + '...' : node.id,
          category: node.category,
          technology: node.type
        },
        style: {
          background: `linear-gradient(135deg, ${node.color}35, ${node.color}25)`,
          border: `2px solid ${node.color}`,
          borderRadius: '10px',
          width: nodeWidth,
          height: nodeHeight,
          fontSize: '10px',
          fontWeight: '600',
          color: '#ffffff',
          boxShadow: `0 3px 12px ${node.color}45`,
          transition: 'all 0.2s ease-in-out'
        }
      };
      
      positionedNodes.push(positionedNode);
      nodeMap.set(node.id, positionedNode);
    });
    
    categoryIndex++;
  });

  // Create edges based on actual dependencies from the scan result
  const logicalEdges: any[] = [];
  const connectedNodes = new Set<string>();
  
  // Use the actual edges from the scan result
  scanResult.dependencyGraph.edges.forEach((edge: any) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (sourceNode && targetNode) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
      
      // Use consistent color for all edges
      const edgeColor = 'rgba(139, 92, 246, 0.4)'; // Consistent purple for all edges
      
      logicalEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        animated: true,
        markerEnd: {
          type: 'arrow',
          color: 'rgba(139, 92, 246, 0.8)', // Consistent arrow color
          strokeWidth: 2,
        }
      });
    }
  });

  // Create logical connections for unconnected nodes to ensure connectivity
  const unconnectedNodes = positionedNodes.filter(n => !connectedNodes.has(n.id));
  
  if (unconnectedNodes.length > 0 || logicalEdges.length === 0) {
    // Group nodes by layer
    const nodesByLayer = new Map<number, any[]>();
    positionedNodes.forEach(node => {
      const layer = nodeMap.get(node.id).layer;
      if (!nodesByLayer.has(layer)) {
        nodesByLayer.set(layer, []);
      }
      nodesByLayer.get(layer)!.push(node);
    });
    
    // Create logical connections between layers with consistent styling
    const layerConnections = [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 1, to: 3 },
      { from: 3, to: 5 },
    ];
    
    layerConnections.forEach(({ from, to }) => {
      const fromNodes = nodesByLayer.get(from) || [];
      const toNodes = nodesByLayer.get(to) || [];
      
      // Connect nodes between layers (limit to prevent too many edges)
      const maxConnections = Math.min(3, fromNodes.length, toNodes.length);
      for (let i = 0; i < maxConnections; i++) {
        const sourceNode = fromNodes[i];
        const targetNode = toNodes[i];
        
        if (sourceNode && targetNode) {
          const edgeId = `${sourceNode.id}-${targetNode.id}`;
          
          // Avoid duplicate edges
          if (!logicalEdges.find(e => e.id === edgeId)) {
            const edgeColor = 'rgba(139, 92, 246, 0.4)'; // Consistent purple for all edges
            
            logicalEdges.push({
              id: edgeId,
              source: sourceNode.id,
              target: targetNode.id,
              type: 'smoothstep',
              style: {
                stroke: edgeColor,
                strokeWidth: 2,
              },
              animated: true,
              markerEnd: {
                type: 'arrow',
                color: 'rgba(139, 92, 246, 0.8)', // Consistent arrow color
                strokeWidth: 2,
              }
            });
          }
        }
      }
    });
    
    // Connect unconnected nodes within the same layer with consistent styling
    unconnectedNodes.forEach((node, index) => {
      if (index < unconnectedNodes.length - 1) {
        const nextNode = unconnectedNodes[index + 1];
        const edgeId = `${node.id}-${nextNode.id}`;
        
        if (!logicalEdges.find(e => e.id === edgeId)) {
          const edgeColor = 'rgba(139, 92, 246, 0.4)'; // Consistent purple for all edges
          
          logicalEdges.push({
            id: edgeId,
            source: node.id,
            target: nextNode.id,
            type: 'smoothstep',
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
            },
            animated: true,
            markerEnd: {
              type: 'arrow',
              color: 'rgba(139, 92, 246, 0.8)', // Consistent arrow color
              strokeWidth: 2,
            }
          });
        }
      }
    });
  }

  return { nodes: positionedNodes, edges: logicalEdges };
}

// Loading skeleton component
function LoadingGraphSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-l-2 border-cyan-400"></div>
        <p className="text-cyan-300 text-lg">Loading Architecture Diagram...</p>
      </div>
    </div>
  );
}

// Empty state component
function EmptyGraphState() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-slate-400 text-xl mb-4">No architecture data available</div>
        <div className="text-slate-500 text-sm">Upload a project to analyze</div>
      </div>
    </div>
  );
}

const ArchitectureDiagram = memo(function ArchitectureDiagram({ className = '' }: ArchitectureDiagramProps) {
  const { scanResult, isScanning } = useCodeMRIStore();

  // Debug logging
  console.log('ArchitectureDiagram render:', { 
    scanResult: !!scanResult, 
    isScanning, 
    nodeCount: scanResult?.dependencyGraph?.nodes?.length,
    edgeCount: scanResult?.dependencyGraph?.edges?.length
  });

  // Safe state initialization with useMemo
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return buildGraph(scanResult);
  }, [scanResult]);

  console.log('Initial graph data:', { 
    nodeCount: initialNodes?.length || 0, 
    edgeCount: initialEdges?.length || 0 
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  // Handle node interactions
  const onNodeClick = useCallback((event: any, node: any) => {
    console.log('Node clicked:', node);
  }, []);

  // Loading state
  if (isScanning) {
    return <LoadingGraphSkeleton />;
  }

  // Empty state
  if (!scanResult || nodes.length === 0) {
    console.log('Showing empty state - scanResult:', !!scanResult, 'nodes:', nodes.length);
    
    // Show test data if no scan result
    const testNodes = [
      { id: 'test1', type: 'default', position: { x: 100, y: 100 }, data: { label: 'Test Node 1' } },
      { id: 'test2', type: 'default', position: { x: 300, y: 100 }, data: { label: 'Test Node 2' } },
    ];
    const testEdges = [
      { id: 'test-edge', source: 'test1', target: 'test2', type: 'smoothstep' }
    ];
    
    return (
      <div className={`w-full h-full ${className}`}>
        <ReactFlow
          nodes={testNodes}
          edges={testEdges}
          fitView
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            width: '100%',
            height: '100%'
          }}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls showZoom={true} showFitView={true} position="top-right" />
        </ReactFlow>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden ${className}`}>
      <div className="relative w-full h-full max-w-[2400px] max-h-[900px] mx-auto">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.02, includeHiddenNodes: true, minZoom: 0.2, maxZoom: 1.2 }}
          minZoom={0.2}
          maxZoom={1.2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
          attributionPosition="top-left"
          panOnDrag={true}
          panOnScroll={false}
          selectionOnDrag={false}
          preventScrolling={true}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            width: '2400px',
            height: '900px',
            overflow: 'hidden',
            maxWidth: '2400px',
            maxHeight: '900px'
          }}
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
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '8px'
            }}
          />
          <MiniMap 
            nodeColor={(node: any) => (node.style?.border as string) || '#8b5cf6'}
            maskColor="rgba(15, 23, 42, 0.6)"
            position="bottom-right"
            pannable={true}
            zoomable={true}
            zoomStep={1.0}
            ariaLabel="CodeMRI mini map"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              borderRadius: '8px',
              width: 200,
              height: 150,
              cursor: 'move'
            }}
          />
          {/* Hide React Flow attribution and minimap label */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .react-flow__minimap::after {
                display: none !important;
              }
              .react-flow__minimap::before {
                display: none !important;
              }
              .react-flow__attribution {
                display: none !important;
              }
            `
          }} />
        </ReactFlow>
        <style dangerouslySetInnerHTML={{
          __html: `
            .react-flow__attribution {
              display: none !important;
            }
          `
        }} />
      </div>
    </div>
  );
});

export default ArchitectureDiagram;
