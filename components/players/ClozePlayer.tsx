import React, { useState, useEffect } from 'react';
import { CircleCheck, X, RotateCw } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

export const ClozePlayer: React.FC<PlayerProps> = ({ data, onSuccess, compact = false }) => {
  const blocks = data.blocks || [{ id: 1, text: data.text }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState<any[]>([]);
  
  const currentBlock = blocks[currentIndex];

  // Parse text into parts: "Hello *world*" -> ["Hello ", "world", ""]
  const parts = currentBlock.text.split('*');
  const segments: { text: string; isInput: boolean; answer?: string }[] = [];
  
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
      <div className={`text-center ${compact ? 'space-y-4 py-4' : 'space-y-6 py-8'} animate-in fade-in`}>
        <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} ${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto`}>
            {isPerfect ? <CircleCheck size={compact ? 32 : 40} /> : <X size={compact ? 32 : 40} />}
        </div>
        <div><h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>Resultat</h3><p className="text-slate-600 mt-1">Du fekk {score} av {blocks.length} rette.</p></div>
        {isPerfect ? <button onClick={() => onSuccess(result)} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Fortsett</button> : <button onClick={reset} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"><RotateCw size={16}/> Prøv igjen</button>}
      </div>
    );
  }

  let inputCounter = 0;

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-8'} max-w-2xl mx-auto`}>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Oppgave {currentIndex + 1}/{blocks.length}</span><span>Poeng: {score}</span></div>
      <div className={`w-full ${compact ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden`}><div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / blocks.length) * 100}%` }}></div></div>
      
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
                        className={`border-b-2 outline-none px-1 text-center font-bold bg-slate-50 w-32 ${isCorrect ? 'border-green-500 text-green-700 bg-green-50' : (isWrong ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 focus:border-cyan-500')}`}
                      />
                      {isCorrect && <CircleCheck size={16} className="absolute -top-3 -right-3 text-green-500 bg-white rounded-full"/>}
                      {isWrong && <X size={16} className="absolute -top-3 -right-3 text-red-500 bg-white rounded-full"/>}
                      {isWrong && <div className="absolute top-full left-0 text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-1 rounded shadow-sm z-10 whitespace-nowrap">{seg.answer}</div>}
                  </span>
              );
          })}
      </div>

      <div className="pt-4">{!checked ? <button onClick={handleCheck} className={`w-full ${compact ? 'py-3' : 'py-4'} bg-cyan-700 text-white font-bold rounded-xl`}>Sjekk Svar</button> : <button onClick={next} className={`w-full ${compact ? 'py-3' : 'py-4'} bg-slate-800 text-white font-bold rounded-xl`}>Neste</button>}</div>
    </div>
  );
};