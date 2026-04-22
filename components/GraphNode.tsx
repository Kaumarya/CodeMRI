"use client";

import { Handle, Position } from "reactflow";

export default function GraphNode({ data }: any) {
  return (
    <div className="px-4 py-2 rounded-xl bg-slate-800 border border-cyan-400 text-white text-xs shadow-lg min-w-[140px] text-center">

      {/* LEFT TARGET */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />

      <div className="font-medium">{data.label}</div>

      {/* RIGHT SOURCE */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </div>
  );
}
