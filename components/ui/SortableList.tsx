import React, { useState } from 'react';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { DeleteButton } from './DeleteButton';

interface SortableListProps {
  items: any[];
  onUpdate: (items: any[]) => void;
  renderContent: (item: any, index: number) => React.ReactNode;
  labelFn?: (item: any, index: number) => string;
  listKey: string;
  onRemove?: (id: any) => void;
  disableDrag?: boolean;
}

export const SortableList: React.FC<SortableListProps> = ({ items, onUpdate, renderContent, labelFn, listKey, onRemove, disableDrag = false }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<'before' | 'after' | null>(null);

  const toggleCollapse = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if(disableDrag) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ index, listKey }));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (disableDrag || draggedIndex === null || draggedIndex === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverIndex(index);
    setDragPos(e.clientY < midY ? 'before' : 'after');
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disableDrag || draggedIndex === null || draggedIndex === index) return;
    const newItems = [...items];
    const item = newItems[draggedIndex];
    let insertIndex = index;
    if (dragPos === 'after') insertIndex++;
    newItems.splice(draggedIndex, 1);
    if (draggedIndex < insertIndex) insertIndex--;
    newItems.splice(insertIndex, 0, item);
    onUpdate(newItems);
    resetDrag();
  };

  const resetDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragPos(null);
  };

  return (
    <div 
      className="space-y-4" 
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
    >
      {items.map((item, index) => (
        <div 
          key={item.id}
          className={`sortable-card border-2 border-slate-300 rounded-xl overflow-hidden shadow-md bg-white transition-all ${draggedIndex === index ? 'opacity-40 border-dashed border-cyan-400' : ''}`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={resetDrag}
        >
          <div 
            className={`bg-slate-100 p-4 flex justify-between items-center border-b-2 border-slate-200 ${!disableDrag ? 'cursor-move hover:bg-slate-200 transition-colors' : ''}`}
            draggable={!disableDrag}
            onDragStart={(e) => handleDragStart(e, index)}
            onClick={() => toggleCollapse(item.id)}
            aria-label={!disableDrag ? "Dra for å endre rekkefølge" : undefined}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {!disableDrag && (
                <div className="flex items-center text-slate-400">
                  <GripVertical size={20} />
                </div>
              )}
              <span className="font-bold text-slate-800 text-base truncate select-none">
                {labelFn ? labelFn(item, index) : `Element ${index + 1}`}
              </span>
              {dragOverIndex === index && (
                  <div className={`absolute left-0 right-0 h-1 bg-cyan-600 pointer-events-none ${dragPos === 'before' ? 'top-0' : 'bottom-0'}`}></div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleCollapse(item.id); }} 
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" 
                title={collapsed[item.id] ? "Vis" : "Minimer"}
                aria-label={collapsed[item.id] ? "Vis innhold" : "Minimer innhold"}
              >
                {collapsed[item.id] ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
              </button>
              {onRemove && (
                <DeleteButton onDelete={() => onRemove(item.id)} />
              )}
            </div>
          </div>
          {!collapsed[item.id] && <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">{renderContent(item, index)}</div>}
        </div>
      ))}
    </div>
  );
};