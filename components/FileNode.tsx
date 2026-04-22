"use client";

import { Handle, Position } from "reactflow";

export default function FileNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm border-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105">
      {/* LEFT TARGET */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />

      <div className="flex-1">
        <div className="text-white font-semibold text-xs">{data.label}</div>
        <div className="text-gray-400 text-xs">{data.category}</div>
      </div>

      {/* RIGHT SOURCE */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </div>
  );
}
