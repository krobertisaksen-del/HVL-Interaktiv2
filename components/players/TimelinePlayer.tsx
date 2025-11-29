import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, AlertCircle } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

const SafeImage = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-red-300 text-red-800 text-xs overflow-hidden`} style={style}>
        <div className="mb-2 opacity-50"><AlertCircle size={24} /></div>
        <span className="font-bold">Bilde blokkert</span>
        <span className="opacity-70 mt-1 text-[10px] leading-tight max-w-[200px]">
           Canvas kan blokkere opplastede bilder. Prøv ekstern URL (https://) istedenfor.
        </span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setError(true)} />;
};

export const TimelinePlayer: React.FC<PlayerProps> = ({ data, onSuccess }) => {
  const events = React.useMemo(() => {
      return [...(data.events || [])].sort((a: any, b: any) => {
          const dateA = parseInt(a.date);
          const dateB = parseInt(b.date);
          if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
          return a.date.localeCompare(b.date, undefined, { numeric: true });
      });
  }, [data.events]);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const currentEvent = events[activeIndex];
  const isLast = activeIndex === events.length - 1;

  if (!events.length) return <div>Ingen hendingar.</div>;

  if (finished) {
      if (!onSuccess) return <CompletionScreen onRestart={() => { setFinished(false); setActiveIndex(0); }} />;
      return <div className="text-center animate-in fade-in"><button onClick={() => onSuccess && onSuccess({})} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold">Fortsett</button></div>;
  }

  return (
    <div className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[400px] animate-in fade-in duration-300 key={activeIndex}">
            {currentEvent.imageUrl && (
                <div className="md:w-1/2 bg-slate-100 h-64 md:h-auto relative">
                      <SafeImage src={currentEvent.imageUrl} className="w-full h-full object-cover absolute inset-0" alt={`Bilde for ${currentEvent.title}`} />
                </div>
            )}
            <div className={`p-8 md:p-12 flex flex-col justify-center ${currentEvent.imageUrl ? 'md:w-1/2' : 'w-full'}`}>
                <div className="text-cyan-600 font-bold text-2xl mb-3">{currentEvent.date}</div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6 leading-tight">{currentEvent.title}</h3>
                <div className="w-10 h-1 bg-cyan-500 mb-6"></div>
                <p className="text-slate-600 leading-relaxed text-lg">{currentEvent.body}</p>
            </div>
        </div>

        <div className="relative px-6">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
            <div className="relative z-10 flex justify-between items-center overflow-x-auto pb-8 pt-8 hide-scrollbar gap-4 snap-x">
                {events.map((evt: any, idx: number) => (
                    <button 
                        key={evt.id} 
                        onClick={() => setActiveIndex(idx)} 
                        className={`flex-shrink-0 flex flex-col items-center gap-2 group outline-none snap-center focus:outline-none`}
                        aria-label={`Gå til ${evt.date}: ${evt.title}`}
                        aria-current={idx === activeIndex ? 'step' : undefined}
                    >
                        <div className={`w-4 h-4 rounded-full transition-all duration-300 ring-4 ${idx === activeIndex ? 'bg-cyan-600 scale-150 ring-cyan-100' : 'bg-slate-300 ring-transparent group-hover:bg-cyan-400'}`} />
                        <span className={`text-xs font-bold transition-colors ${idx === activeIndex ? 'text-cyan-700' : 'text-slate-400 group-hover:text-cyan-600'}`}>{evt.date}</span>
                    </button>
                ))}
            </div>
            
            <div className="flex justify-between mt-4">
                <button onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} className="flex items-center gap-2 px-4 py-2 text-slate-500 disabled:opacity-30 hover:text-cyan-700 hover:bg-slate-100 rounded-lg font-bold transition-colors"><ChevronLeft size={20} /> Forrige</button>
                {isLast ? (
                    <button onClick={() => setFinished(true)} className="px-8 py-2 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 font-bold shadow-md transition-transform active:scale-95">Fullfør</button>
                ) : (
                    <button onClick={() => setActiveIndex(Math.min(events.length - 1, activeIndex + 1))} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg font-bold transition-colors">Neste <ChevronRight size={20} /></button>
                )}
            </div>
        </div>
    </div>
  );
};