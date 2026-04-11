import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askFinancialAssistant } from '@/services/aiAssistant';
import { useAuth } from '@/context/AuthContext';
import { tenantCanUseChat } from '@/lib/billing';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
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
    try {
      const response = await askFinancialAssistant({ message: text, mode: 'tenant' });
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const fallback: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Não consegui falar com o agente financeiro agora. Verifique se a API está em execução em http://localhost:3001 e tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (user && !tenantCanUseChat(user)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-primary" />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Chat IA para assinantes</h1>
        <p className="text-sm text-muted-foreground">
          O assistente com IA está disponível apenas para planos pagos. Você ainda pode usar o app no período
          de teste de 1 hora; para conversar com a AURA, assine um plano.
        </p>
        <Link
          to="/app/planos"
          className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow hover:bg-primary/90"
        >
          Ver planos e assinar
        </Link>
      </div>
    );
  }

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
