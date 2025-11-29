export function getDefaultData(type: string) {
  switch (type) {
    case 'Flervalg': return { questions: [{ id: 1, question: 'Kva er hovudstaden i Noreg?', options: [{id: 1, text: 'Bergen', correct: false}, {id: 2, text: 'Oslo', correct: true}, {id: 3, text: '', correct: false}] }] };
    case 'Sant/Usant': return { questions: [{ id: 1, question: 'HVL blei etablert i 2017.', isTrue: true }] };
    case 'Fyll inn': return { blocks: [{id: 1, text: 'Høgskulen på Vestlandet har *fem* campusar.' }] };
    case 'Bilde Hotspot': return { scenes: [{ id: 1, imageUrl: 'https://images.unsplash.com/photo-1500331882688-e9a39346775f?q=80&w=1000', altText: 'Fjord', hotspots: [] }] };
    case 'Interaktiv Video': return { scenes: [{ id: 1, videoUrl: '', interactions: [] }] };
    case 'Tidslinje': return { headline: 'Historie', events: [{id: 1, date: '2017', title: 'HVL etablert', body: 'HVL vart oppretta.', mediaUrl: '', mediaType: ''}] };
    case 'Dra og Slipp': return { tasks: [{ id: 1, backgroundUrl: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?q=80&w=1000', altText: 'Bakgrunn', items: [], zones: [] }] };
    case 'Minnespel': return { cards: [{ id: 1, content: 'A', pairId: 1 }, { id: 2, content: 'B', pairId: 1 }] };
    case 'Flere saman': return { items: [] };
    default: return {};
  }
}

export const PLAYER_SCRIPT_TEMPLATE = `
// --- HELPER: SAFE IMAGE ---
const SafeImage = ({ src, alt, className, style, draggable = true }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={\`\${className} bg-slate-100 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-red-300 text-red-800 text-xs overflow-hidden\`} style={style}>
        <div className="mb-2 opacity-50"><CircleAlert size={24} /></div>
        <span className="font-bold">Bilde blokkert</span>
        <span className="opacity-70 mt-1 text-[10px] leading-tight max-w-[200px]">
           Canvas kan blokkere opplastede bilder. Prøv ekstern URL (https://) istedenfor.
        </span>
      </div>
    );
  }
  return <img src={src} alt={alt || "Bilde"} className={className} style={style} onError={() => setError(true)} draggable={draggable} />;
};

// --- HELPER: COMPLETION SCREEN ---
const CompletionScreen = ({ onRestart, score, total, mistakes = [], message = "Aktivitet fullført!", subMessage = "Godt jobba!", showRestart = true, isPerfect = true }) => {
  const hasScore = typeof score === 'number' && typeof total === 'number' && total > 0;
  const percentage = hasScore ? Math.round((score / total) * 100) : 100;
  const actualIsPerfect = hasScore ? score === total : isPerfect;

  return (
    <div className="text-center space-y-8 animate-in fade-in py-12 bg-white rounded-xl border border-slate-100 shadow-sm h-full flex flex-col justify-center items-center max-w-2xl mx-auto">
      {hasScore ? (
          <div className="relative w-32 h-32 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" aria-hidden="true">
                 <circle cx="64" cy="64" r="58" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                 <circle cx="64" cy="64" r="58" stroke={actualIsPerfect ? "#16a34a" : "#ef4444"} strokeWidth="8" fill="none" strokeDasharray={364} strokeDashoffset={364 - (364 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={\`text-3xl font-bold \${actualIsPerfect ? 'text-slate-800' : 'text-red-600'}\`}>{score}/{total}</span>
                 <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Poeng</span>
             </div>
          </div>
      ) : (
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm mb-2" aria-hidden="true">
          <Trophy size={48} />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-slate-800">{message}</h3>
        <p className="text-slate-500 text-lg">{subMessage}</p>
      </div>
      {mistakes.length > 0 && (
          <div className="w-full text-left bg-red-50 p-6 rounded-2xl border border-red-100 mt-4 max-w-lg">
              <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><CircleAlert size={18}/> Ting å se på igjen</h4>
              <ul className="space-y-3">
                  {mistakes.map((m, i) => (
                      <li key={i} className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                          <div className="font-bold text-slate-800 mb-1">{m.question}</div>
                          {m.correctAnswer && <div className="text-green-700 text-xs font-medium mt-1">Riktig svar: {m.correctAnswer}</div>}
                      </li>
                  ))}
              </ul>
          </div>
      )}
      {showRestart && onRestart && (
        <button onClick={onRestart} className={\`px-8 py-3 \${actualIsPerfect ? 'bg-cyan-700 hover:bg-cyan-800' : 'bg-slate-700 hover:bg-slate-800'} text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto mt-6\`}>
          <RotateCw size={20}/> {actualIsPerfect ? 'Start på nytt' : 'Prøv igjen'}
        </button>
      )}
    </div>
  );
};

// --- PLAYER: MULTIPLE CHOICE ---
const MCPlayer = ({ data, onSuccess, compact = false }) => {
  const questions = data.questions || [{ id: 1, question: data.question, options: data.options }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const currentQ = questions[currentIndex];

  const check = () => {
    if (!selected) return;
    const correctOpt = currentQ.options.find(o => o.correct);
    const isCorrect = correctOpt && correctOpt.id === selected;
    setFeedback(isCorrect);
    if (isCorrect) setScore(s => s + 1);
    else setMistakes(prev => [...prev, { question: currentQ.question, correctAnswer: correctOpt?.text }]);
    setChecked(true);
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1); setSelected(null); setChecked(false); setFeedback(null);
    } else setFinished(true);
  };
  
  const reset = () => { setFinished(false); setCurrentIndex(0); setScore(0); setSelected(null); setChecked(false); setMistakes([]); };

  if (finished) {
    const result = { score, total: questions.length, mistakes };
    const isPerfect = score === questions.length;
    if (!onSuccess) return <CompletionScreen onRestart={reset} score={score} total={questions.length} mistakes={mistakes} message={isPerfect ? "Gratulerer!" : "Ikke helt..."} subMessage={isPerfect ? "Alt riktig!" : "Du må ha alt riktig for å fullføre."} />;
    return (
      <div className={\`text-center \${compact ? 'space-y-4 py-4' : 'space-y-6 py-8'} animate-in fade-in\`}>
        <div className={\`\${compact ? 'w-16 h-16' : 'w-20 h-20'} \${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto\`}>
            {isPerfect ? <CircleCheck size={compact ? 32 : 40} /> : <X size={compact ? 32 : 40} />}
        </div>
        <div><h3 className={\`\${compact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800\`}>Resultat</h3><p className="text-slate-600 mt-1">Du fekk {score} av {questions.length} rette.</p></div>
        {isPerfect ? <button onClick={() => onSuccess(result)} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Fortsett</button> : <button onClick={reset} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"><RotateCw size={16}/> Prøv igjen</button>}
      </div>
    );
  }

  return (
    <div className={\`\${compact ? 'space-y-4' : 'space-y-8'} max-w-2xl mx-auto\`}>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Spørsmål {currentIndex + 1}/{questions.length}</span><span>Poeng: {score}</span></div>
      <div className={\`w-full \${compact ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden\`}><div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: \`\${((currentIndex + 1) / questions.length) * 100}%\` }}></div></div>
      <h3 className={\`\${compact ? 'text-xl py-2' : 'text-2xl py-4'} font-bold text-slate-800 text-center\`}>{currentQ.question}</h3>
      <div className={\`grid \${compact ? 'gap-2' : 'gap-4'}\`}>
        {currentQ.options.map(o => (
          <button key={o.id} onClick={() => !checked && setSelected(o.id)} disabled={checked} className={\`\${compact ? 'p-3' : 'p-5'} rounded-xl border-2 text-left transition-all relative \${checked ? (o.correct ? 'bg-green-100 border-green-500' : (selected===o.id ? 'bg-red-100 border-red-500' : 'opacity-50')) : (selected===o.id ? 'bg-cyan-50 border-cyan-600' : 'hover:bg-slate-50')}\`}>
            <span className="font-bold">{o.text}</span>
            {checked && o.correct && <CircleCheck className="absolute right-4 top-4 text-green-600" size={20}/>}
            {checked && !o.correct && selected===o.id && <X className="absolute right-4 top-4 text-red-600" size={20}/>}
          </button>
        ))}
      </div>
      <div className="pt-4">{!checked ? <button onClick={check} disabled={!selected} className={\`w-full \${compact ? 'py-3' : 'py-4'} bg-cyan-700 text-white font-bold rounded-xl disabled:opacity-50\`}>Sjekk Svar</button> : <button onClick={next} className={\`w-full \${compact ? 'py-3' : 'py-4'} bg-slate-800 text-white font-bold rounded-xl\`}>Neste</button>}</div>
    </div>
  );
};

// --- PLAYER: TRUE/FALSE ---
const TFPlayer = ({ data, onSuccess, compact = false }) => {
  const questions = data.questions || [{ id: 1, question: data.question, isTrue: data.isTrue }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const currentQ = questions[currentIndex];

  const check = (choice) => {
    setSelected(choice);
    const isCorrect = choice === currentQ.isTrue;
    if (isCorrect) setScore(s => s + 1);
    else setMistakes(prev => [...prev, { question: currentQ.question, correctAnswer: currentQ.isTrue ? "Sant" : "Usant" }]);
    setChecked(true);
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1); 
      setSelected(null); 
      setChecked(false); 
    } else setFinished(true);
  };
  
  const reset = () => { setFinished(false); setCurrentIndex(0); setScore(0); setSelected(null); setChecked(false); setMistakes([]); };

  if (finished) {
    const result = { score, total: questions.length, mistakes };
    const isPerfect = score === questions.length;
    if (!onSuccess) return <CompletionScreen onRestart={reset} score={score} total={questions.length} mistakes={mistakes} message={isPerfect ? "Gratulerer!" : "Ikke helt..."} subMessage={isPerfect ? "Alt riktig!" : "Du må ha alt riktig for å fullføre."} />;
    
    return (
      <div className={\`text-center \${compact ? 'space-y-4 py-4' : 'space-y-6 py-8'} animate-in fade-in\`}>
        <div className={\`\${compact ? 'w-16 h-16' : 'w-20 h-20'} \${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto\`}>
            {isPerfect ? <CircleCheck size={compact ? 32 : 40} /> : <X size={compact ? 32 : 40} />}
        </div>
        <div><h3 className={\`\${compact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800\`}>Resultat</h3><p className="text-slate-600 mt-1">Du fekk {score} av {questions.length} rette.</p></div>
        {isPerfect ? <button onClick={() => onSuccess(result)} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Fortsett</button> : <button onClick={reset} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"><RotateCw size={16}/> Prøv igjen</button>}
      </div>
    );
  }

  return (
    <div className={\`\${compact ? 'space-y-4' : 'space-y-8'} max-w-2xl mx-auto\`}>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Spørsmål {currentIndex + 1}/{questions.length}</span><span>Poeng: {score}</span></div>
      <div className={\`w-full \${compact ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden\`}><div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: \`\${((currentIndex + 1) / questions.length) * 100}%\` }}></div></div>
      <h3 className={\`\${compact ? 'text-xl py-2' : 'text-2xl py-4'} font-bold text-slate-800 text-center\`}>{currentQ.question}</h3>
      <div className={\`flex gap-4\`}>
          <button onClick={() => !checked && check(true)} disabled={checked} className={\`flex-1 \${compact ? 'p-3' : 'p-6'} rounded-xl border-2 font-bold text-lg transition-all relative \${checked ? (currentQ.isTrue ? 'bg-green-100 border-green-500 text-green-800' : (selected === true ? 'bg-red-100 border-red-500 text-red-800' : 'opacity-40')) : 'bg-white hover:bg-teal-50 hover:border-teal-300'}\`}>
              Sant
              {checked && currentQ.isTrue && <CircleCheck className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
              {checked && !currentQ.isTrue && selected === true && <X className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
          </button>
          <button onClick={() => !checked && check(false)} disabled={checked} className={\`flex-1 \${compact ? 'p-3' : 'p-6'} rounded-xl border-2 font-bold text-lg transition-all relative \${checked ? (!currentQ.isTrue ? 'bg-green-100 border-green-500 text-green-800' : (selected === false ? 'bg-red-100 border-red-500 text-red-800' : 'opacity-40')) : 'bg-white hover:bg-teal-50 hover:border-teal-300'}\`}>
              Usant
              {checked && !currentQ.isTrue && <CircleCheck className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
              {checked && currentQ.isTrue && selected === false && <X className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
          </button>
      </div>
      <div className="pt-4">{checked && <button onClick={next} className={\`w-full \${compact ? 'py-3' : 'py-4'} bg-slate-800 text-white font-bold rounded-xl\`}>Neste</button>}</div>
    </div>
  );
};

// --- PLAYER: CLOZE (FILL IN) ---
const ClozePlayer = ({ data, onSuccess, compact = false }) => {
  const blocks = data.blocks || [{ id: 1, text: data.text }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  
  const currentBlock = blocks[currentIndex];

  // Parse text into parts: "Hello *world*" -> ["Hello ", "world", ""]
  const parts = currentBlock.text.split('*');
  const segments = [];
  
  for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
          segments.push({ text: parts[i], isInput: false });
      } else {
          segments.push({ text: '', isInput: true, answer: parts[i] });
      }
  }

  // Initialize inputs when block changes
  useEffect(() => {
      const inputCount = segments.filter(s => s.isInput).length;
      setInputs(new Array(inputCount).fill(''));
      setChecked(false);
  }, [currentIndex, currentBlock]);

  const handleCheck = () => {
    let correctCount = 0;
    let inputIdx = 0;
    let hasError = false;

    segments.forEach(seg => {
        if(seg.isInput) {
            const val = inputs[inputIdx].trim().toLowerCase();
            const ans = (seg.answer || '').trim().toLowerCase();
            if(val === ans) correctCount++;
            else hasError = true;
            inputIdx++;
        }
    });

    const totalInputs = segments.filter(s => s.isInput).length;
    if (correctCount === totalInputs) setScore(s => s + 1);
    else setMistakes(prev => [...prev, { question: "Fyll inn", correctAnswer: segments.filter(s=>s.isInput).map(s=>s.answer).join(', ') }]);

    setChecked(true);
  };

  const next = () => {
    if (currentIndex < blocks.length - 1) {
      setCurrentIndex(p => p + 1);
    } else {
      setFinished(true);
    }
  };

  const reset = () => { setFinished(false); setCurrentIndex(0); setScore(0); setMistakes([]); };

  if (finished) {
    const result = { score, total: blocks.length, mistakes };
    const isPerfect = score === blocks.length;
    if (!onSuccess) return <CompletionScreen onRestart={reset} score={score} total={blocks.length} mistakes={mistakes} message={isPerfect ? "Gratulerer!" : "Ikke helt..."} subMessage={isPerfect ? "Alt riktig!" : "Du må ha alt riktig for å fullføre."} />;
    
    return (
      <div className={\`text-center \${compact ? 'space-y-4 py-4' : 'space-y-6 py-8'} animate-in fade-in\`}>
        <div className={\`\${compact ? 'w-16 h-16' : 'w-20 h-20'} \${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto\`}>
            {isPerfect ? <CircleCheck size={compact ? 32 : 40} /> : <X size={compact ? 32 : 40} />}
        </div>
        <div><h3 className={\`\${compact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800\`}>Resultat</h3><p className="text-slate-600 mt-1">Du fekk {score} av {blocks.length} rette.</p></div>
        {isPerfect ? <button onClick={() => onSuccess(result)} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Fortsett</button> : <button onClick={reset} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"><RotateCw size={16}/> Prøv igjen</button>}
      </div>
    );
  }

  let inputCounter = 0;

  return (
    <div className={\`\${compact ? 'space-y-4' : 'space-y-8'} max-w-2xl mx-auto\`}>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Oppgave {currentIndex + 1}/{blocks.length}</span><span>Poeng: {score}</span></div>
      <div className={\`w-full \${compact ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden\`}><div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: \`\${((currentIndex + 1) / blocks.length) * 100}%\` }}></div></div>
      
      <div className="leading-loose text-lg text-slate-800 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {segments.map((seg, i) => {
              if (!seg.isInput) return <span key={i}>{seg.text}</span>;
              
              const currentInputIdx = inputCounter++;
              const isCorrect = checked && inputs[currentInputIdx].trim().toLowerCase() === (seg.answer || '').trim().toLowerCase();
              const isWrong = checked && !isCorrect;

              return (
                  <span key={i} className="inline-block mx-1 relative">
                      <input 
                        type="text" 
                        value={inputs[currentInputIdx]} 
                        onChange={(e) => {
                            const newInputs = [...inputs];
                            newInputs[currentInputIdx] = e.target.value;
                            setInputs(newInputs);
                        }}
                        disabled={checked}
                        className={\`border-b-2 outline-none px-1 text-center font-bold bg-slate-50 w-32 \${isCorrect ? 'border-green-500 text-green-700 bg-green-50' : (isWrong ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 focus:border-cyan-500')}\`}
                      />
                      {isCorrect && <CircleCheck size={16} className="absolute -top-3 -right-3 text-green-500 bg-white rounded-full"/>}
                      {isWrong && <X size={16} className="absolute -top-3 -right-3 text-red-500 bg-white rounded-full"/>}
                      {isWrong && <div className="absolute top-full left-0 text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-1 rounded shadow-sm z-10 whitespace-nowrap">{seg.answer}</div>}
                  </span>
              );
          })}
      </div>

      <div className="pt-4">{!checked ? <button onClick={handleCheck} className={\`w-full \${compact ? 'py-3' : 'py-4'} bg-cyan-700 text-white font-bold rounded-xl\`}>Sjekk Svar</button> : <button onClick={next} className={\`w-full \${compact ? 'py-3' : 'py-4'} bg-slate-800 text-white font-bold rounded-xl\`}>Neste</button>}</div>
    </div>
  );
};

// --- PLAYER: HOTSPOT ---
const HotspotPlayer = ({ data, onSuccess }) => {
  const scenes = useMemo(() => data.scenes || (data.imageUrl ? [{id: 'legacy', imageUrl: data.imageUrl, altText: data.altText, hotspots: data.hotspots}] : []), [data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSpot, setActiveSpot] = useState(null);
  const [viewedSpots, setViewedSpots] = useState([]); 
  const [finished, setFinished] = useState(false);

  const currentScene = scenes[currentIndex];
  const isSceneFinished = (currentScene.hotspots || []).every(h => viewedSpots.includes(h.id));

  useEffect(() => {
      setViewedSpots([]);
      setActiveSpot(null);
  }, [currentIndex]);

  const handleSpotClick = (id) => {
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
            
            {(currentScene.hotspots || []).map((hs) => (
                <React.Fragment key={hs.id}>
                <button 
                    onClick={() => handleSpotClick(hs.id)} 
                    style={{ top: \`\${hs.top}%\`, left: \`\${hs.left}%\` }} 
                    className={\`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 z-10 cursor-pointer \${viewedSpots.includes(hs.id) ? 'bg-green-500 text-white' : 'bg-cyan-600 text-white animate-pulse'} ring-4 ring-white/30\`}
                    aria-label={\`Hotspot: \${hs.header}\`}
                >
                    {activeSpot === hs.id ? <X size={20} /> : (viewedSpots.includes(hs.id) ? <CircleCheck size={20} /> : <Plus size={24} strokeWidth={3} />)}
                </button>
                
                {activeSpot === hs.id && (
                    <div style={{ top: \`\${Math.min(hs.top + 8, 80)}%\`, left: \`\${Math.min(Math.max(hs.left - 15, 5), 65)}%\` }} className="absolute w-72 bg-white p-6 rounded-2xl shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-200 origin-top-left border-l-8 border-cyan-600">
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
                <button onClick={onSuccess && currentIndex === scenes.length - 1 ? onSuccess : next} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                    {currentIndex < scenes.length - 1 ? 'Neste bilde' : 'Fullfør'} <ChevronRight size={20}/>
                </button>
            ) : (
                <span className="text-sm text-slate-400 font-medium italic flex items-center gap-2"><Lock size={14}/> Finn alle punktene for å gå videre</span>
            )}
        </div>
    </div>
  );
};

// --- PLAYER: TIMELINE ---
const TimelinePlayer = ({ data, onSuccess }) => {
  const events = React.useMemo(() => {
      return [...(data.events || [])].sort((a, b) => {
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
                      <SafeImage src={currentEvent.imageUrl} className="w-full h-full object-cover absolute inset-0" alt={\`Bilde for \${currentEvent.title}\`} />
                </div>
            )}
            <div className={\`p-8 md:p-12 flex flex-col justify-center \${currentEvent.imageUrl ? 'md:w-1/2' : 'w-full'}\`}>
                <div className="text-cyan-600 font-bold text-2xl mb-3">{currentEvent.date}</div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6 leading-tight">{currentEvent.title}</h3>
                <div className="w-10 h-1 bg-cyan-500 mb-6"></div>
                <p className="text-slate-600 leading-relaxed text-lg">{currentEvent.body}</p>
            </div>
        </div>

        <div className="relative px-6">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
            <div className="relative z-10 flex justify-between items-center overflow-x-auto pb-8 pt-8 hide-scrollbar gap-4 snap-x">
                {events.map((evt, idx) => (
                    <button 
                        key={evt.id} 
                        onClick={() => setActiveIndex(idx)} 
                        className={\`flex-shrink-0 flex flex-col items-center gap-2 group outline-none snap-center focus:outline-none\`}
                        aria-label={\`Gå til \${evt.date}: \${evt.title}\`}
                        aria-current={idx === activeIndex ? 'step' : undefined}
                    >
                        <div className={\`w-4 h-4 rounded-full transition-all duration-300 ring-4 \${idx === activeIndex ? 'bg-cyan-600 scale-150 ring-cyan-100' : 'bg-slate-300 ring-transparent group-hover:bg-cyan-400'}\`} />
                        <span className={\`text-xs font-bold transition-colors \${idx === activeIndex ? 'text-cyan-700' : 'text-slate-400 group-hover:text-cyan-600'}\`}>{evt.date}</span>
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

// --- PLAYER: DRAG & DROP ---
const DragDropPlayer = ({ data, onSuccess }) => {
  const tasks = useMemo(() => data.tasks || (data.backgroundUrl ? [{id: 'legacy', backgroundUrl: data.backgroundUrl, altText: data.altText, items: data.items, zones: data.zones}] : []), [data]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const [items, setItems] = useState([]);
  const [activeDrag, setActiveDrag] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  const currentTask = tasks[currentIndex];

  useEffect(() => {
    if (currentTask) {
        setItems(currentTask.items ? currentTask.items.map(i => ({ ...i, x: null, y: null })) : []);
        setFeedback(null);
        setShowResults(false);
    }
  }, [currentTask]);

  const startDragFromBench = (e, item) => {
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

  const handleMouseDown = (e, id) => {
    if(showResults) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setActiveDrag({ id, offsetX, offsetY, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseMove = (e) => {
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
        const zone = currentTask.zones.find(z => z.id == item.correctZoneId);
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
        setFeedback({ type: 'error', msg: \`Du har plassert \${correctCount} av \${requiredCount} elementer riktig.\` });
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
          <button onClick={() => { setItems(currentTask.items.map(i => ({...i, x: null, y: null}))); setFeedback(null); setShowResults(false); }} className="text-sm text-slate-500 hover:text-cyan-700 underline">Nullstill</button>
      </div>
      
      <div ref={containerRef} className="relative border-2 border-slate-200 rounded-2xl bg-slate-100 min-h-[500px] shadow-inner overflow-hidden">
        <div className="absolute inset-0">
            <SafeImage src={currentTask.backgroundUrl} alt={currentTask.altText || "Bakgrunn"} className="w-full h-full object-cover opacity-90 block pointer-events-none" draggable={false} />
            {(currentTask.zones || []).map(z => (
                <div key={z.id} style={{ top: \`\${z.top}%\`, left: \`\${z.left}%\`, width: \`\${z.width || 15}%\`, height: \`\${z.height || 10}%\` }} className="absolute border-2 border-dashed border-slate-500/30 bg-white/20 rounded-lg flex items-center justify-center group">
                    <span className="text-[10px] font-bold text-slate-600 uppercase bg-white/80 px-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{z.label}</span>
                </div>
            ))}
        </div>
        {items.filter(i => i.x !== null).map(i => (
            <div 
                key={i.id} 
                onMouseDown={(e) => handleMouseDown(e, i.id)} 
                style={{ top: \`\${i.y}%\`, left: \`\${i.x}%\`, position: 'absolute', zIndex: activeDrag?.id === i.id ? 50 : 10 }} 
                className={\`cursor-grab active:cursor-grabbing shadow-lg transition-transform transform hover:scale-105 \${showResults ? (i.isCorrect ? 'ring-4 ring-green-500' : 'ring-4 ring-red-500') : ''} rounded-lg\`}
                aria-label={\`Dra element: \${i.content}\`}
            >
                {i.type === 'image' ? <SafeImage src={i.content} className="w-24 h-24 object-cover rounded-lg border-2 border-white bg-white" draggable={false}/> : <div className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-md border border-cyan-800">{i.content}</div>}
                {showResults && (
                    <div className={\`absolute -top-2 -right-2 rounded-full p-1 text-white \${i.isCorrect ? 'bg-green-500' : 'bg-red-500'}\`}>
                        {i.isCorrect ? <CircleCheck size={12}/> : <X size={12}/>}
                    </div>
                )}
            </div>
        ))}
      </div>
      
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[120px] flex gap-4 flex-wrap items-center justify-center">
         {items.filter(i => i.x === null).length === 0 && <span className="text-slate-400 text-sm italic">Alle elementer er plassert</span>}
         {items.filter(i => i.x === null).map(i => (
             <div key={i.id} onMouseDown={(e) => startDragFromBench(e, i)} className="cursor-grab hover:scale-105 transition-transform" aria-label={\`Dra element: \${i.content}\`}>
                {i.type === 'image' ? <SafeImage src={i.content} className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 bg-white shadow-sm" draggable={false}/> : <div className="bg-white border-2 border-cyan-100 text-cyan-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:border-cyan-300 hover:shadow-md transition-all">{i.content}</div>}
             </div>
         ))}
      </div>
      
      <div className="flex justify-center items-center pt-4">
         {feedback && <div className={\`mr-6 font-bold text-lg animate-in fade-in slide-in-from-bottom-2 \${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}\`}>{feedback.msg}</div>}
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

// --- PLAYER: MEMORY ---
const MemoryPlayer = ({ data, onSuccess }) => {
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [cards, setCards] = useState([]);
  const [finished, setFinished] = useState(false);
  
  useEffect(() => {
    setCards([...data.cards].sort(() => Math.random() - 0.5));
  }, [data]);

  useEffect(() => {
      if (matched.length === data.cards.length && data.cards.length > 0 && onSuccess) {
          // Optional delay
      }
  }, [matched, data.cards.length, onSuccess]);

  const handleCardClick = (idx) => {
    if (flipped.length === 2 || matched.includes(idx) || flipped.includes(idx)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const id1 = cards[newFlipped[0]].pairId;
      const id2 = cards[newFlipped[1]].pairId;
      if (id1 === id2) {
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };
  
  const isAllMatched = matched.length === data.cards.length && data.cards.length > 0;

  if (finished && !onSuccess) return <CompletionScreen onRestart={() => { setMatched([]); setFlipped([]); setFinished(false); setCards([...data.cards].sort(() => Math.random() - 0.5)); }} />;

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-4 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {cards.map((card, idx) => (
            <div key={card.id} onClick={() => handleCardClick(idx)} className="aspect-square perspective-1000 cursor-pointer group">
                 <div className={\`relative w-full h-full transition-all duration-500 transform-style-3d \${flipped.includes(idx) || matched.includes(idx) ? 'rotate-y-180' : ''}\`}>
                      {/* FRONT (Hidden) */}
                      <div className={\`absolute inset-0 w-full h-full bg-cyan-700 rounded-xl border-b-4 border-cyan-900 flex items-center justify-center shadow-md group-hover:-translate-y-1 transition-transform backface-hidden\`}>
                           <Hexagon className="text-cyan-500/30" size={40} fill="currentColor"/>
                      </div>
                      {/* BACK (Revealed) */}
                      <div className="absolute inset-0 w-full h-full bg-white border-2 border-cyan-500 rounded-xl flex items-center justify-center text-xl md:text-3xl font-bold text-cyan-800 shadow-lg rotate-y-180 backface-hidden">
                           {card.content}
                      </div>
                 </div>
            </div>
        ))}
        </div>
        {isAllMatched && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="text-green-600 font-bold text-xl mb-4">Alle par funnet!</div>
                <button onClick={() => onSuccess ? onSuccess({}) : setFinished(true)} className="px-10 py-3 bg-cyan-700 text-white rounded-xl font-bold hover:bg-cyan-800 shadow-lg transition-transform active:scale-95">Fullført</button>
            </div>
        )}
    </div>
  );
};

// --- PLAYER: VIDEO ---
const VideoPlayer = ({ data, onSuccess }) => {
  const scenes = useMemo(() => data.scenes || (data.videoUrl ? [{id: 'legacy', videoUrl: data.videoUrl, interactions: data.interactions}] : []), [data]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completedInteractions, setCompletedInteractions] = useState([]); 
  const [sceneResults, setSceneResults] = useState({}); 
  
  const videoRef = useRef(null);
  const [activeInteraction, setActiveInteraction] = useState(null);
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
    const interaction = (currentScene.interactions || []).find(i => 
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

  const handleInteractionComplete = (result) => {
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
      const totalScore = allResults.reduce((acc, r) => acc + (r.score || 0), 0);
      const totalMax = allResults.reduce((acc, r) => acc + (r.total || 0), 0);
      const allMistakes = allResults.flatMap(r => r.mistakes || []);
      const isPerfect = totalScore === totalMax;

      if (!onSuccess) return <CompletionScreen onRestart={() => { setFinished(false); setCurrentIndex(0); setSceneResults({}); }} score={totalScore} total={totalMax} mistakes={allMistakes} isPerfect={isPerfect} />;
      
      return (
          <div className="text-center space-y-6 py-8 bg-white rounded-xl border border-slate-100 animate-in fade-in">
              <div className={\`w-16 h-16 rounded-full flex items-center justify-center mx-auto \${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}\`}>
                  {isPerfect ? <CircleCheck size={32}/> : <X size={32}/>}
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
                      top: \`\${activeInteraction.y || 50}%\`, 
                      left: \`\${activeInteraction.x || 50}%\` 
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
                <div className="text-green-700 font-bold flex items-center justify-center gap-2"><CircleCheck/> Video ferdigspilt!</div>
                <button onClick={next} className="px-6 py-2 bg-cyan-700 text-white rounded-lg font-bold hover:bg-cyan-800 flex items-center gap-2 mx-auto">
                    {currentIndex < scenes.length - 1 ? 'Neste Video' : 'Fullfør'} <ChevronRight size={18}/>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

// --- PLAYER: MIXED ---
const MixedPlayer = ({ data }) => {
  const [index, setIndex] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState([]); // Accumulate scores/mistakes from each part
  const currentItem = data.items[index];

  useEffect(() => { setStepCompleted(false); }, [index]);

  if (finished) {
      const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
      const totalMax = results.reduce((acc, r) => acc + (r.total || 0), 0);
      const allMistakes = results.flatMap(r => r.mistakes || []);
      
      return <CompletionScreen onRestart={() => { setFinished(false); setIndex(0); setResults([]); }} score={totalScore} total={totalMax} mistakes={allMistakes} message="Gratulerer!" subMessage="Du har fullført alle deloppgavene." />;
  }
  
  if (!currentItem) return <div className="text-center text-slate-400 py-12">Ingen innhold å vise.</div>;

  const handleStepSuccess = (res) => {
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

  const renderSub = (type, subData) => {
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
            <span className={\`w-2 h-2 rounded-full \${stepCompleted ? 'bg-green-500' : 'bg-slate-300'}\`}></span>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">{currentItem.type}</span>
        </div>
      </div>
      
      <div className="py-4 relative min-h-[300px]">
          {renderSub(currentItem.type, currentItem.data)}
          {!stepCompleted && <div className="absolute -top-2 -right-2"><Lock size={20} className="text-slate-300 opacity-50" title="Du må fullføre før du kan gå videre" /></div>}
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
`;