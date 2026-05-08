'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help with meal plans, shopping lists, or finding recipes. What do you need?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply || data.error || 'Sorry, something went wrong.' },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error. Try again.' },
      ]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <button
            onClick={() => setOpen(true)}
            className="pointer-events-auto w-full flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-cream-dark rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-sage/30 transition-all text-left group"
          >
            <span className="text-xl">🤖</span>
            <span className="flex-1 text-sm text-gray-400">Ask about recipes, meal plans, or shopping lists...</span>
            <span className="text-gray-300 group-hover:text-sage transition-colors">▲</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="max-w-3xl mx-auto">
        {/* Chat panel */}
        <div className="bg-white/95 backdrop-blur-sm border border-cream-dark rounded-t-2xl shadow-xl overflow-hidden mx-4">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-cream-dark">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-display font-bold text-charcoal text-sm">Recipe Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-sage text-white rounded-br-xl'
                      : 'bg-cream-dark/60 text-warm rounded-bl-xl'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex gap-2 px-4 py-3 border-t border-cream-dark">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-cream-dark bg-cream/50 focus:outline-none focus:ring-2 focus:ring-sage/20 text-sm text-warm placeholder-gray-400"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-sage text-white rounded-xl text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
