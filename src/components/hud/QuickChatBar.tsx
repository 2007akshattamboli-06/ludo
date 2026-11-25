import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { PlayerColor } from '../../types/game';
import { PLAYER_THEMES } from '../../game/constants/boardConstants';
import { socketService } from '../../services/socketService';

export interface InMatchChatMessage {
  id: string;
  senderName: string;
  color: PlayerColor;
  emoji?: string;
  text: string;
}

interface QuickChatBarProps {
  messages?: InMatchChatMessage[];
  onLocalMessage?: (emoji: string, text: string) => void;
}

const EMOJIS = ['😂', '🔥', '😱', '👏', '👑', '😭'];
const QUICK_PHRASES = ['Good luck!', 'Nice move!', 'Hurry up!', 'GG!'];

export const QuickChatBar: React.FC<QuickChatBarProps> = ({
  messages = [],
  onLocalMessage,
}) => {
  const [draft, setDraft] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = (emoji: string, text = '') => {
    const cleanText = text.trim();
    if (!emoji && !cleanText) return;
    socketService.getSocket()?.emit('send_reaction', { emoji, text: cleanText });
    onLocalMessage?.(emoji, cleanText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    send('💬', clean.slice(0, 80));
    setDraft('');
  };

  return (
    <div className="p-3 rounded-2xl bg-[#161C2A]/95 border border-white/10 space-y-2.5 shadow-xl">
      {/* Live Match Chat Feed */}
      {messages.length > 0 && (
        <div
          ref={feedRef}
          className="max-h-24 overflow-y-auto space-y-1.5 px-2.5 py-2 rounded-xl bg-[#0B0E17]/90 border border-white/5 text-xs"
        >
          {messages.slice(-15).map((m) => (
            <div key={m.id} className="flex items-start gap-1.5 leading-snug">
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: PLAYER_THEMES[m.color]?.primary || '#FACC15' }}
              />
              <p className="text-slate-200 break-words">
                <span className="font-extrabold text-white">
                  {m.senderName}:{' '}
                </span>
                {m.emoji && m.emoji !== '💬' ? `${m.emoji} ` : ''}
                <span>{m.text}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Bar */}
      <div className="flex items-center justify-between gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => send(emoji)}
            className="w-8 h-8 rounded-xl bg-[#10141F] border border-white/5 hover:border-[#FACC15]/50 hover:bg-[#1E2638] flex items-center justify-center text-base active:scale-90 transition cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick Phrases */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => send('💬', phrase)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10141F] border border-white/10 hover:bg-[#FACC15] hover:text-[#0B0E17] text-[10px] font-bold text-slate-300 transition cursor-pointer"
          >
            <MessageSquare className="w-2.5 h-2.5" />
            {phrase}
          </button>
        ))}
      </div>

      {/* Custom Live Chat Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 pt-0.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something in match..."
          maxLength={80}
          className="flex-1 min-w-0 px-3 py-2 rounded-full bg-[#0B0E17] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FACC15]"
        />
        <button
          type="submit"
          aria-label="Send Message"
          className="w-8 h-8 rounded-full bg-[#FACC15] text-[#0B0E17] flex items-center justify-center shrink-0 hover:brightness-105 active:scale-90 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};