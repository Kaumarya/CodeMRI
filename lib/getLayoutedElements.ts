import dagre from "dagre";
import { Node, Edge } from "reactflow";

export function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  // ✅ CRITICAL: create fresh graph each run
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 120,
    ranksep: 160,
    marginx: 40,
    marginy: 40,
  });
  
  // register nodes
  nodes.forEach((node: Node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // register edges
  edges.forEach((edge: Edge) => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node: Node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      // ✅ VERY IMPORTANT
      positionAbsolute: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
