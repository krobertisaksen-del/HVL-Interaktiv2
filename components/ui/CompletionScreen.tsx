import React from 'react';
import { Trophy, CircleAlert, RotateCw } from 'lucide-react';

interface CompletionScreenProps {
  onRestart?: () => void;
  score?: number;
  total?: number;
  mistakes?: any[];
  message?: string;
  subMessage?: string;
  showRestart?: boolean;
  isPerfect?: boolean;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ onRestart, score, total, mistakes = [], message = "Aktivitet fullført!", subMessage = "Godt jobba!", showRestart = true, isPerfect = true }) => {
  // Calculate percentage only if total is provided and greater than 0, else default to 100 (completion only)
  const hasScore = typeof score === 'number' && typeof total === 'number' && total > 0;
  const percentage = hasScore ? Math.round((score! / total!) * 100) : 100;
  
  // Override isPerfect based on score if available
  const actualIsPerfect = hasScore ? score === total : isPerfect;

  return (
    <div className="text-center space-y-8 animate-in fade-in py-12 bg-white rounded-xl border border-slate-100 shadow-sm h-full flex flex-col justify-center items-center max-w-2xl mx-auto">
      
      {hasScore ? (
          <div className="relative w-32 h-32 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                 <circle cx="64" cy="64" r="58" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                 <circle cx="64" cy="64" r="58" stroke={actualIsPerfect ? "#16a34a" : "#ef4444"} strokeWidth="8" fill="none" strokeDasharray={364} strokeDashoffset={364 - (364 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={`text-3xl font-bold ${actualIsPerfect ? 'text-slate-800' : 'text-red-600'}`}>{score}/{total}</span>
                 <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Poeng</span>
             </div>
          </div>
      ) : (
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm mb-2">
          <Trophy size={48} />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-slate-800">{message}</h3>
        <p className="text-slate-500 text-lg">{subMessage}</p>
      </div>

      {/* Mistakes Summary Section */}
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
        <button onClick={onRestart} className={`px-8 py-3 ${actualIsPerfect ? 'bg-cyan-700 hover:bg-cyan-800' : 'bg-slate-700 hover:bg-slate-800'} text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto mt-6`}>
          <RotateCw size={20}/> {actualIsPerfect ? 'Start på nytt' : 'Prøv igjen'}
        </button>
      )}
    </div>
  );
};