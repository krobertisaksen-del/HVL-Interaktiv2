import React, { useState } from 'react';
import { Hexagon, Pencil, Play, ArrowRight } from 'lucide-react';
import { Activity } from '../types';
import { MCPlayer } from './players/MCPlayer';
import { TFPlayer } from './players/TFPlayer';
import { ClozePlayer } from './players/ClozePlayer';
import { HotspotPlayer } from './players/HotspotPlayer';
import { VideoPlayer } from './players/VideoPlayer';
import { TimelinePlayer } from './players/TimelinePlayer';
import { DragDropPlayer } from './players/DragDropPlayer';
import { MemoryPlayer } from './players/MemoryPlayer';
import { MixedPlayer } from './players/MixedPlayer';

interface PlayerProps {
  activity: Activity;
  onEdit: () => void;
}

export const Player: React.FC<PlayerProps> = ({ activity, onEdit }) => {
  const [started, setStarted] = useState(false);

  const renderActivity = (type: string, data: any) => {
    switch (type) {
        case 'Flervalg': return <MCPlayer data={data} />;
        case 'Sant/Usant': return <TFPlayer data={data} />;
        case 'Fyll inn': return <ClozePlayer data={data} />;
        case 'Bilde Hotspot': return <HotspotPlayer data={data} />;
        case 'Interaktiv Video': return <VideoPlayer data={data} />;
        case 'Tidslinje': return <TimelinePlayer data={data} />;
        case 'Dra og Slipp': return <DragDropPlayer data={data} />;
        case 'Minnespel': return <MemoryPlayer data={data} />;
        case 'Flere saman': return <MixedPlayer data={data} />;
        default: return <div>Ukjent aktivitet</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500 pb-12">
      <main className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <header className="bg-slate-800 text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden gap-4">
          <div className="absolute top-0 right-0 opacity-5 transform translate-x-10 -translate-y-10 pointer-events-none" aria-hidden="true">
             <Hexagon size={200} fill="currentColor" stroke="none"/>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{activity.title}</h2>
            {activity.description && <p className="text-slate-300 text-sm max-w-xl leading-relaxed opacity-90">{activity.description}</p>}
            {!activity.description && <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">{activity.type}</p>}
          </div>
          <button onClick={onEdit} className="relative z-10 text-xs font-bold bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <Pencil size={14}/> Rediger
          </button>
        </header>
        <div className="p-8 min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50">
           {!started ? (
             <div className="text-center max-w-md">
               <div className="w-24 h-24 bg-white border-4 border-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce" aria-hidden="true"><Play size={48} fill="currentColor" className="ml-2" /></div>
               <h3 className="text-2xl font-bold text-slate-800 mb-3">Klar til å starte?</h3>
               <p className="text-slate-500 mb-8">Klikk på knappen under for å begynne aktiviteten.</p>
               <button onClick={() => setStarted(true)} className="px-10 py-4 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-lg rounded-full shadow-xl shadow-cyan-200/50 transition-transform active:scale-95 flex items-center gap-2 mx-auto">
                 Start Aktivitet <ArrowRight size={20}/>
               </button>
             </div>
           ) : (
             <div className="w-full animate-in fade-in duration-500">
               {renderActivity(activity.type, activity.data)}
             </div>
           )}
        </div>
      </main>
    </div>
  );
};