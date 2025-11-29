import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CheckCircle2, X, RotateCw, Plus, ChevronRight } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';
import { MCPlayer } from './MCPlayer';
import { TFPlayer } from './TFPlayer';
import { ClozePlayer } from './ClozePlayer';

export const VideoPlayer: React.FC<PlayerProps> = ({ data, onSuccess }) => {
  const scenes = useMemo(() => data.scenes || (data.videoUrl ? [{id: 'legacy', videoUrl: data.videoUrl, interactions: data.interactions}] : []), [data]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completedInteractions, setCompletedInteractions] = useState<any[]>([]); 
  const [sceneResults, setSceneResults] = useState<Record<string, any>>({}); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeInteraction, setActiveInteraction] = useState<any>(null);
  const [showHotspotContent, setShowHotspotContent] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const currentScene = scenes[currentIndex];

  useEffect(() => {
      setCompletedInteractions([]);
      setVideoEnded(false);
      setActiveInteraction(null);
      setShowHotspotContent(false);
  }, [currentIndex]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || activeInteraction) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    const interaction = (currentScene.interactions || []).find((i: any) => 
        parseInt(i.time) === currentTime && !completedInteractions.includes(i.id)
    );
    if (interaction) {
        videoRef.current.pause();
        setActiveInteraction(interaction);
        if(interaction.useHotspot) {
            setShowHotspotContent(false);
        } else {
            setShowHotspotContent(true);
        }
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current) return;
    if (activeInteraction) return; 
    // const currentTime = videoRef.current.currentTime;
  };

  const handleInteractionComplete = (result: any) => {
    if (activeInteraction) {
        setCompletedInteractions(prev => [...prev, activeInteraction.id]);
        setSceneResults(prev => ({
            ...prev,
            [activeInteraction.id]: result || { score: 0, total: 0, mistakes: [] }
        }));
        setActiveInteraction(null);
        setShowHotspotContent(false);
        if(videoRef.current) videoRef.current.play();
    }
  };

  const handleEnded = () => {
      setVideoEnded(true);
  };

  const next = () => {
      if (currentIndex < scenes.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setFinished(true);
      }
  };

  if (finished) {
      const allResults = Object.values(sceneResults);
      const totalScore = allResults.reduce((acc, r: any) => acc + (r.score || 0), 0);
      const totalMax = allResults.reduce((acc, r: any) => acc + (r.total || 0), 0);
      const allMistakes = allResults.flatMap((r: any) => r.mistakes || []);
      const isPerfect = totalScore === totalMax;

      if (!onSuccess) return <CompletionScreen onRestart={() => { setFinished(false); setCurrentIndex(0); setSceneResults({}); }} score={totalScore} total={totalMax} mistakes={allMistakes} isPerfect={isPerfect} />;
      
      return (
          <div className="text-center space-y-6 py-8 bg-white rounded-xl border border-slate-100 animate-in fade-in">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {isPerfect ? <CheckCircle2 size={32}/> : <X size={32}/>}
              </div>
              <div>
                  <h3 className="text-xl font-bold text-slate-800">Video ferdig!</h3>
                  <p className="text-slate-500">Score: {totalScore}/{totalMax}</p>
              </div>
              
              {isPerfect ? (
                  <button onClick={() => onSuccess({ score: totalScore, total: totalMax, mistakes: allMistakes })} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg">Fortsett</button>
              ) : (
                  <div>
                      <p className="text-red-500 font-bold mb-4 text-sm">Du må ha alt riktig for å fullføre aktiviteten.</p>
                      <button onClick={() => { setFinished(false); setCurrentIndex(0); setSceneResults({}); }} className="px-8 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 mx-auto"><RotateCw size={16}/> Start på nytt</button>
                  </div>
              )}
          </div>
      );
  }

  if (!currentScene) return <div>Ingen video.</div>;

  const ActiveInteractionPlayer = activeInteraction ? (activeInteraction.type === 'Flervalg' ? MCPlayer : (activeInteraction.type === 'Sant/Usant' ? TFPlayer : ClozePlayer)) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Video {currentIndex + 1} av {scenes.length}</span>
      </div>

      <div className="space-y-4 relative">
        <video ref={videoRef} controls={!activeInteraction} src={currentScene.videoUrl} className="w-full rounded-2xl shadow-2xl bg-black aspect-video" onTimeUpdate={handleTimeUpdate} onSeeking={handleSeeking} onEnded={handleEnded} />
        
        {activeInteraction && activeInteraction.useHotspot && !showHotspotContent && (
            <div className="absolute inset-0 z-10">
                <button 
                  onClick={() => setShowHotspotContent(true)}
                  style={{ 
                      top: `${activeInteraction.y || 50}%`, 
                      left: `${activeInteraction.x || 50}%` 
                  }}
                  className="absolute -ml-6 -mt-6 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce hover:scale-110 transition-transform z-20 border-4 border-white/50"
                  aria-label="Åpne oppgave"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
                <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-8 pointer-events-none">
                    <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold">Klikk på markøren for å fortsette</span>
                </div>
            </div>
        )}

        {activeInteraction && showHotspotContent && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4 backdrop-blur-sm rounded-2xl animate-in fade-in">
              <div className="bg-white p-8 rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 max-h-[90%] overflow-y-auto border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Video stoppet: Løs oppgave</h4>
                  {ActiveInteractionPlayer && <ActiveInteractionPlayer data={activeInteraction.data} onSuccess={handleInteractionComplete} compact={true} />}
              </div>
          </div>
        )}
        
        {videoEnded && (
            <div className="text-center space-y-4 py-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in">
                <div className="text-green-700 font-bold flex items-center justify-center gap-2"><CheckCircle2/> Video ferdigspilt!</div>
                <button onClick={next} className="px-6 py-2 bg-cyan-700 text-white rounded-lg font-bold hover:bg-cyan-800 flex items-center gap-2 mx-auto">
                    {currentIndex < scenes.length - 1 ? 'Neste Video' : 'Fullfør'} <ChevronRight size={18}/>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};