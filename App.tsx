import React, { useState, useEffect } from 'react';
import { Hexagon, Layout, BookOpen, Loader2, CircleAlert, PlayCircle, Wrench, RefreshCw, ArrowLeft, CircleCheck } from 'lucide-react';
import { Activity } from './types';
import { getDefaultData, PLAYER_SCRIPT_TEMPLATE } from './constants';
import { Dashboard } from './components/Dashboard';
import { HelpPage } from './components/HelpPage';
import { Editor } from './components/Editor';
import { Player } from './components/Player';

export default function HVLInteraktivApp() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'player' | 'help'>('dashboard');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  
  // App State
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get User Info (and LTI Launch Context)
        const userRes = await fetch('/api/me');
        
        if (userRes.status === 401) {
             throw new Error("LTI_AUTH_FAILED");
        }
        
        if (!userRes.ok) {
            throw new Error(`Kunne ikke koble til serveren (Status: ${userRes.status})`);
        }
        
        const userData = await userRes.json();
        setUser(userData);

        // 2. Get Activities for this Course
        const actRes = await fetch('/api/activities');
        if (!actRes.ok) throw new Error("Kunne ikke laste aktiviteter.");
        const actData = await actRes.json();
        setActivities(actData);

        // 3. Handle Auto-Launch (Student clicked a specific activity)
        if (userData.activityId) {
            const target = actData.find((a: Activity) => a.id === userData.activityId);
            if (target) {
                setCurrentActivity(target);
                setView('player');
            }
        }
        
      } catch (err: any) {
        console.error(err);
        
        // CHECK: Are we running locally? (Dev mode or built locally)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isDev = (import.meta as any).env?.DEV;

        if (isDev || isLocal) {
            console.warn("API failed, falling back to localStorage (DEV/LOCAL MODE)");
            enableTestMode();
        } else {
            setError(err.message === "LTI_AUTH_FAILED" ? "LTI_AUTH_FAILED" : err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const enableTestMode = () => {
      const saved = localStorage.getItem('hvl_activities');
      if (saved) {
          try {
            setActivities(JSON.parse(saved));
          } catch(e) {
            setActivities([]);
          }
      }
      setUser({ name: 'Testbruker', roles: ['Instructor'] });
      setIsTestMode(true);
      setError(null);
  };

  const handleDeepLinkSelect = async (activity: Activity) => {
    try {
        setLoading(true);
        // Post the selection to backend, which returns an auto-submitting HTML form
        const res = await fetch('/api/deeplink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activity.id, title: activity.title })
        });
        
        if (!res.ok) throw new Error("Kunne ikke opprette kobling.");
        
        const formHtml = await res.text();
        // Replace current document with the auto-submitting form to return to Canvas
        document.body.innerHTML = formHtml;
        // Execute the script in the form if it doesn't auto-run (ltijs forms usually auto-submit)
        const forms = document.getElementsByTagName('form');
        if(forms.length > 0) forms[0].submit();

    } catch (e) {
        console.error(e);
        alert("Feil ved valg av aktivitet.");
        setLoading(false);
    }
  };

  const handleDownloadHTML = (activity: Activity) => {
    // Sanitize activity data to prevent script injection in the generated HTML
    const activityJson = JSON.stringify(activity).replace(/<\/script>/gi, "<\\/script>");

    const htmlContent = `
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <base target="_top">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activity.title} - HVL Interaktiv</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
    <!-- Use latest Lucide for definitions -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Modern Babel Standalone -->
    <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
    <style>
       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
       html { font-size: 18px; }
       body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; height: 100vh; overflow: hidden; }
       #root { height: 100%; overflow-y: auto; }
       #error-container { display: none; padding: 20px; background: #fee2e2; color: #991b1b; border: 1px solid #f87171; margin: 20px; border-radius: 8px; font-family: monospace; }
    </style>
</head>
<body>
    <div id="error-container"></div>
    <div id="root"></div>

    <script>
      window.onerror = function(msg, url, line, col, error) {
        var container = document.getElementById('error-container');
        container.style.display = 'block';
        container.innerHTML = '<strong>Error:</strong> ' + msg + '<br/><small>' + (error ? error.stack : '') + '</small>';
        return false;
      };
    </script>

    <script type="text/babel">
        try {
            const activity = ${activityJson};
            const windowData = activity;

            const { useState, useEffect, useRef, useMemo } = React;

            // --- ROBUST ICON SHIM ---
            const getIcon = (name) => {
                const lib = window.lucide && window.lucide.icons ? window.lucide.icons : {};
                const camelName = name.charAt(0).toLowerCase() + name.slice(1);
                const iconNode = lib[name] || lib[camelName];
                if (!iconNode) return () => null; 
                return ({ color = "currentColor", size = 24, strokeWidth = 2, className = "", ...props }) => {
                    return React.createElement(
                        "svg",
                        {
                            xmlns: "http://www.w3.org/2000/svg",
                            width: size,
                            height: size,
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: color,
                            strokeWidth: strokeWidth,
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            className: className,
                            ...props
                        },
                        ...iconNode.map(([tag, attrs]) => React.createElement(tag, { ...attrs }))
                    );
                };
            };

            const LucideIcons = new Proxy({}, {
                get: (target, prop) => {
                    if (typeof prop !== 'string') return undefined;
                    return getIcon(prop);
                }
            });

            const { 
              Hexagon, CircleCheck, CircleHelp, Play, Plus, Save, Type, X, Trash2, Pencil, 
              Layout, Eye, RotateCw, FileJson, Upload, MapPin, ChevronRight, ChevronDown, 
              ChevronUp, ChevronLeft, Trophy, Layers, ArrowUp, ArrowDown, Video, MonitorPlay, 
              MousePointer2, Grid, FileVideo, Clock, Move, GripVertical, Lock, CircleAlert, 
              CalendarClock, Loader2, ArrowRight, RotateCcw, Target
            } = LucideIcons;

            const lucideReact = LucideIcons; 

            // --- PLAYER COMPONENTS ---
            ${PLAYER_SCRIPT_TEMPLATE}

            const StandalonePlayer = () => {
                const renderPlayer = () => {
                    switch(activity.type) {
                        case 'Flervalg': return <MCPlayer data={activity.data} />;
                        case 'Sant/Usant': return <TFPlayer data={activity.data} />;
                        case 'Fyll inn': return <ClozePlayer data={activity.data} />;
                        case 'Bilde Hotspot': return <HotspotPlayer data={activity.data} />;
                        case 'Interaktiv Video': return <VideoPlayer data={activity.data} />;
                        case 'Tidslinje': return <TimelinePlayer data={activity.data} />;
                        case 'Dra og Slipp': return <DragDropPlayer data={activity.data} />;
                        case 'Minnespel': return <MemoryPlayer data={activity.data} />;
                        case 'Flere saman': return <MixedPlayer data={activity.data} />;
                        default: return <div>Ukjent aktivitet: {activity.type}</div>;
                    }
                };

               return (
                 <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
                    <main className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                       <header className="bg-slate-800 text-white p-8">
                          <h1 className="text-3xl font-bold">{activity.title}</h1>
                          {activity.description && <p className="text-slate-300 text-lg mt-2">{activity.description}</p>}
                       </header>
                       <div className="p-8 md:p-14">
                           {renderPlayer()}
                       </div>
                    </main>
                 </div>
               );
            };

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<StandalonePlayer />);
            
        } catch (err) {
            console.error(err);
            document.getElementById('error-container').style.display = 'block';
            document.getElementById('error-container').innerHTML = '<strong>Runtime Error:</strong> ' + err.message + '<br/><small>' + err.stack + '</small>';
        }
    </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreate = (type: string) => {
    // We create a temporary object, but don't save to DB until "Save" is clicked in Editor
    const newActivity: Activity = {
      id: 'temp-' + Date.now(),
      type,
      title: `Utkast ${type}`,
      description: '',
      data: getDefaultData(type),
      createdAt: new Date().toISOString()
    };
    setCurrentActivity(newActivity);
    setView('editor');
  };

  const handleSave = async (updatedActivity: Activity) => {
    // TEST MODE
    if (isTestMode) {
        const isNew = updatedActivity.id.startsWith('temp-');
        let savedActivity = { ...updatedActivity };
        if (isNew) savedActivity.id = 'test-' + Date.now();
        
        setActivities(prev => {
            const newActivities = isNew ? [savedActivity, ...prev] : prev.map(a => a.id === savedActivity.id ? savedActivity : a);
            localStorage.setItem('hvl_activities', JSON.stringify(newActivities));
            return newActivities;
        });
        setCurrentActivity(savedActivity);
        return;
    }

    try {
        let saved: Activity;
        const isNew = updatedActivity.id.startsWith('temp-');

        if (isNew) {
            // Create
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: updatedActivity.type,
                    title: updatedActivity.title,
                    description: updatedActivity.description,
                    data: updatedActivity.data
                })
            });
            if (!res.ok) throw new Error("Feil ved lagring");
            saved = await res.json();
        } else {
            // Update
            const res = await fetch(`/api/activities/${updatedActivity.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: updatedActivity.title,
                    description: updatedActivity.description,
                    data: updatedActivity.data
                })
            });
            if (!res.ok) throw new Error("Feil ved oppdatering");
            saved = await res.json();
        }

        setActivities(prev => {
          if (isNew) return [saved, ...prev];
          return prev.map(a => a.id === saved.id ? saved : a);
        });
        setCurrentActivity(saved);
    } catch (e) {
        console.error(e);
        alert("Kunne ikke lagre aktiviteten. Sjekk internettforbindelsen.");
    }
  };

  const handleDelete = async (id: string) => {
    if (isTestMode) {
        setActivities(prev => {
            const newActivities = prev.filter(a => a.id !== id);
            localStorage.setItem('hvl_activities', JSON.stringify(newActivities));
            return newActivities;
        });
        return;
    }
    try {
        await fetch(`/api/activities/${id}`, { method: 'DELETE' });
        setActivities(prev => prev.filter(a => a.id !== id));
    } catch (e) {
        alert("Feil ved sletting.");
    }
  };

  const handleDuplicate = async (activity: Activity) => {
    if (isTestMode) {
         const newActivity = { ...activity, id: 'test-' + Date.now(), title: `${activity.title} (Kopi)` };
         setActivities(prev => {
             const newActivities = [newActivity, ...prev];
             localStorage.setItem('hvl_activities', JSON.stringify(newActivities));
             return newActivities;
         });
         return;
    }
    try {
        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: activity.type,
                title: `${activity.title} (Kopi)`,
                description: activity.description,
                data: activity.data
            })
        });
        const saved = await res.json();
        setActivities(prev => [saved, ...prev]);
    } catch (e) {
        alert("Kunne ikke duplisere.");
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "hvl_aktiviteter_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if(typeof e.target?.result === 'string') {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
              if (isTestMode) {
                  setActivities(prev => {
                      const merged = [...imported, ...prev];
                      localStorage.setItem('hvl_activities', JSON.stringify(merged));
                      return merged;
                  });
                  alert(`Importerte ${imported.length} aktiviteter (Lokalt).`);
                  return;
              }
              let count = 0;
              for (const item of imported) {
                  await fetch('/api/activities', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                          type: item.type,
                          title: item.title,
                          description: item.description,
                          data: item.data
                      })
                  });
                  count++;
              }
              const actRes = await fetch('/api/activities');
              const actData = await actRes.json();
              setActivities(actData);
              alert(`Importerte ${count} aktiviteter til databasen.`);
          }
        }
      } catch (error) {
        console.error(error);
        alert("Kunne ikke lese filen.");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={48} className="animate-spin mb-4 text-cyan-600"/>
              <p>Laster inn HVL Interaktiv...</p>
          </div>
      );
  }

  // --- ERROR SCREEN ---
  if (error) {
      const isAuthError = error === "LTI_AUTH_FAILED";
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="bg-white p-10 rounded-3xl shadow-xl max-w-xl text-center border border-slate-200">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isAuthError ? 'bg-cyan-100 text-cyan-700' : 'bg-red-100 text-red-600'}`}>
                      {isAuthError ? <Layout size={40}/> : <CircleAlert size={40}/>}
                  </div>
                  
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">
                      {isAuthError ? "Åpne via Canvas" : "Feil ved tilkobling"}
                  </h1>
                  
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {isAuthError 
                        ? "Dette verktøyet må åpnes inne i Canvas for å fungere." 
                        : `Systemmelding: ${error}`}
                  </p>

                  {!isAuthError && (
                      <button onClick={() => window.location.reload()} className="mb-8 px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors flex items-center gap-2 mx-auto">
                         <RefreshCw size={20}/> Prøv igjen
                      </button>
                  )}

                  <div className="border-t border-slate-100 pt-8 mt-4 w-full">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Er du utvikler eller tester?</p>
                      <button 
                        onClick={enableTestMode}
                        className="w-full px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-cyan-300 hover:text-cyan-700 transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                          <Wrench size={18} /> Åpne Test-modus (Lokal lagring)
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-cyan-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-5 cursor-pointer bg-transparent border-0 p-0 text-left group">
          <div className="w-16 h-16 bg-cyan-700 rounded-2xl flex items-center justify-center shadow-cyan-200 shadow-lg transform group-hover:scale-105 transition-transform" aria-hidden="true">
            <Hexagon className="text-white w-10 h-10" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-4xl tracking-tight text-slate-800 leading-none group-hover:text-cyan-800 transition-colors">HVL Interaktiv</h1>
            <p className="text-lg text-cyan-700 font-bold uppercase tracking-widest mt-1">Høgskulen på Vestlandet</p>
          </div>
        </button>
        <div className="flex items-center gap-4">
           {isTestMode && (
               <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold text-sm border border-amber-200 flex items-center gap-2">
                   <CircleAlert size={16}/> Test-modus
               </div>
           )}
           {user?.isDeepLinking && (
               <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-200 flex items-center gap-2 animate-pulse">
                   <CircleCheck size={16}/> Valg-modus (Legg til i Canvas)
               </div>
           )}
           <nav className="flex gap-3">
            {view !== 'dashboard' && (
                <button onClick={() => setView('dashboard')} className="px-6 py-4 text-slate-600 hover:bg-slate-100 rounded-xl text-lg font-bold transition-colors flex items-center gap-2">
                <Layout size={24} aria-hidden="true"/> Hovedmeny
                </button>
            )}
            <button onClick={() => setView(view === 'help' ? 'dashboard' : 'help')} className={`px-6 py-4 rounded-xl text-lg font-bold transition-colors flex items-center gap-2 ${view === 'help' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                <BookOpen size={24} aria-hidden="true"/> Hjelp
            </button>
           </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 md:p-12">
        {view === 'dashboard' && (
          <Dashboard 
            activities={activities} 
            onCreate={handleCreate} 
            onEdit={(a) => { setCurrentActivity(a); setView('editor'); }} 
            onPlay={(a) => { setCurrentActivity(a); setView('player'); }} 
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onExport={handleExport}
            onImport={handleImport}
            onDownloadHTML={handleDownloadHTML}
            isDeepLinking={user?.isDeepLinking}
            onSelect={handleDeepLinkSelect}
          />
        )}
        {view === 'help' && <HelpPage />}
        {view === 'editor' && currentActivity && <Editor activity={currentActivity} onSave={handleSave} onPreview={() => setView('player')} />}
        {view === 'player' && currentActivity && (
          <div>
            {user?.activityId && (
               <div className="mb-6">
                 <button onClick={() => { window.location.href = '/'; /* Reload to get out of single activity mode if needed */ }} className="flex items-center gap-2 text-slate-500 hover:text-cyan-700 font-bold">
                    <ArrowLeft size={20}/> Tilbake til alle aktiviteter
                 </button>
               </div>
            )}
            <Player activity={currentActivity} onEdit={() => setView('editor')} />
          </div>
        )}
      </main>
    </div>
  );
}