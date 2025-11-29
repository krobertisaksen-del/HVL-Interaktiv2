import React, { useState, useEffect } from 'react';
import { Hexagon } from 'lucide-react';
import { CompletionScreen } from '../ui/CompletionScreen';
import { PlayerProps } from '../../types';

export const MemoryPlayer: React.FC<PlayerProps> = ({ data, onSuccess }) => {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [finished, setFinished] = useState(false);
  
  useEffect(() => {
    setCards([...data.cards].sort(() => Math.random() - 0.5));
  }, [data]);

  useEffect(() => {
      if (matched.length === data.cards.length && data.cards.length > 0 && onSuccess) {
          // Optional delay
      }
  }, [matched, data.cards.length, onSuccess]);

  const handleCardClick = (idx: number) => {
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
                 <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flipped.includes(idx) || matched.includes(idx) ? 'rotate-y-180' : ''}`}>
                      {/* FRONT (Hidden) */}
                      <div className={`absolute inset-0 w-full h-full bg-cyan-700 rounded-xl border-b-4 border-cyan-900 flex items-center justify-center shadow-md group-hover:-translate-y-1 transition-transform backface-hidden`}>
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