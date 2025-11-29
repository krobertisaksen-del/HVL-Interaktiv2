import React, { useState } from 'react';
import { CircleCheck, X, RotateCw } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

export const TFPlayer: React.FC<PlayerProps> = ({ data, onSuccess, compact = false }) => {
  const questions = data.questions || [{ id: 1, question: data.question, isTrue: data.isTrue }];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const currentQ = questions[currentIndex];

  const check = (choice: boolean) => {
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
      <div className={`text-center ${compact ? 'space-y-4 py-4' : 'space-y-6 py-8'} animate-in fade-in`}>
        <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} ${isPerfect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto`}>
            {isPerfect ? <CircleCheck size={compact ? 32 : 40} /> : <X size={compact ? 32 : 40} />}
        </div>
        <div><h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>Resultat</h3><p className="text-slate-600 mt-1">Du fekk {score} av {questions.length} rette.</p></div>
        {isPerfect ? <button onClick={() => onSuccess(result)} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Fortsett</button> : <button onClick={reset} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"><RotateCw size={16}/> Prøv igjen</button>}
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-8'} max-w-2xl mx-auto`}>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Spørsmål {currentIndex + 1}/{questions.length}</span><span>Poeng: {score}</span></div>
      <div className={`w-full ${compact ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden`}><div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div></div>
      <h3 className={`${compact ? 'text-xl py-2' : 'text-2xl py-4'} font-bold text-slate-800 text-center`}>{currentQ.question}</h3>
      <div className={`flex gap-4`}>
          <button onClick={() => !checked && check(true)} disabled={checked} className={`flex-1 ${compact ? 'p-3' : 'p-6'} rounded-xl border-2 font-bold text-lg transition-all relative ${checked ? (currentQ.isTrue ? 'bg-green-100 border-green-500 text-green-800' : (selected === true ? 'bg-red-100 border-red-500 text-red-800' : 'opacity-40')) : 'bg-white hover:bg-teal-50 hover:border-teal-300'}`}>
              Sant
              {checked && currentQ.isTrue && <CircleCheck className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
              {checked && !currentQ.isTrue && selected === true && <X className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
          </button>
          <button onClick={() => !checked && check(false)} disabled={checked} className={`flex-1 ${compact ? 'p-3' : 'p-6'} rounded-xl border-2 font-bold text-lg transition-all relative ${checked ? (!currentQ.isTrue ? 'bg-green-100 border-green-500 text-green-800' : (selected === false ? 'bg-red-100 border-red-500 text-red-800' : 'opacity-40')) : 'bg-white hover:bg-teal-50 hover:border-teal-300'}`}>
              Usant
              {checked && !currentQ.isTrue && <CircleCheck className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
              {checked && currentQ.isTrue && selected === false && <X className="absolute right-4 top-1/2 -translate-y-1/2" size={20}/>}
          </button>
      </div>
      <div className="pt-4">{checked && <button onClick={next} className={`w-full ${compact ? 'py-3' : 'py-4'} bg-slate-800 text-white font-bold rounded-xl`}>Neste</button>}</div>
    </div>
  );
};