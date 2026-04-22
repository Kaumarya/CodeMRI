"use client";

import { Handle, Position } from "reactflow";

export default function RootNode({ data }: any) {
  return (
    <div className="px-4 py-3 bg-slate-700/90 backdrop-blur-sm border-2 border-slate-500 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105">
      {/* LEFT TARGET */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
      />

      <div className="flex-1">
        <div className="text-white font-bold text-sm">{data.label}</div>
        <div className="text-slate-400 text-xs">{data.category}</div>
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
