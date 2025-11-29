import React, { useState, useEffect } from 'react';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';
import { MCPlayer } from './MCPlayer';
import { TFPlayer } from './TFPlayer';
import { ClozePlayer } from './ClozePlayer';
import { HotspotPlayer } from './HotspotPlayer';
import { VideoPlayer } from './VideoPlayer';
import { TimelinePlayer } from './TimelinePlayer';
import { DragDropPlayer } from './DragDropPlayer';
import { MemoryPlayer } from './MemoryPlayer';

export const MixedPlayer: React.FC<PlayerProps> = ({ data }) => {
  const [index, setIndex] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<any[]>([]); // Accumulate scores/mistakes from each part
  const currentItem = data.items[index];

  useEffect(() => { setStepCompleted(false); }, [index]);

  if (finished) {
      const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
      const totalMax = results.reduce((acc, r) => acc + (r.total || 0), 0);
      const allMistakes = results.flatMap(r => r.mistakes || []);
      
      return <CompletionScreen onRestart={() => { setFinished(false); setIndex(0); setResults([]); }} score={totalScore} total={totalMax} mistakes={allMistakes} message="Gratulerer!" subMessage="Du har fullført alle deloppgavene." />;
  }
  
  if (!currentItem) return <div className="text-center text-slate-400 py-12">Ingen innhold å vise.</div>;

  const handleStepSuccess = (res: any) => {
      setResults(prev => {
          const newResults = [...prev];
          newResults[index] = res || { score: 0, total: 0, mistakes: [] }; // Fallback if undefined
          return newResults;
      });
      setStepCompleted(true);
  };
  
  const next = () => {
    if (index < data.items.length - 1) setIndex(index + 1);
    else setFinished(true);
  };

  const renderSub = (type: string, subData: any) => {
      switch (type) {
        case 'Flervalg': return <MCPlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Sant/Usant': return <TFPlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Fyll inn': return <ClozePlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Bilde Hotspot': return <HotspotPlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Interaktiv Video': return <VideoPlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Tidslinje': return <TimelinePlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Dra og Slipp': return <DragDropPlayer data={subData} onSuccess={handleStepSuccess} />;
        case 'Minnespel': return <MemoryPlayer data={subData} onSuccess={handleStepSuccess} />;
        default: return null;
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Del {index + 1} av {data.items.length}</span>
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stepCompleted ? 'bg-green-500' : 'bg-slate-300'}`}></span>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">{currentItem.type}</span>
        </div>
      </div>
      
      <div className="py-4 relative min-h-[300px]">
          {renderSub(currentItem.type, currentItem.data)}
          {!stepCompleted && (
            <div className="absolute -top-2 -right-2" title="Du må fullføre før du kan gå videre">
              <Lock size={20} className="text-slate-300 opacity-50" />
            </div>
          )}
      </div>
      
      <div className="flex justify-between pt-8 border-t border-slate-200">
        <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors flex items-center gap-2"><ChevronLeft size={18}/> Forrige</button>
        <div className="flex flex-col items-end">
            <button onClick={next} disabled={!stepCompleted} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg">
                {index === data.items.length - 1 ? 'Fullfør' : 'Neste'} <ChevronRight size={18}/>
            </button>
            {!stepCompleted && <span className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-wide animate-pulse">Løs oppgaven for å gå videre</span>}
        </div>
      </div>
    </div>
  );
};