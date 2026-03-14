import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES = [
  'Com base no seu perfil, recomendo priorizar a quitação do cartão de crédito e manter o aporte na reserva de emergência. Quer que eu detalhe um plano?',
  'Sua saúde financeira está em nível equilibrado. Os principais pontos de atenção são os gastos variáveis e a meta de reserva. Posso sugerir próximos passos.',
  'Entendi. Posso ajudar a revisar suas metas, analisar dívidas ou sugerir insights a partir do seu diagnóstico. O que prefere?',
  'Ótima pergunta. A AURA analisa seu fluxo de caixa, dívidas e metas para gerar um score e recomendações personalizadas. Quer explorar algum módulo em específico?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const replyIndex = messages.length % MOCK_RESPONSES.length;
    const reply = MOCK_RESPONSES[replyIndex];
    const delay = 800 + Math.random() * 600;

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] sm:min-h-[calc(100dvh-10rem)] flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex-shrink-0 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-foreground tracking-tight">
              Assistente AURA
            </h1>
            <p className="text-xs text-muted-foreground">
              Dúvidas sobre finanças, metas e diagnóstico
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-1 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary" />
            </div>
            <p className="font-display font-semibold text-foreground text-lg tracking-tight mb-1">
              Como posso ajudar sua saúde financeira hoje?
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Pergunte sobre metas, dívidas, diagnóstico ou próximos passos.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                'Como melhorar meu score?',
                'Priorizar dívidas ou reserva?',
                'Explique meu diagnóstico',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/60 border border-border text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted/60 border border-border">
                  <Loader2 size={18} className="text-primary animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 pb-2 sm:pb-4">
        <div className="flex gap-2 rounded-2xl bg-muted/60 border border-border p-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem para a AURA..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              input.trim() && !isTyping
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/60 text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-2 text-center">
          A AURA pode cometer erros. Use as informações apenas como apoio à decisão.
        </p>
      </div>
    </div>
  );
}
