import React from 'react';
import { MessageSquare } from 'lucide-react';
import { socketService } from '../../services/socketService';

const EMOJIS = ['😂', '🔥', '😱', '👏', '👑', '😭'];
const QUICK_PHRASES = ['Good luck!', 'Nice move!', 'Hurry up!', 'GG!'];

export const QuickChatBar: React.FC = () => {
  const send = (emoji: string, text = '') => {
    socketService.getSocket()?.emit('send_reaction', { emoji, text });
  };

  return (
    <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => send(emoji)}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-base active:scale-90 transition"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => send('💬', phrase)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-amber-400 hover:text-slate-950 text-[10px] font-bold text-slate-300 transition"
          >
            <MessageSquare className="w-2.5 h-2.5" />
            {phrase}
          </button>
        ))}
      </div>
    </div>
  );
};