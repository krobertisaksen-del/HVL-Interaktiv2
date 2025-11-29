import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CheckCircle2, X, ChevronRight, Upload, AlertCircle } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

const SafeImage = ({ src, alt, className, style, draggable = true }: { src: string; alt?: string; className?: string; style?: React.CSSProperties, draggable?: boolean }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center p-2 text-center border-2 border-dashed border-red-300 text-red-800 text-[10px] overflow-hidden`} style={style}>
        <div className="opacity-50 mb-1"><AlertCircle size={16} /></div>
        <span className="font-bold leading-none">Blokkert</span>
      </div>
    );
  }
  return <img src={src} alt={alt || "Bilde"} className={className} style={style} onError={() => setError(true)} draggable={draggable} />;
};

export const DragDropPlayer: React.FC<PlayerProps> = ({ data, onSuccess }) => {
  const tasks = useMemo(() => data.tasks || (data.backgroundUrl ? [{id: 'legacy', backgroundUrl: data.backgroundUrl, altText: data.altText, items: data.items, zones: data.zones}] : []), [data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const [items, setItems] = useState<any[]>([]);
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTask = tasks[currentIndex];

  useEffect(() => {
    if (currentTask) {
        setItems(currentTask.items ? currentTask.items.map((i: any) => ({ ...i, x: null, y: null })) : []);
        setFeedback(null);
        setShowResults(false);
    }
  }, [currentTask]);

  const startDragFromBench = (e: React.MouseEvent, item: any) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - itemRect.left;
      const offsetY = e.clientY - itemRect.top;
      const x = ((itemRect.left - containerRect.left) / containerRect.width) * 100;
      const y = ((itemRect.top - containerRect.top) / containerRect.height) * 100;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, x, y } : i));
      setActiveDrag({ id: item.id, offsetX, offsetY });
  };

  const handleMouseDown = (e: React.MouseEvent, id: any) => {
    if(showResults) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setActiveDrag({ id, offsetX, offsetY, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - containerRect.left - activeDrag.offsetX) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top - activeDrag.offsetY) / containerRect.height) * 100;
    setItems(prev => prev.map(i => i.id === activeDrag.id ? { ...i, x, y } : i));
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  const checkAnswer = () => {
    let correctCount = 0;
    const results = items.map(item => {
        if (!item.correctZoneId) return { ...item, isCorrect: true };
        if (item.x === null) return { ...item, isCorrect: false };
        const zone = currentTask.zones.find((z: any) => z.id == item.correctZoneId);
        if (!zone) return { ...item, isCorrect: false };
        const cx = item.x + 5; 
        const cy = item.y + 2.5;
        const inZone = cx >= zone.left && cx <= (zone.left + (zone.width || 15)) && cy >= zone.top && cy <= (zone.top + (zone.height || 10));
        if(inZone) correctCount++;
        return { ...item, isCorrect: inZone };
    });
    
    setItems(results);
    setShowResults(true);
    const requiredCount = items.filter(i => i.correctZoneId).length;
    
    if (correctCount === requiredCount) {
        setFeedback({ type: 'success', msg: 'Fantastisk! Alt er riktig plassert.' });
    } else {
        setFeedback({ type: 'error', msg: `Du har plassert ${correctCount} av ${requiredCount} elementer riktig.` });
    }
  };

  const next = () => {
      if (currentIndex < tasks.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setFinished(true);
      }
  };

  if (finished) {
      if (!onSuccess) return <CompletionScreen onRestart={() => { setFinished(false); setCurrentIndex(0); }} message="Alle oppgaver fullført!" />;
      return <div className="text-center animate-in fade-in"><button onClick={() => onSuccess && onSuccess({})} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold">Fortsett</button></div>;
  }

  if(!currentTask) return <div>Laster oppgave...</div>;

  return (
    <div className="space-y-6 select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h4 className="font-bold text-slate-700">Oppgave {currentIndex + 1} av {tasks.length}</h4>
          <button onClick={() => { setItems(currentTask.items.map((i: any) => ({...i, x: null, y: null}))); setFeedback(null); setShowResults(false); }} className="text-sm text-slate-500 hover:text-cyan-700 underline">Nullstill</button>
      </div>
      
      <div ref={containerRef} className="relative border-2 border-slate-200 rounded-2xl bg-slate-100 min-h-[500px] shadow-inner overflow-hidden">
        <div className="absolute inset-0">
            <SafeImage src={currentTask.backgroundUrl} alt={currentTask.altText || "Bakgrunn"} className="w-full h-full object-cover opacity-90 block pointer-events-none" draggable={false} />
            {(currentTask.zones || []).map((z: any) => (
                <div key={z.id} style={{ top: `${z.top}%`, left: `${z.left}%`, width: `${z.width || 15}%`, height: `${z.height || 10}%` }} className="absolute border-2 border-dashed border-slate-500/30 bg-white/20 rounded-lg flex items-center justify-center group">
                    <span className="text-[10px] font-bold text-slate-600 uppercase bg-white/80 px-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{z.label}</span>
                </div>
            ))}
        </div>
        {items.filter(i => i.x !== null).map(i => (
            <div 
                key={i.id} 
                onMouseDown={(e) => handleMouseDown(e, i.id)} 
                style={{ top: `${i.y}%`, left: `${i.x}%`, position: 'absolute', zIndex: activeDrag?.id === i.id ? 50 : 10 }} 
                className={`cursor-grab active:cursor-grabbing shadow-lg transition-transform transform hover:scale-105 ${showResults ? (i.isCorrect ? 'ring-4 ring-green-500' : 'ring-4 ring-red-500') : ''} rounded-lg`}
                aria-label={`Dra element: ${i.content}`}
            >
                {i.type === 'image' ? <SafeImage src={i.content} alt="Element" className="w-24 h-24 object-cover rounded-lg border-2 border-white bg-white" draggable={false}/> : <div className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-md border border-cyan-800">{i.content}</div>}
                {showResults && (
                    <div className={`absolute -top-2 -right-2 rounded-full p-1 text-white ${i.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {i.isCorrect ? <CheckCircle2 size={12}/> : <X size={12}/>}
                    </div>
                )}
            </div>
        ))}
      </div>
      
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[120px] flex gap-4 flex-wrap items-center justify-center">
         {items.filter(i => i.x === null).length === 0 && <span className="text-slate-400 text-sm italic">Alle elementer er plassert</span>}
         {items.filter(i => i.x === null).map(i => (
             <div key={i.id} onMouseDown={(e) => startDragFromBench(e, i)} className="cursor-grab hover:scale-105 transition-transform" aria-label={`Dra element: ${i.content}`}>
                {i.type === 'image' ? <SafeImage src={i.content} alt="Element" className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 bg-white shadow-sm" draggable={false}/> : <div className="bg-white border-2 border-cyan-100 text-cyan-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:border-cyan-300 hover:shadow-md transition-all">{i.content}</div>}
             </div>
         ))}
      </div>
      
      <div className="flex justify-center items-center pt-4">
         {feedback && <div className={`mr-6 font-bold text-lg animate-in fade-in slide-in-from-bottom-2 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.msg}</div>}
         {!showResults ? (
            <button onClick={checkAnswer} className="px-8 py-3 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 font-bold shadow-lg shadow-cyan-100 transition-transform active:scale-95">Sjekk Svar</button>
         ) : (
            feedback.type === 'success' && (
                <button onClick={next} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold shadow-lg flex items-center gap-2">
                    {currentIndex < tasks.length - 1 ? 'Neste Oppgave' : 'Fullfør'} <ChevronRight size={20}/>
                </button>
            )
         )}
      </div>
    </div>
  );
};