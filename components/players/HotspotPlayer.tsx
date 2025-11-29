import React, { useState, useMemo, useEffect } from 'react';
import { X, CircleCheck, Plus, ChevronRight, Lock, CircleAlert } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

// Helper component for error handling
const SafeImage = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-red-300 text-red-800 text-xs overflow-hidden`} style={style}>
        <div className="mb-2 opacity-50"><CircleAlert size={24} /></div>
        <span className="font-bold">Bilde blokkert</span>
        <span className="opacity-70 mt-1 text-[10px] leading-tight max-w-[200px]">
           Canvas kan blokkere opplastede bilder. Prøv ekstern URL (https://) istedenfor.
        </span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setError(true)} />;
};

export const HotspotPlayer: React.FC<PlayerProps> = ({ data, onSuccess }) => {
  const scenes = useMemo(() => data.scenes || (data.imageUrl ? [{id: 'legacy', imageUrl: data.imageUrl, altText: data.altText, hotspots: data.hotspots}] : []), [data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSpot, setActiveSpot] = useState<number | string | null>(null);
  const [viewedSpots, setViewedSpots] = useState<(number | string)[]>([]); 
  const [finished, setFinished] = useState(false);

  const currentScene = scenes[currentIndex];
  const isSceneFinished = (currentScene?.hotspots || []).every((h: any) => viewedSpots.includes(h.id));

  useEffect(() => {
      setViewedSpots([]);
      setActiveSpot(null);
  }, [currentIndex]);

  const handleSpotClick = (id: number | string) => {
      setActiveSpot(activeSpot === id ? null : id);
      if (!viewedSpots.includes(id)) {
          setViewedSpots(prev => [...prev, id]);
      }
  };

  const next = () => {
      if (currentIndex < scenes.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setFinished(true);
      }
  };
  
  if (finished) {
      if(!onSuccess) return <CompletionScreen onRestart={() => { setFinished(false); setCurrentIndex(0); }} />;
      return <div className="text-center animate-in fade-in"><button onClick={() => onSuccess && onSuccess({})} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold">Fortsett</button></div>;
  }

  if (!currentScene) return <div>Ingen bilder funnet.</div>;

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h4 className="font-bold text-slate-700">Utforsk bildet ({currentIndex + 1} av {scenes.length})</h4>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">{viewedSpots.length} av {(currentScene.hotspots||[]).length} funnet</span>
        </div>
        
        <div className="relative inline-block w-full h-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 group">
            {currentScene.imageUrl ? (
                <SafeImage src={currentScene.imageUrl} alt={currentScene.altText || "Interaktivt Bilde"} className="w-full h-auto block opacity-95 group-hover:opacity-100 transition-opacity" />
            ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">Bilde mangler</div>
            )}
            
            {(currentScene.hotspots || []).map((hs: any) => (
                <React.Fragment key={hs.id}>
                <button 
                    onClick={() => handleSpotClick(hs.id)} 
                    style={{ top: `${hs.top}%`, left: `${hs.left}%` }} 
                    className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 z-10 cursor-pointer ${viewedSpots.includes(hs.id) ? 'bg-green-500 text-white' : 'bg-cyan-600 text-white animate-pulse'} ring-4 ring-white/30`}
                    aria-label={`Hotspot: ${hs.header}`}
                >
                    {activeSpot === hs.id ? <X size={20} /> : (viewedSpots.includes(hs.id) ? <CircleCheck size={20} /> : <Plus size={24} strokeWidth={3} />)}
                </button>
                
                {activeSpot === hs.id && (
                    <div style={{ top: `${Math.min(hs.top + 8, 80)}%`, left: `${Math.min(Math.max(hs.left - 15, 5), 65)}%` }} className="absolute w-72 bg-white p-6 rounded-2xl shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-200 origin-top-left border-l-8 border-cyan-600">
                        <h4 className="font-bold text-lg text-slate-800 mb-2">{hs.header}</h4>
                        <p className="text-slate-600 leading-relaxed">{hs.content}</p>
                    </div>
                )}
                </React.Fragment>
            ))}
            {activeSpot && (<div className="absolute inset-0 z-20 bg-black/10" onClick={() => setActiveSpot(null)} />)}
        </div>

        <div className="flex justify-end pt-4">
            {isSceneFinished ? (
                <button onClick={() => {
                    if (currentIndex === scenes.length - 1) {
                        if (onSuccess) onSuccess({});
                    } else {
                        next();
                    }
                }} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                    {currentIndex < scenes.length - 1 ? 'Neste bilde' : 'Fullfør'} <ChevronRight size={20}/>
                </button>
            ) : (
                <span className="text-sm text-slate-400 font-medium italic flex items-center gap-2"><Lock size={14}/> Finn alle punktene for å gå videre</span>
            )}
        </div>
    </div>
  );
};