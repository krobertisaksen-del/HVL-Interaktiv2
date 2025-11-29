import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export const DeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  if (confirming) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-bold hover:bg-red-700 transition-colors animate-in fade-in flex items-center gap-1"
        aria-label="Bekreft sletting"
      >
        <Trash2 size={12}/> Bekreft
      </button>
    );
  }

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }} 
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
      title="Slett"
      aria-label="Slett"
    >
      <Trash2 size={18}/>
    </button>
  );
};