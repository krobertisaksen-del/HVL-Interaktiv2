import React, { useState, useEffect } from 'react';
import { 
  CircleCheck, CircleHelp, Type, MapPin, Video, CalendarClock, MousePointer2, Grid, Layers, 
  Plus, Layout, Play, Pencil, Share2, Copy, Code, X, Download, CircleAlert, Link as LinkIcon, Settings2, Info, Search, ExternalLink, Monitor, Check
} from 'lucide-react';
import { Activity } from '../types';
import { DeleteButton } from './ui/DeleteButton';

interface DashboardProps {
  activities: Activity[];
  onCreate: (type: string) => void;
  onEdit: (activity: Activity) => void;
  onPlay: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onDuplicate: (activity: Activity) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadHTML: (activity: Activity) => void;
  isDeepLinking?: boolean;
  onSelect?: (activity: Activity) => void;
}

interface EmbedDialogProps {
  activity: Activity;
  onClose: () => void;
  onDownload: (activity: Activity) => void;
}

const EmbedDialog: React.FC<EmbedDialogProps> = ({ activity, onClose, onDownload }) => {
  const [mode, setMode] = useState<'iframe' | 'button'>('iframe');
  const [userUrl, setUserUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  // EXTRACTED DATA STATE
  const [domain, setDomain] = useState('hvl.instructure.com');
  const [courseId, setCourseId] = useState('');
  const [fileId, setFileId] = useState('');
  
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!userUrl) return;

    const cleanUrl = userUrl.trim();
    let decoded = cleanUrl;
    try {
        decoded = decodeURIComponent(cleanUrl);
    } catch (e) {
        // ignore
    }

    let foundWarning = null;

    const domainMatch = decoded.match(/https?:\/\/([^/]+)/);
    if (domainMatch) setDomain(domainMatch[1]);

    const courseMatch = decoded.match(/\/courses\/(\d+)/);
    if (courseMatch) setCourseId(courseMatch[1]);

    const fileMatchQuery = decoded.match(/[?&](?:preview|id|file_id)=(\d+)/);
    const fileMatchPath = decoded.match(/\/(?:files|course_files)\/(\d+)/);
    const fileMatchNested = decoded.match(/\/files\/(?:[^\/]+\/)+(\d+)/);

    if (fileMatchQuery) setFileId(fileMatchQuery[1]);
    else if (fileMatchPath) setFileId(fileMatchPath[1]);
    else if (fileMatchNested) setFileId(fileMatchNested[1]);

    if (decoded.includes('/pages/')) {
        foundWarning = "Du har lenket til en 'Side', ikke en fil. Gå til 'Filer' i Canvas-menyen.";
    } else if (decoded.includes('/modules/')) {
        foundWarning = "Lenker fra 'Moduler' fungerer ofte dårlig. Gå til 'Filer' i Canvas-menyen.";
    }

    setWarning(foundWarning);

  }, [userUrl]);

  const handleCopy = () => {
    if (!isValid) return;
    navigator.clipboard.writeText(mode === 'iframe' ? iframeCode : buttonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const generatedUrl = `https://${domain}/courses/${courseId}/files/${fileId}/file_preview?annotate=0&canvas_qs_bypass=1`;
  const isValid = domain && courseId && fileId;

  const iframeCode = `<iframe style="width: 100%; height: 800px; border: 0; overflow: hidden;" scrolling="no" title="${activity.title}" src="${generatedUrl}"></iframe>`;
  const buttonCode = `<p style="text-align: center;">
  <a class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; background-color: #0e7490; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" href="${generatedUrl}" target="_blank" rel="noopener noreferrer">
    <span>🚀</span> Start Aktivitet: ${activity.title}
  </a>
</p>`;

  const activeCode = mode === 'iframe' ? iframeCode : buttonCode;

  return (
     <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4 animate-in fade-in backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="embed-title">
        <div className="bg-white rounded-2xl p-0 max-w-4xl w-full shadow-2xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-300" onClick={e => e.stopPropagation()}>
           
           <div className="p-8 border-b border-slate-200 flex justify-between items-start bg-slate-50">
               <div>
                   <h3 id="embed-title" className="text-3xl font-extrabold text-slate-900">Bygg inn i Canvas</h3>
                   <p className="text-slate-700 mt-2 font-medium text-lg">Velg metode for å vise aktiviteten til studentene.</p>
               </div>
               <button onClick={onClose} aria-label="Lukk" className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={32}/></button>
           </div>
           
           <div className="overflow-y-auto p-10 space-y-12">
               
               <div className="grid md:grid-cols-2 gap-10">
                   <div className="flex gap-6">
                       <div className="w-12 h-12 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md ring-4 ring-cyan-50">1</div>
                       <div>
                           <p className="font-bold text-slate-900 mb-2 text-2xl">Last ned filen</p>
                           <button onClick={() => onDownload(activity)} className="px-6 py-4 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-300 hover:border-cyan-600 hover:text-cyan-700 flex items-center gap-3 transition-all shadow-sm text-lg w-full justify-center">
                               <Download size={24}/> Last ned .html
                           </button>
                       </div>
                   </div>
                   <div className="flex gap-6">
                       <div className="w-12 h-12 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md ring-4 ring-cyan-50">2</div>
                       <div>
                           <p className="font-bold text-slate-900 text-2xl mb-2">Last opp til Canvas</p>
                           <p className="text-slate-700 text-xl leading-relaxed">Gå til <strong>Filer</strong> i emnet og last opp HTML-filen.</p>
                       </div>
                   </div>
               </div>

               <div className="flex gap-6">
                   <div className="w-12 h-12 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md ring-4 ring-cyan-50">3</div>
                   <div className="w-full space-y-6">
                       <div>
                           <p className="font-bold text-slate-900 text-2xl">Hent lenke fra Canvas</p>
                           <p className="mb-3 text-slate-700 text-xl">Høyreklikk på filen i Canvas og velg <em>"Kopier lenkeadresse"</em>.</p>
                           <input 
                             type="text" 
                             value={userUrl} 
                             onChange={(e) => setUserUrl(e.target.value)}
                             placeholder="Lim inn lenke her (f.eks. https://hvl.instructure.com/...)"
                             className="w-full p-5 border-2 border-slate-300 rounded-xl text-xl font-mono focus:border-cyan-600 outline-none bg-white text-slate-900 shadow-sm placeholder:text-slate-400"
                           />
                       </div>

                       {warning && (
                           <div className="text-lg text-amber-900 bg-amber-50 p-6 rounded-xl flex items-start gap-4 border-l-8 border-amber-500 shadow-sm">
                               <CircleAlert size={28} className="mt-0.5 flex-shrink-0 text-amber-600"/>
                               <span className="font-medium leading-relaxed">{warning}</span>
                           </div>
                       )}

                       <div className="bg-slate-50 p-8 rounded-2xl border border-slate-300 shadow-sm">
                           <div className="flex items-center gap-3 mb-6 text-slate-800 font-bold text-lg border-b border-slate-200 pb-4">
                               <Settings2 size={24}/> Verifiser ID-er (Endre manuelt om nødvendig):
                           </div>
                           <div className="space-y-6">
                               <div>
                                   <label className="text-sm uppercase font-extrabold text-slate-500 block mb-2 tracking-widest">Canvas Instans (Domene)</label>
                                   <input 
                                     type="text" 
                                     value={domain} 
                                     onChange={e => setDomain(e.target.value)} 
                                     className="w-full p-4 border-2 border-slate-300 rounded-xl text-lg font-bold font-mono text-slate-900 bg-white focus:border-cyan-500 outline-none"
                                   />
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                   <div>
                                       <label className="text-sm uppercase font-extrabold text-slate-500 block mb-2 tracking-widest">Course ID</label>
                                       <input 
                                         type="text" 
                                         value={courseId} 
                                         onChange={e => setCourseId(e.target.value)} 
                                         className={`w-full p-4 border-2 rounded-xl text-lg font-bold font-mono outline-none ${!courseId ? 'border-red-400 bg-red-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'}`}
                                         placeholder="???"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-sm uppercase font-extrabold text-slate-500 block mb-2 tracking-widest">File ID</label>
                                       <input 
                                         type="text" 
                                         value={fileId} 
                                         onChange={e => setFileId(e.target.value)} 
                                         className={`w-full p-4 border-2 rounded-xl text-lg font-bold font-mono outline-none ${!fileId ? 'border-red-400 bg-red-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500'}`}
                                         placeholder="???"
                                       />
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               <div className="flex gap-6">
                   <div className="w-12 h-12 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md ring-4 ring-cyan-50">4</div>
                   <div className="w-full">
                       <p className="font-bold text-slate-900 text-2xl mb-6">Velg visning og kopier kode</p>
                       
                       <div className="flex flex-wrap gap-4 mb-6 p-2 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                           <button 
                             onClick={() => setMode('iframe')}
                             className={`px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 transition-all ${mode === 'iframe' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-200'}`}
                           >
                               <Monitor size={24}/> Iframe (Innebygd)
                           </button>
                           <button 
                             onClick={() => setMode('button')}
                             className={`px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 transition-all ${mode === 'button' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-200'}`}
                           >
                               <ExternalLink size={24}/> Knapp (Ny fane)
                           </button>
                       </div>

                       <p className="mb-4 text-slate-700 text-lg leading-relaxed max-w-2xl">
                           {mode === 'iframe' 
                             ? 'Bygg inn aktiviteten direkte på siden. Vi bruker en spesiell URL for å unngå "vindu-i-vindu".' 
                             : 'Lager en tydelig knapp som åpner aktiviteten i fullskjerm. Tryggest for mobilbrukere.'}
                       </p>

                       <div className="relative group">
                           <textarea 
                              readOnly
                              value={isValid ? activeCode : '// Fyll inn ID-ene over for å generere kode'}
                              className={`w-full bg-slate-800 text-cyan-300 p-6 rounded-2xl font-mono text-lg shadow-inner min-h-[160px] flex items-center resize-none outline-none border-4 border-slate-700 focus:border-cyan-500 ${!isValid ? 'opacity-50 grayscale' : ''}`}
                           />
                           {isValid && (
                               <button 
                                 onClick={handleCopy} 
                                 className={`absolute top-4 right-4 px-6 py-3 rounded-xl text-white transition-all backdrop-blur-sm border border-white/20 flex items-center gap-2 text-base font-bold shadow-lg ${copied ? 'bg-green-600 hover:bg-green-700 scale-105' : 'bg-white/10 hover:bg-white/20'}`} 
                                 title="Kopier kode"
                               >
                                   {copied ? <Check size={20}/> : <Copy size={20}/>} 
                                   {copied ? 'KOPIERT!' : 'Kopier'}
                               </button>
                           )}
                       </div>
                   </div>
               </div>
           </div>
           
           <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-end">
               <button onClick={onClose} className="px-12 py-5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl transition-colors border-2 border-slate-300 shadow-sm text-xl">Lukk vindu</button>
           </div>
        </div>
     </div>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({ activities, onCreate, onEdit, onPlay, onDelete, onDuplicate, onExport, onImport, onDownloadHTML, isDeepLinking = false, onSelect }) => {
  const [embedActivity, setEmbedActivity] = useState<Activity | null>(null);

  const types = [
    { label: 'Flervalg', icon: CircleCheck, color: 'bg-cyan-600' },
    { label: 'Sant/Usant', icon: CircleHelp, color: 'bg-teal-600' },
    { label: 'Fyll inn', icon: Type, color: 'bg-slate-600' },
    { label: 'Bilde Hotspot', icon: MapPin, color: 'bg-rose-500' },
    { label: 'Interaktiv Video', icon: Video, color: 'bg-red-600' },
    { label: 'Tidslinje', icon: CalendarClock, color: 'bg-indigo-600' },
    { label: 'Dra og Slipp', icon: MousePointer2, color: 'bg-amber-600' },
    { label: 'Minnespel', icon: Grid, color: 'bg-pink-600' },
    { label: 'Flere saman', icon: Layers, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* DEEP LINKING BANNER */}
      {isDeepLinking && (
          <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl"><Plus size={32}/></div>
                  <div>
                      <h2 className="text-3xl font-bold">Legg til i Canvas</h2>
                      <p className="text-blue-100 text-xl">Velg aktiviteten du vil sette inn, eller lag en ny.</p>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE NEW */}
      <section className="pt-6" aria-labelledby="create-heading">
        <h2 id="create-heading" className="text-6xl font-extrabold text-slate-900 mb-12">Opprett ny</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {types.map((t) => (
            <button key={t.label} onClick={() => onCreate(t.label)} className="group relative flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-[2rem] hover:border-cyan-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className={`w-24 h-24 ${t.color} rounded-3xl flex items-center justify-center mb-8 shadow-lg relative group-hover:scale-110 transition-transform duration-300`}>
                <t.icon className="text-white w-12 h-12" aria-hidden="true" />
                <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-sm border border-slate-100"><Plus className="w-6 h-6 text-slate-400" strokeWidth={4} /></div>
              </div>
              <span className="font-bold text-slate-800 text-xl text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* LIBRARY */}
      <section aria-labelledby="library-heading">
        <h2 id="library-heading" className="text-6xl font-extrabold text-slate-900 mb-12">Bibliotek ({activities.length})</h2>
        {activities.length === 0 ? (
          <div className="text-center py-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-500"><Layout size={64}/></div>
            <p className="text-slate-700 font-bold text-3xl">Ingen aktivitetar oppretta ennå.</p>
            <p className="text-slate-500 text-xl mt-4 max-w-md mx-auto">Vel ein type ovanfor for å starte.</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
            {activities.map((a) => (
            <article key={a.id} className={`bg-white p-10 rounded-[2rem] border transition-all group gap-8 flex flex-col sm:flex-row items-start sm:items-center justify-between ${isDeepLinking ? 'border-blue-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100' : 'border-slate-200 hover:shadow-xl hover:border-cyan-200'}`}>
              <div className="flex items-center gap-8 overflow-hidden w-full">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-4xl shadow-inner flex-shrink-0 transition-colors ${isDeepLinking ? 'bg-blue-50 text-blue-600' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-cyan-50 group-hover:to-cyan-100 group-hover:text-cyan-700'}`} aria-hidden="true">
                    {a.type.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-cyan-900 text-3xl mb-2">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-lg text-slate-600">
                      <span className="bg-slate-100 px-4 py-1.5 rounded-lg text-slate-700 font-bold text-sm uppercase tracking-wide border border-slate-200">{a.type}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    {a.description && <p className="text-lg text-slate-500 mt-4 truncate max-w-md opacity-80">{a.description}</p>}
                  </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto pl-4">
                  
                  {/* DEEP LINKING SELECTION BUTTON */}
                  {isDeepLinking && onSelect ? (
                      <button onClick={() => onSelect(a)} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors font-bold text-xl shadow-lg shadow-blue-200 flex items-center gap-2">
                          <Plus size={24}/> Velg
                      </button>
                  ) : (
                      <>
                        <button onClick={() => onPlay(a)} className="p-5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-2xl transition-colors" title="Spill" aria-label={`Spill ${a.title}`}>
                            <Play size={32}/>
                        </button>
                        <button onClick={() => onEdit(a)} className="p-5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-2xl transition-colors" title="Rediger" aria-label={`Rediger ${a.title}`}>
                            <Pencil size={32}/>
                        </button>
                        <button onClick={() => setEmbedActivity(a)} className="p-5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-2xl transition-colors" title="Bygg inn i Canvas" aria-label={`Bygg inn ${a.title}`}>
                            <Code size={32}/>
                        </button>
                        <button onClick={() => onDownloadHTML(a)} className="p-5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-2xl transition-colors" title="Last ned HTML" aria-label={`Last ned ${a.title}`}>
                            <Share2 size={32}/>
                        </button>
                        <div className="w-px h-12 bg-slate-200 mx-2" aria-hidden="true"></div>
                        <button onClick={() => onDuplicate(a)} className="p-5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-2xl transition-colors" title="Dupliser" aria-label={`Dupliser ${a.title}`}>
                            <Copy size={28}/>
                        </button>
                        <DeleteButton onDelete={() => onDelete(a.id)} />
                      </>
                  )}
              </div>
            </article>
          ))}</div>
        )}
      </section>

      {/* EMBED MODAL */}
      {embedActivity && (
          <EmbedDialog 
              activity={embedActivity} 
              onClose={() => setEmbedActivity(null)} 
              onDownload={onDownloadHTML} 
          />
      )}
    </div>
  );
}