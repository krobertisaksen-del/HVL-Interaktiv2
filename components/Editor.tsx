import React, { useState } from 'react';
import { 
  Save, Eye, CircleCheck, CircleHelp, X, Plus, MapPin, Upload, Loader2, 
  Move, Target, Video, CalendarClock, MousePointer2, Grid, Layers, Type
} from 'lucide-react';
import { Activity } from '../types';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { getDefaultData } from '../constants';
import { SortableList } from './ui/SortableList';

interface EditorProps {
  activity: Activity;
  onSave: (activity: Activity) => void;
  onPreview: () => void;
}

export const Editor: React.FC<EditorProps> = ({ activity, onSave, onPreview }) => {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description || '');
  const [data, setData] = useState(activity.data);
  const [saved, setSaved] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [placingId, setPlacingId] = useState<number | string | null>(null);
  const { upload, loading } = useMediaUpload();
  
  const handleSave = () => {
    onSave({ ...activity, title, description, data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!placingId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Update interaction with this placingId
      if (activity.type === 'Interaktiv Video') {
          if (data.scenes) {
              const newScenes = data.scenes.map((scene: any) => ({
                  ...scene,
                  interactions: scene.interactions.map((i: any) => i.id === placingId ? { ...i, x, y } : i)
              }));
              setData({ ...data, scenes: newScenes });
          } else {
              // Legacy flat structure
              const nInt = data.interactions.map((i: any) => i.id === placingId ? { ...i, x, y } : i);
              setData({ ...data, interactions: nInt });
          }
      }
      setPlacingId(null);
  };
  
  // INCREASED PADDING AND TEXT SIZE FOR INPUTS
  const inputClass = "w-full p-5 border border-slate-300 rounded-xl text-xl bg-slate-50 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 transition-all outline-none text-slate-800 placeholder:text-slate-400";
  const labelClass = "block text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-3 ml-1";

  const renderFlervalg = (d: any, update: (d: any) => void) => (
    <div className="space-y-10">
       <SortableList items={d.questions || []} listKey="questions" onUpdate={nq => update({...d, questions: nq})} onRemove={id => update({...d, questions: d.questions.filter((q: any)=>q.id!==id)})} labelFn={(q, i) => `Spørsmål ${i+1}: ${q.question}`} renderContent={(q, idx) => (
           <div className="space-y-8">
               <div>
                   <label className={labelClass}>Spørsmålstekst</label>
                   <textarea className={inputClass} value={q.question} onChange={e => {
                       const nq = [...d.questions]; nq[idx] = { ...nq[idx], question: e.target.value }; update({...d, questions: nq});
                   }} placeholder="Skriv spørsmålet her..." rows={2} />
               </div>
               
               <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                   <label className={labelClass}>Svaralternativ</label>
                   <div className="space-y-4">
                       {q.options.map((opt: any, oIdx: number) => (
                           <div key={opt.id} className="flex items-center gap-5 group">
                               <label title="Marker som riktig svar" className="relative cursor-pointer">
                                   <input type="radio" checked={opt.correct} onChange={() => {
                                       const nq = [...d.questions]; 
                                       nq[idx] = { ...nq[idx], options: nq[idx].options.map((o: any) => ({...o, correct: o.id === opt.id})) }; 
                                       update({...d, questions: nq});
                                   }} className="peer sr-only" />
                                   <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors shadow-sm ${opt.correct ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white hover:border-cyan-400'}`}>
                                       {opt.correct && <CircleCheck size={24} strokeWidth={3} />}
                                   </div>
                               </label>
                               <input type="text" value={opt.text} onChange={e => {
                                   const nq = [...d.questions]; 
                                   const newOpts = [...nq[idx].options];
                                   newOpts[oIdx] = { ...newOpts[oIdx], text: e.target.value };
                                   nq[idx] = { ...nq[idx], options: newOpts };
                                   update({...d, questions: nq});
                               }} className={`flex-1 ${inputClass}`} placeholder={`Alternativ ${oIdx + 1}`} />
                               <button onClick={() => {
                                   const nq = [...d.questions]; 
                                   nq[idx] = { ...nq[idx], options: nq[idx].options.filter((o: any) => o.id !== opt.id) };
                                   update({...d, questions: nq});
                               }} className="text-slate-300 hover:text-red-500 transition-colors p-3 hover:bg-red-50 rounded-xl"><X size={28}/></button>
                           </div>
                       ))}
                   </div>
                   <button onClick={() => {
                       const nq = [...d.questions]; 
                       nq[idx] = { ...nq[idx], options: [...nq[idx].options, {id: Date.now(), text: '', correct: false}] };
                       update({...d, questions: nq});
                   }} className="text-lg text-cyan-700 font-bold hover:underline mt-6 flex items-center gap-2 px-2"><Plus size={24}/> Legg til alternativ</button>
               </div>
           </div>
       )} />
       <button onClick={() => {
           const now = Date.now();
           update({
               ...d, 
               questions: [
                   ...(d.questions||[]), 
                   {
                       id: now, 
                       question:'', 
                       options:[
                           {id: now+1, text:'', correct:false},
                           {id: now+2, text:'', correct:false},
                           {id: now+3, text:'', correct:false}
                       ]
                   }
               ]
           });
       }} className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"><Plus size={32}/> Nytt spørsmål</button>
    </div>
  );

  const renderHotspot = (d: any, update: (d: any) => void) => {
    // Migration for existing single image format
    const scenes = d.scenes || (d.imageUrl ? [{id: 'legacy', imageUrl: d.imageUrl, altText: d.altText, hotspots: d.hotspots}] : []);

    return (
      <div className="space-y-10">
          <SortableList 
              items={scenes} 
              listKey="hotspot-scenes" 
              onUpdate={n => update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined})} 
              onRemove={id => update({...d, scenes: scenes.filter((s: any) => s.id !== id)})}
              labelFn={(s, i) => s.altText ? s.altText : `Bilde ${i+1}`}
              renderContent={(scene, idx) => (
                  <div className="space-y-8">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                          <label className={labelClass}>Bildekilde</label>
                          <div className="flex gap-4 mb-6">
                              <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={scene.imageUrl?.startsWith('data:') ? '' : (scene.imageUrl || '')} 
                                    onChange={e => {
                                        const n = [...scenes];
                                        n[idx] = { ...n[idx], imageUrl: e.target.value };
                                        update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                                    }} 
                                    className={`${inputClass} ${scene.imageUrl?.startsWith('data:') ? 'text-slate-400 italic bg-slate-100' : ''}`} 
                                    placeholder={scene.imageUrl?.startsWith('data:') ? "Bilde lastet opp (lagret i fil)" : "Bilde URL..."}
                                    disabled={!!scene.imageUrl?.startsWith('data:')}
                                  />
                                  {scene.imageUrl && (
                                    <button 
                                        onClick={() => {
                                            const n = [...scenes];
                                            n[idx] = { ...n[idx], imageUrl: '' };
                                            update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Fjern bilde"
                                    >
                                        <X size={20}/>
                                    </button>
                                  )}
                              </div>
                              <label className="px-8 py-3 bg-white border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-cyan-50 hover:border-cyan-300 transition-colors text-cyan-700 flex items-center gap-3 font-bold text-lg">
                                  {loading ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>} Last opp
                                  <input type="file" className="hidden" onChange={e => upload(e.target.files && e.target.files[0], res => {
                                      const n = [...scenes];
                                      n[idx] = { ...n[idx], imageUrl: res };
                                      update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                                  }, 'image')} disabled={loading} />
                              </label>
                          </div>
                          <input 
                            type="text" 
                            value={scene.altText || ''} 
                            onChange={e => {
                                const n = [...scenes];
                                n[idx] = { ...n[idx], altText: e.target.value };
                                update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                            }} 
                            className={inputClass} 
                            placeholder="Beskrivelse for skjermlesere (alt-tekst)..." 
                          />
                      </div>
                      
                      <div className="relative border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 min-h-[500px] cursor-crosshair shadow-inner group" onClick={e => {
                          e.preventDefault();
                          if((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return; // Prevent accidental creation when clicking existing
                          const rect = e.currentTarget.getBoundingClientRect();
                          const newHs = { id: Date.now(), top: ((e.clientY - rect.top)/rect.height)*100, left: ((e.clientX - rect.left)/rect.width)*100, header: 'Nytt punkt', content: '' };
                          const n = [...scenes];
                          n[idx] = { ...n[idx], hotspots: [...(n[idx].hotspots||[]), newHs] };
                          update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                      }}>
                          {scene.imageUrl ? <img src={scene.imageUrl} alt={scene.altText} className="w-full h-auto pointer-events-none" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xl font-bold">Last opp et bilde for å starte</div>}
                          {(scene.hotspots||[]).map((hs: any) => (
                              <button key={hs.id} onClick={e => e.stopPropagation()} style={{top: `${hs.top}%`, left: `${hs.left}%`}} className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform ring-4 ring-white"><Plus size={24} strokeWidth={3}/></button>
                          ))}
                          <div className="absolute bottom-6 right-6 bg-black/70 text-white text-base font-bold px-6 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Klikk på bildet for å legge til punkt</div>
                      </div>

                      {scene.hotspots && scene.hotspots.length > 0 && (
                          <div className="border-t border-slate-200 pt-8">
                              <h5 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-3"><MapPin size={24}/> Rediger punkter</h5>
                              <SortableList items={scene.hotspots} listKey={`hotspots-${scene.id}`} onUpdate={newHsList => {
                                  const n = [...scenes];
                                  n[idx] = { ...n[idx], hotspots: newHsList };
                                  update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                              }} onRemove={hsId => {
                                  const n = [...scenes];
                                  n[idx] = { ...n[idx], hotspots: n[idx].hotspots.filter((h: any) => h.id !== hsId) };
                                  update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                              }} labelFn={h => h.header} renderContent={(hs, hsIdx) => (
                                  <div className="grid gap-6">
                                      <div>
                                          <label className={labelClass}>Tittel</label>
                                          <input value={hs.header} onChange={e => {
                                              const n = [...scenes];
                                              const updatedHotspots = [...n[idx].hotspots];
                                              updatedHotspots[hsIdx] = { ...updatedHotspots[hsIdx], header: e.target.value };
                                              n[idx] = { ...n[idx], hotspots: updatedHotspots };
                                              update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                                          }} className={inputClass} placeholder="Tittel" />
                                      </div>
                                      <div>
                                          <label className={labelClass}>Innhold</label>
                                          <textarea value={hs.content} onChange={e => {
                                              const n = [...scenes];
                                              const updatedHotspots = [...n[idx].hotspots];
                                              updatedHotspots[hsIdx] = { ...updatedHotspots[hsIdx], content: e.target.value };
                                              n[idx] = { ...n[idx], hotspots: updatedHotspots };
                                              update({...d, scenes: n, imageUrl: undefined, altText: undefined, hotspots: undefined});
                                          }} className={inputClass} rows={4} placeholder="Hva skal vises når brukeren klikker?" />
                                      </div>
                                  </div>
                              )} />
                          </div>
                      )}
                  </div>
              )} 
          />
          
          <button 
              onClick={() => update({...d, scenes: [...scenes, {id: Date.now(), imageUrl: '', altText: '', hotspots: []}], imageUrl: undefined, altText: undefined, hotspots: undefined})} 
              className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"
          >
              <Plus size={32}/> Legg til bilde
          </button>
      </div>
    );
  };

  const renderVideo = (d: any, update: (d: any) => void) => {
    const scenes = d.scenes || (d.videoUrl ? [{id: 'legacy', videoUrl: d.videoUrl, interactions: d.interactions}] : []);
    return (
      <div className="space-y-10">
          <SortableList 
              items={scenes} 
              listKey="video-scenes" 
              onUpdate={n => update({...d, scenes: n, videoUrl: undefined, interactions: undefined})} 
              onRemove={id => update({...d, scenes: scenes.filter((s: any) => s.id !== id)})}
              labelFn={(s, i) => `Video ${i+1}`}
              renderContent={(scene, idx) => (
                  <div className="space-y-10">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                          <label className={labelClass}>Videokilde</label>
                          <div className="flex gap-4">
                              <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={scene.videoUrl?.startsWith('data:') ? '' : (scene.videoUrl || '')} 
                                    onChange={e => {
                                        const n = [...scenes];
                                        n[idx] = { ...n[idx], videoUrl: e.target.value };
                                        update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                    }} 
                                    className={`${inputClass} ${scene.videoUrl?.startsWith('data:') ? 'text-slate-400 italic bg-slate-100' : ''}`} 
                                    placeholder={scene.videoUrl?.startsWith('data:') ? "Video lastet opp (lagret i fil)" : "Video URL (mp4, webm)..."}
                                    disabled={!!scene.videoUrl?.startsWith('data:')}
                                />
                                {scene.videoUrl && (
                                    <button 
                                        onClick={() => {
                                            const n = [...scenes];
                                            n[idx] = { ...n[idx], videoUrl: '' };
                                            update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Fjern video"
                                    >
                                        <X size={20}/>
                                    </button>
                                )}
                              </div>
                              <label className="px-8 py-3 bg-white border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-cyan-50 hover:border-cyan-300 transition-colors text-cyan-700 flex items-center gap-3 font-bold text-lg">
                                  {loading ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>} Video
                                  <input type="file" className="hidden" accept="video/*" onChange={e => upload(e.target.files && e.target.files[0], res => {
                                      const n = [...scenes];
                                      n[idx] = { ...n[idx], videoUrl: res };
                                      update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                  }, 'video')} disabled={loading} />
                              </label>
                          </div>
                          {scene.videoUrl && (
                            <div className="mt-8 relative group">
                               <label className={labelClass}>Forhåndsvisning (Klikk for å plassere hotspot)</label>
                               <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black" onClick={handleVideoClick}>
                                   <video 
                                     src={scene.videoUrl} 
                                     controls={!placingId} 
                                     className={`w-full max-h-[600px] ${placingId ? 'cursor-crosshair opacity-75' : ''}`}
                                     onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                                   />
                                   {scene.interactions?.filter((i: any) => i.useHotspot && i.x && i.y).map((i: any) => (
                                       <div key={i.id} style={{left: `${i.x}%`, top: `${i.y}%`}} className="absolute w-10 h-10 -ml-5 -mt-5 bg-cyan-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center pointer-events-none">
                                           <span className="text-xs text-white font-bold">{Math.round(i.time)}s</span>
                                       </div>
                                   ))}
                                   {placingId && (
                                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                                           <span className="bg-white px-8 py-4 rounded-full font-bold text-xl shadow-xl text-cyan-800 animate-bounce">Klikk på videoen for å plassere oppgaven</span>
                                       </div>
                                   )}
                               </div>
                               {videoDuration && <p className="text-lg text-slate-500 mt-3 font-medium">Video lengde: {Math.floor(videoDuration)} sekunder</p>}
                            </div>
                          )}
                      </div>

                      <div>
                          <h5 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-3"><Move size={24}/> Interaksjoner i videoen</h5>
                          <SortableList items={scene.interactions || []} listKey={`video-interactions-${scene.id}`} onUpdate={nInt => {
                              const n = [...scenes];
                              n[idx] = { ...n[idx], interactions: nInt };
                              update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                          }} onRemove={intId => {
                              const n = [...scenes];
                              n[idx] = { ...n[idx], interactions: n[idx].interactions.filter((i: any) => i.id !== intId) };
                              update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                          }} labelFn={i => `${i.time}s - ${i.type}`} renderContent={(intr, intIdx) => (
                              <div className="space-y-8 border-l-4 border-cyan-500 pl-8 ml-2">
                                  <div className="flex gap-8 items-start flex-wrap">
                                      <div className="w-40">
                                          <label className={labelClass}>Tid (sek)</label>
                                          <input 
                                            type="number" 
                                            min="0" 
                                            max={videoDuration ? Math.floor(videoDuration) : undefined}
                                            value={intr.time} 
                                            onChange={e => {
                                              const n = [...scenes]; 
                                              let val = parseFloat(e.target.value);
                                              if (isNaN(val)) val = 0;
                                              if (val < 0) val = 0;
                                              if (videoDuration && val > videoDuration) val = Math.floor(videoDuration);
                                              const updatedInts = [...n[idx].interactions];
                                              updatedInts[intIdx] = { ...updatedInts[intIdx], time: val };
                                              n[idx] = { ...n[idx], interactions: updatedInts };
                                              update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                            }} 
                                            className={inputClass} 
                                          />
                                      </div>
                                      <div className="flex-1 min-w-[250px]">
                                          <label className={labelClass}>Type oppgave</label>
                                          <select value={intr.type} onChange={e => {
                                              const n = [...scenes]; 
                                              const updatedInts = [...n[idx].interactions];
                                              updatedInts[intIdx] = { 
                                                  ...updatedInts[intIdx], 
                                                  type: e.target.value,
                                                  data: getDefaultData(e.target.value)
                                              };
                                              n[idx] = { ...n[idx], interactions: updatedInts };
                                              update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                          }} className={inputClass}>
                                              <option value="Flervalg">Flervalg</option><option value="Sant/Usant">Sant/Usant</option><option value="Fyll inn">Fyll inn</option>
                                          </select>
                                      </div>
                                      <div className="w-full sm:w-auto flex items-end pb-1.5">
                                          <label className="flex items-center gap-3 cursor-pointer text-lg text-slate-700 bg-white px-6 py-4 rounded-xl border border-slate-200 hover:border-cyan-400 transition-colors font-bold select-none h-full mt-1">
                                              <input type="checkbox" checked={intr.useHotspot || false} onChange={(e) => {
                                                  const n = [...scenes];
                                                  const updatedInts = [...n[idx].interactions];
                                                  updatedInts[intIdx] = { ...updatedInts[intIdx], useHotspot: e.target.checked };
                                                  n[idx] = { ...n[idx], interactions: updatedInts };
                                                  update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                              }} className="w-6 h-6 text-cyan-600 rounded" />
                                              <span>Bruk Hotspot</span>
                                          </label>
                                      </div>
                                      {intr.useHotspot && (
                                          <div className="w-full flex items-center gap-6 bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                                              <button 
                                                  onClick={() => setPlacingId(placingId === intr.id ? null : intr.id)} 
                                                  className={`px-6 py-3 rounded-xl text-lg font-bold flex items-center gap-3 transition-colors ${placingId === intr.id ? 'bg-cyan-600 text-white' : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-100'}`}
                                              >
                                                  <Target size={20}/> {placingId === intr.id ? 'Avbryt plassering' : (intr.x ? 'Endre plassering' : 'Plasser i video')}
                                              </button>
                                              {intr.x ? <span className="text-base text-green-700 font-bold flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-green-100"><CircleCheck size={20}/> Plassert</span> : <span className="text-base text-orange-700 font-bold bg-white px-4 py-2 rounded-full border border-orange-100">Må plasseres</span>}
                                          </div>
                                      )}
                                  </div>
                                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                                      {intr.type === 'Flervalg' && renderFlervalg(intr.data, nd => {
                                          const n = [...scenes]; 
                                          const updatedInts = [...n[idx].interactions];
                                          updatedInts[intIdx] = { ...updatedInts[intIdx], data: nd };
                                          n[idx] = { ...n[idx], interactions: updatedInts };
                                          update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                      })}
                                      {intr.type === 'Sant/Usant' && renderTrueFalse(intr.data, nd => {
                                          const n = [...scenes]; 
                                          const updatedInts = [...n[idx].interactions];
                                          updatedInts[intIdx] = { ...updatedInts[intIdx], data: nd };
                                          n[idx] = { ...n[idx], interactions: updatedInts };
                                          update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                      })}
                                      {intr.type === 'Fyll inn' && renderCloze(intr.data, nd => {
                                          const n = [...scenes]; 
                                          const updatedInts = [...n[idx].interactions];
                                          updatedInts[intIdx] = { ...updatedInts[intIdx], data: nd };
                                          n[idx] = { ...n[idx], interactions: updatedInts };
                                          update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                                      })}
                                  </div>
                              </div>
                          )} />
                          <button onClick={() => {
                              const n = [...scenes];
                              n[idx] = { ...n[idx], interactions: [...(n[idx].interactions||[]), {id: Date.now(), time: 0, type: 'Flervalg', data: getDefaultData('Flervalg')}] };
                              update({...d, scenes: n, videoUrl: undefined, interactions: undefined});
                          }} className="w-full mt-8 py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"><Plus size={32}/> Legg til interaksjon</button>
                      </div>
                  </div>
              )} 
          />
          <button 
              onClick={() => update({...d, scenes: [...scenes, {id: Date.now(), videoUrl: '', interactions: []}], videoUrl: undefined, interactions: undefined})} 
              className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"
          >
              <Plus size={32}/> Legg til video
          </button>
      </div>
    );
  };

  const renderTimeline = (d: any, update: (d: any) => void) => (
    <div className="space-y-10">
        <div>
            <label className={labelClass}>Overskrift for tidslinjen</label>
            <input type="text" value={d.headline} onChange={e => update({...d, headline: e.target.value})} className={`font-bold text-2xl ${inputClass}`} placeholder="F.eks. 'Andre Verdenskrig'" />
        </div>
        <SortableList items={d.events || []} listKey="events" onUpdate={n => update({...d, events: n})} onRemove={id => update({...d, events: d.events.filter((ev: any)=>ev.id!==id)})} labelFn={ev => `${ev.date} - ${ev.title}`} renderContent={(ev, idx) => (
            <div className="grid gap-8 md:grid-cols-[200px_1fr]">
                <div className="space-y-4">
                    <div className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden relative hover:border-cyan-300 transition-colors group">
                        {ev.imageUrl ? (
                           <img src={ev.imageUrl} className="w-full h-full object-cover"/>
                        ) : (
                           <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-cyan-600">
                               <Upload size={32}/>
                               <span className="text-sm uppercase font-bold mt-3">Bilde</span>
                               <input type="file" className="hidden" accept="image/*" onChange={e => upload(e.target.files && e.target.files[0], res => {
                                   const n = [...d.events]; 
                                   n[idx] = { ...n[idx], imageUrl: res }; 
                                   update({...d, events: n});
                               }, 'image')} />
                           </label>
                        )}
                        {ev.imageUrl && <button onClick={() => {const n = [...d.events]; n[idx] = { ...n[idx], imageUrl: '' }; update({...d, events: n})}} className="absolute top-3 right-3 bg-white rounded-full shadow text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><X size={20}/></button>}
                    </div>
                    {/* HIDDEN INPUT FOR DEV/DEBUG or manual URL */}
                    <input 
                      type="text" 
                      value={ev.imageUrl?.startsWith('data:') ? '' : (ev.imageUrl || '')} 
                      onChange={e => {
                          const n = [...d.events]; 
                          n[idx] = { ...n[idx], imageUrl: e.target.value }; 
                          update({...d, events: n});
                      }} 
                      className={`text-xs p-2 w-full border border-slate-200 rounded ${ev.imageUrl?.startsWith('data:') ? 'hidden' : ''}`} 
                      placeholder="URL..." 
                    />
                </div>
                <div className="space-y-6">
                    <div className="flex gap-6">
                        <div className="w-1/3">
                            <label className={labelClass}>Dato/År</label>
                            <input type="text" value={ev.date} onChange={e => {const n = [...d.events]; n[idx] = { ...n[idx], date: e.target.value }; update({...d, events: n})}} className={inputClass} placeholder="2023" />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>Tittel</label>
                            <input type="text" value={ev.title} onChange={e => {const n = [...d.events]; n[idx] = { ...n[idx], title: e.target.value }; update({...d, events: n})}} className={`font-bold ${inputClass}`} placeholder="Hendelse..." />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Beskrivelse</label>
                        <textarea value={ev.body} onChange={e => {const n = [...d.events]; n[idx] = { ...n[idx], body: e.target.value }; update({...d, events: n})}} className={inputClass} rows={4} placeholder="Hva skjedde?" />
                    </div>
                </div>
            </div>
        )} />
        <button onClick={() => update({...d, events: [...(d.events||[]), {id: Date.now(), date: '', title: '', body: '', imageUrl: ''}]})} className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"><Plus size={32}/> Legg til hendelse</button>
    </div>
  );

  const renderDragDrop = (d: any, update: (d: any) => void) => {
    const tasks = d.tasks || (d.backgroundUrl ? [{id: 'legacy', backgroundUrl: d.backgroundUrl, altText: d.altText, items: d.items, zones: d.zones}] : []);
    
    return (
      <div className="space-y-10">
          <SortableList 
              items={tasks} 
              listKey="dnd-tasks" 
              onUpdate={n => update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined})} 
              onRemove={id => update({...d, tasks: tasks.filter((t: any) => t.id !== id)})}
              labelFn={(t, i) => `Oppgave ${i+1}`}
              renderContent={(task, idx) => (
                  <div className="space-y-10">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                          <label className={labelClass}>Bakgrunnsbilde</label>
                          <div className="flex gap-4 mb-6">
                              <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={task.backgroundUrl?.startsWith('data:') ? '' : (task.backgroundUrl || '')} 
                                    onChange={e => {
                                        const n = [...tasks];
                                        n[idx] = { ...n[idx], backgroundUrl: e.target.value };
                                        update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                    }} 
                                    className={`${inputClass} ${task.backgroundUrl?.startsWith('data:') ? 'text-slate-400 italic bg-slate-100' : ''}`} 
                                    placeholder={task.backgroundUrl?.startsWith('data:') ? "Bilde lastet opp (lagret i fil)" : "URL..."}
                                    disabled={!!task.backgroundUrl?.startsWith('data:')}
                                  />
                                  {task.backgroundUrl && (
                                    <button 
                                        onClick={() => {
                                            const n = [...tasks];
                                            n[idx] = { ...n[idx], backgroundUrl: '' };
                                            update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Fjern bilde"
                                    >
                                        <X size={20}/>
                                    </button>
                                  )}
                              </div>
                              <label className="px-8 py-3 bg-white border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-cyan-50 hover:border-cyan-300 transition-colors text-cyan-700 flex items-center gap-3 font-bold text-lg">
                                  {loading ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>} Last opp
                                  <input type="file" className="hidden" onChange={e => upload(e.target.files && e.target.files[0], res => {
                                      const n = [...tasks];
                                      n[idx] = { ...n[idx], backgroundUrl: res };
                                      update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                  }, 'image')} disabled={loading} />
                              </label>
                          </div>
                          <input 
                            type="text" 
                            value={task.altText || ''} 
                            onChange={e => {
                                const n = [...tasks];
                                n[idx] = { ...n[idx], altText: e.target.value };
                                update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                            }} 
                            className={inputClass} 
                            placeholder="Alternativ tekst..." 
                          />
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                               <label className={labelClass}>Definer Soner (Klikk på bildet)</label>
                               <span className="text-base font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full">Soner er der elementene skal slippes.</span>
                          </div>
                          <div className="relative border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 min-h-[500px] cursor-crosshair shadow-inner" onClick={e => {
                               if(e.target === e.currentTarget) {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const newZone = { id: Date.now(), label: 'Ny Sone', top: ((e.clientY - rect.top)/rect.height)*100, left: ((e.clientX - rect.left)/rect.width)*100, width: 15, height: 10 };
                                   const n = [...tasks];
                                   n[idx] = { ...n[idx], zones: [...(n[idx].zones||[]), newZone] };
                                   update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                               }
                          }}>
                              <img src={task.backgroundUrl} alt={task.altText} className="w-full h-auto pointer-events-none opacity-60" />
                              {(task.zones||[]).map((z: any) => (
                                  <div key={z.id} style={{top: `${z.top}%`, left: `${z.left}%`, width: `${z.width}%`, height: `${z.height}%`}} className="absolute border-4 border-cyan-500 bg-white/80 flex items-center justify-center shadow-lg"><span className="text-sm font-bold px-2 truncate">{z.label}</span></div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="border border-slate-200 p-8 rounded-3xl bg-white">
                              <h5 className="text-lg font-bold text-cyan-800 mb-6 border-b border-cyan-100 pb-4">Soner</h5>
                              <SortableList items={task.zones||[]} listKey={`dnd-zones-${task.id}`} onUpdate={nZones => {
                                  const n = [...tasks];
                                  n[idx] = { ...n[idx], zones: nZones };
                                  update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                              }} onRemove={zId => {
                                  const n = [...tasks];
                                  n[idx] = { ...n[idx], zones: n[idx].zones.filter((z: any) => z.id !== zId) };
                                  update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                              }} labelFn={z => z.label} renderContent={(z, zIdx) => (
                                  <div>
                                      <label className={labelClass}>Navn på sone</label>
                                      <input value={z.label} onChange={e => {
                                          const n = [...tasks];
                                          const newZones = [...n[idx].zones];
                                          newZones[zIdx] = { ...newZones[zIdx], label: e.target.value };
                                          n[idx] = { ...n[idx], zones: newZones };
                                          update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                      }} className={inputClass} />
                                  </div>
                              )} />
                          </div>
                          <div className="border border-slate-200 p-8 rounded-3xl bg-white">
                              <h5 className="text-lg font-bold text-cyan-800 mb-6 border-b border-cyan-100 pb-4">Elementer</h5>
                              <SortableList items={task.items||[]} listKey={`dnd-items-${task.id}`} onUpdate={nItems => {
                                  const n = [...tasks];
                                  n[idx] = { ...n[idx], items: nItems };
                                  update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                              }} onRemove={iId => {
                                  const n = [...tasks];
                                  n[idx] = { ...n[idx], items: n[idx].items.filter((i: any) => i.id !== iId) };
                                  update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                              }} labelFn={i => i.type === 'image' ? 'Bilde' : i.content} renderContent={(itm, iIdx) => (
                                  <div className="space-y-6">
                                      <div className="flex gap-4 text-base mb-2">
                                          <button onClick={() => {
                                              const n = [...tasks];
                                              const updatedItems = [...n[idx].items];
                                              updatedItems[iIdx] = { ...updatedItems[iIdx], type: 'text', content: '' };
                                              n[idx] = { ...n[idx], items: updatedItems };
                                              update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                          }} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${itm.type !== 'image' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Tekst</button>
                                          <button onClick={() => {
                                              const n = [...tasks];
                                              const updatedItems = [...n[idx].items];
                                              updatedItems[iIdx] = { ...updatedItems[iIdx], type: 'image', content: '' };
                                              n[idx] = { ...n[idx], items: updatedItems };
                                              update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                          }} className={`flex-1 py-3 rounded-lg font-bold transition-colors ${itm.type === 'image' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Bilde</button>
                                      </div>
                                      
                                      {itm.type === 'image' ? (
                                           <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-cyan-300 transition-colors">
                                               {itm.content ? <img src={itm.content} className="h-32 object-contain" /> : <Upload size={40} className="text-slate-300"/>}
                                               <span className="text-lg font-bold text-slate-500">Velg bilde</span>
                                               <input type="file" className="hidden" accept="image/*" onChange={e => upload(e.target.files && e.target.files[0], res => {
                                                   const n = [...tasks];
                                                   const updatedItems = [...n[idx].items];
                                                   updatedItems[iIdx] = { ...updatedItems[iIdx], content: res };
                                                   n[idx] = { ...n[idx], items: updatedItems };
                                                   update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                               }, 'image')} />
                                           </label>
                                      ) : (
                                           <input value={itm.content} onChange={e => {
                                               const n = [...tasks];
                                               const updatedItems = [...n[idx].items];
                                               updatedItems[iIdx] = { ...updatedItems[iIdx], content: e.target.value };
                                               n[idx] = { ...n[idx], items: updatedItems };
                                               update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                           }} className={inputClass} placeholder="Tekst..." />
                                      )}
                                      
                                      <div>
                                          <label className={labelClass}>Korrekt Sone</label>
                                          <select value={itm.correctZoneId || ''} onChange={e => {
                                              const n = [...tasks];
                                              const updatedItems = [...n[idx].items];
                                              updatedItems[iIdx] = { ...updatedItems[iIdx], correctZoneId: e.target.value };
                                              n[idx] = { ...n[idx], items: updatedItems };
                                              update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                                          }} className={inputClass}>
                                              <option value="">-- Ingen (kan ikke plasseres) --</option>
                                              {(task.zones||[]).map((z: any) => <option key={z.id} value={z.id}>{z.label}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              )} />
                              <button onClick={() => {
                                  const n = [...tasks];
                                  n[idx] = { ...n[idx], items: [...(n[idx].items||[]), {id: Date.now(), type: 'text', content: ''}] };
                                  update({...d, tasks: n, backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined});
                              }} className="w-full py-4 text-lg font-bold text-cyan-700 bg-cyan-50 rounded-xl hover:bg-cyan-100 mt-6">+ Nytt element</button>
                          </div>
                      </div>
                  </div>
              )} 
          />
          
          <button 
              onClick={() => update({...d, tasks: [...tasks, {id: Date.now(), backgroundUrl: '', altText: '', items: [], zones: []}], backgroundUrl: undefined, altText: undefined, items: undefined, zones: undefined})} 
              className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"
          >
              <Plus size={32}/> Legg til oppgave
          </button>
      </div>
    );
  };

  const renderMemory = (d: any, update: (d: any) => void) => (
    <div className="space-y-10">
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-8">
                <h5 className="font-bold text-slate-700 text-xl">Kortpar</h5>
                <span className="text-base font-bold text-white bg-slate-400 px-4 py-2 rounded-full">{(d.cards||[]).length / 2} par totalt</span>
            </div>
            <SortableList items={d.cards || []} listKey="memory" onUpdate={n => update({...d, cards: n})} onRemove={id => update({...d, cards: d.cards.filter((c: any)=>c.id!==id)})} labelFn={c => `Par ${c.pairId}: ${c.content}`} renderContent={(c, idx) => (
                <div className="flex gap-6 items-end">
                    <div className="flex-1">
                        <label className={labelClass}>Innhold (Tekst eller Emoji)</label>
                        <input value={c.content} onChange={e => {const n = [...d.cards]; n[idx] = { ...n[idx], content: e.target.value }; update({...d, cards: n})}} className={`flex-1 ${inputClass}`} />
                    </div>
                    <div className="w-32 text-center pb-3">
                        <span className="text-base font-bold text-cyan-600 bg-cyan-100 px-4 py-3 rounded-xl block">ID: {c.pairId}</span>
                    </div>
                </div>
            )} />
        </div>
        <button onClick={() => {
            const maxPairId = (d.cards || []).reduce((max: number, card: any) => Math.max(max, card.pairId || 0), 0);
            const pairId = maxPairId + 1;
            update({...d, cards: [...(d.cards||[]), {id: Date.now(), content: '', pairId}, {id: Date.now()+1, content: '', pairId}]})
        }} className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"><Plus size={32}/> Legg til nytt par</button>
    </div>
  );

  const renderTrueFalse = (d: any, update: (d: any) => void) => {
      const questions = d.questions || (d.question ? [{id: 'legacy', question: d.question, isTrue: d.isTrue}] : []);

      return (
          <div className="space-y-10">
              <SortableList 
                  items={questions} 
                  listKey="tf-questions" 
                  onUpdate={n => update({...d, questions: n, question: undefined, isTrue: undefined})} 
                  onRemove={id => update({...d, questions: questions.filter((q: any) => q.id !== id)})}
                  labelFn={(q, i) => `Påstand ${i+1}`}
                  renderContent={(q, idx) => (
                      <div className="space-y-8">
                          <div>
                             <label className={labelClass}>Påstand</label>
                             <textarea 
                                className={`w-full text-xl font-medium ${inputClass}`} 
                                rows={2} 
                                value={q.question} 
                                onChange={e => {
                                    const n = [...questions]; 
                                    n[idx] = { ...n[idx], question: e.target.value }; 
                                    update({...d, questions: n, question: undefined, isTrue: undefined});
                                }} 
                                placeholder="Skriv en påstand..." 
                             />
                          </div>
                          <div>
                             <label className={labelClass}>Er påstanden sann?</label>
                             <div className="flex gap-6 mt-3">
                              <button 
                                onClick={() => {const n = [...questions]; n[idx] = { ...n[idx], isTrue: true }; update({...d, questions: n})}} 
                                className={`flex-1 py-6 border rounded-2xl font-bold text-2xl transition-all flex items-center justify-center gap-3 ${q.isTrue ? 'bg-teal-600 text-white border-teal-600 ring-4 ring-teal-100' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'}`}
                              >
                                <CircleCheck size={32}/> Sant
                              </button>
                              <button 
                                onClick={() => {const n = [...questions]; n[idx] = { ...n[idx], isTrue: false }; update({...d, questions: n})}} 
                                className={`flex-1 py-6 border rounded-2xl font-bold text-2xl transition-all flex items-center justify-center gap-3 ${!q.isTrue ? 'bg-red-600 text-white border-red-600 ring-4 ring-red-100' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'}`}
                              >
                                <X size={32}/> Usant
                              </button>
                             </div>
                          </div>
                      </div>
                  )}
              />
              
              <button 
                  onClick={() => update({...d, questions: [...questions, {id: Date.now(), question: '', isTrue: true}], question: undefined, isTrue: undefined})} 
                  className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"
              >
                  <Plus size={32}/> Legg til påstand
              </button>
          </div>
      );
  };

  const renderCloze = (d: any, update: (d: any) => void) => {
      const blocks = d.blocks || (d.text ? [{id: 'legacy', text: d.text}] : []);

      return (
          <div className="space-y-8">
              <div className="bg-cyan-50 border border-cyan-200 p-8 rounded-3xl text-cyan-900 text-xl mb-6 flex gap-6">
                  <CircleHelp className="flex-shrink-0 mt-1" size={32}/>
                  <p>Skriv setninger der ord som skal fylles inn er markert med stjerner. <br/>Eks: "Norges hovedstad er *Oslo*."</p>
              </div>
              
              <SortableList 
                  items={blocks} 
                  listKey="cloze-blocks" 
                  onUpdate={n => update({...d, blocks: n, text: undefined})} 
                  onRemove={id => update({...d, blocks: blocks.filter((b: any) => b.id !== id)})}
                  labelFn={(b, i) => `Oppgave ${i+1}`}
                  renderContent={(b, idx) => (
                      <textarea 
                          className={`w-full p-8 font-mono text-xl leading-loose ${inputClass}`} 
                          rows={6} 
                          value={b.text} 
                          onChange={e => {
                              const n = [...blocks]; 
                              n[idx] = { ...n[idx], text: e.target.value }; 
                              update({...d, blocks: n, text: undefined});
                          }} 
                          placeholder="Tekst med *svar*..." 
                      />
                  )}
              />
              
              <button 
                  onClick={() => update({...d, blocks: [...blocks, {id: Date.now(), text: ''}], text: undefined})} 
                  className="w-full py-6 border-4 border-dashed border-cyan-200 bg-cyan-50/50 text-cyan-700 rounded-3xl hover:bg-cyan-100 hover:border-cyan-300 transition-all flex items-center justify-center gap-3 font-bold text-2xl"
              >
                  <Plus size={32}/> Legg til oppgave
              </button>
          </div>
      );
  };

  const renderMixed = (d: any, update: (d: any) => void) => {
      const options = [
        { label: 'Flervalg', icon: CircleCheck, color: 'bg-cyan-600' },
        { label: 'Sant/Usant', icon: CircleHelp, color: 'bg-teal-600' },
        { label: 'Fyll inn', icon: Type, color: 'bg-slate-600' },
        { label: 'Bilde Hotspot', icon: MapPin, color: 'bg-rose-500' },
        { label: 'Interaktiv Video', icon: Video, color: 'bg-red-600' },
        { label: 'Tidslinje', icon: CalendarClock, color: 'bg-indigo-600' },
        { label: 'Dra og Slipp', icon: MousePointer2, color: 'bg-amber-600' },
        { label: 'Minnespel', icon: Grid, color: 'bg-pink-600' },
      ];

      return (
      <div className="space-y-12">
          <SortableList items={d.items || []} listKey="mixed" onUpdate={n => update({...d, items: n})} onRemove={id => update({...d, items: d.items.filter((i: any)=>i.id!==id)})} labelFn={i => i.type} renderContent={(item, idx) => (
                <div className="pt-4">
                    {item.type === 'Flervalg' && renderFlervalg(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Bilde Hotspot' && renderHotspot(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Interaktiv Video' && renderVideo(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Tidslinje' && renderTimeline(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Dra og Slipp' && renderDragDrop(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Minnespel' && renderMemory(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Sant/Usant' && renderTrueFalse(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                    {item.type === 'Fyll inn' && renderCloze(item.data, nd => {const n = [...d.items]; n[idx] = { ...n[idx], data: nd }; update({...d, items: n})})}
                </div>
          )} />
          
          <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200">
              <h4 className="text-xl font-bold text-slate-400 uppercase text-center mb-8 tracking-widest">Legg til ny deloppgave</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {options.map(t => (
                      <button key={t.label} onClick={() => update({...d, items: [...(d.items||[]), {id: Date.now(), type: t.label, data: getDefaultData(t.label)}]})} className="p-8 border border-slate-200 bg-white rounded-3xl hover:border-cyan-300 hover:shadow-xl text-xl font-bold text-slate-600 flex flex-col items-center justify-center gap-6 transition-all active:scale-95 group h-64">
                          <div className={`w-20 h-20 ${t.color} rounded-3xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                              <t.icon size={40} className="text-white" />
                          </div>
                          <span>{t.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
      );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-in slide-in-from-right-8 duration-500 pb-20">
      <div className="xl:col-span-1 space-y-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-32">
          <div className="mb-10">
             <label className={labelClass}>Tittel</label>
             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-3xl font-bold text-slate-800 border-b-2 border-slate-100 focus:border-cyan-500 outline-none pb-4 bg-transparent transition-colors" placeholder="Gi aktiviteten et navn..." />
          </div>
          <div className="mb-10">
             <label className={labelClass}>Beskrivelse (Valgfritt)</label>
             <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} rows={5} placeholder="Kort om hva studentene skal lære..." />
          </div>
          
          <div className="flex flex-col gap-5">
            <button onClick={handleSave} className="w-full py-5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md shadow-cyan-100 text-xl">{saved ? <CircleCheck size={28} /> : <Save size={28} />} {saved ? 'Lagret!' : 'Lagre endringer'}</button>
            <button onClick={() => { handleSave(); onPreview(); }} className="w-full py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors text-xl"><Eye size={28} /> Forhåndsvisning</button>
          </div>
          
          <div className="mt-10 pt-10 border-t border-slate-100">
             <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
               <h4 className="font-bold text-blue-800 mb-4 text-base uppercase flex items-center gap-2"><CircleHelp size={20}/> Tips</h4>
               <p className="text-base text-blue-700 leading-relaxed font-medium">Endringer lagres automatisk i nettleseren din, men husk å eksportere backup fra hovedmenyen hvis du bytter maskin.</p>
             </div>
          </div>
        </div>
      </div>
      
      <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 min-h-[800px]">
        <div className="flex justify-between items-center mb-12 border-b border-slate-100 pb-8">
             <h2 className="text-4xl font-extrabold text-slate-800">Innhold</h2>
             <span className="text-base font-bold text-white bg-slate-400 px-6 py-2 rounded-full uppercase tracking-wider">{activity.type}</span>
        </div>
        {activity.type === 'Flervalg' && renderFlervalg(data, setData)}
        {activity.type === 'Sant/Usant' && renderTrueFalse(data, setData)}
        {activity.type === 'Fyll inn' && renderCloze(data, setData)}
        {activity.type === 'Bilde Hotspot' && renderHotspot(data, setData)}
        {activity.type === 'Interaktiv Video' && renderVideo(data, setData)}
        {activity.type === 'Tidslinje' && renderTimeline(data, setData)}
        {activity.type === 'Dra og Slipp' && renderDragDrop(data, setData)}
        {activity.type === 'Minnespel' && renderMemory(data, setData)}
        {activity.type === 'Flere saman' && renderMixed(data, setData)}
      </div>
    </div>
  );
};