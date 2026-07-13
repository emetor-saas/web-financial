import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Send, Loader2, Crown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  askFinancialAssistant,
  clearAssistantChatHistory,
  fetchAssistantChatHistory,
  type AiAssistantResponse,
} from '@/services/aiAssistant';
import { useAuth } from '@/context/AuthContext';
import { tenantCanUseChat } from '@/lib/billing';
import { toast } from 'sonner';
import { MentorStructuredCards } from '@/components/MentorStructuredCards';
import { ConsentGateBanner, useHasConsent } from '@/components/ConsentGateBanner';
import { MentorCheckInsCard } from '@/components/MentorCheckInsCard';
import { ChatMessageContent } from '@/components/ChatMessageContent';

type MessageRole = 'user' | 'assistant';

interface Message {
  /** Chave estável de UI (não troca no meio da conversa). */
  id: string;
  serverId?: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  mentor?: AiAssistantResponse['mentor'];
  diagnosis?: AiAssistantResponse['diagnosis'];
}

function scrollChatToBottom(el: HTMLDivElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior });
}

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasConsent, isLoading: consentLoading } = useHasConsent('ai_chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyLoadedForUser = useRef<string | null>(null);

  const canChat = Boolean(user && tenantCanUseChat(user));
  const userId = user?.id ?? '';

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const rows = await fetchAssistantChatHistory('tenant');
      setMessages(
        rows.map((row) => ({
          id: row.id,
          serverId: row.id,
          role: row.role,
          content: row.content,
          timestamp: new Date(row.createdAt),
        })),
      );
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Só carrega histórico quando o usuário (ou permissão de chat) muda de verdade —
  // não a cada poll de /me (novo objeto user a cada 60s).
  useEffect(() => {
    if (!canChat || !userId) {
      historyLoadedForUser.current = null;
      setIsLoadingHistory(false);
      if (!canChat) setMessages([]);
      return;
    }
    if (historyLoadedForUser.current === userId) return;
    historyLoadedForUser.current = userId;
    void loadHistory();
  }, [canChat, userId, loadHistory]);

  useLayoutEffect(() => {
    if (isLoadingHistory) return;
    scrollChatToBottom(scrollRef.current, messages.length <= 2 ? 'auto' : 'smooth');
  }, [messages.length, isTyping, isLoadingHistory]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping || !hasConsent) return;

    const clientId = crypto.randomUUID();
    const userMsg: Message = {
      id: clientId,
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
        id: response.assistantMessageId ?? crypto.randomUUID(),
        serverId: response.assistantMessageId,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        mentor: response.mentor ?? null,
        diagnosis: response.diagnosis ?? null,
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientId
            ? { ...m, serverId: response.userMessageId ?? m.serverId }
            : m,
        ).concat(assistantMsg),
      );
      void queryClient.invalidateQueries({ queryKey: ['mentor-check-ins'] });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== clientId));
      const msg = err instanceof Error ? err.message : '';
      const isQuota =
        msg.includes('429') || msg.includes('quota') || msg.includes('insufficient_quota');
      const fallback: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: isQuota
          ? 'A IA está temporariamente indisponível (limite de créditos da OpenAI). Tente mais tarde ou verifique a configuração da API.'
          : 'Não consegui falar com a Clareza agora. Verifique se a API está em execução e tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
      toast.error(isQuota ? 'Limite de IA atingido' : 'Erro ao enviar mensagem');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (isTyping || messages.length === 0) return;
    try {
      await clearAssistantChatHistory('tenant');
      setMessages([]);
    } catch {
      /* ignore */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (user && !tenantCanUseChat(user)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-primary" />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Chat IA para assinantes</h1>
        <p className="text-sm text-muted-foreground">
          O assistente com IA está disponível apenas para planos pagos. Você ainda pode usar o app no período
          de teste de 1 hora; para conversar com a Clareza, assine um plano.
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
    <div className="min-h-[calc(100dvh-8rem)] sm:min-h-[calc(100dvh-10rem)] flex flex-col max-w-3xl mx-auto w-full px-1 sm:px-0">
      <div className="flex-shrink-0 py-3 sm:py-4 border-b border-border px-1 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-foreground tracking-tight">
                Assistente Clareza
              </h1>
              <p className="text-xs text-muted-foreground">
                Análise dos seus dados financeiros + histórico da conversa
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClearHistory()}
              disabled={isTyping}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              title="Limpar histórico"
            >
              <Trash2 size={14} />
              Limpar
            </button>
          )}
        </div>
        <ConsentGateBanner
          purpose="ai_chat"
          title="Autorização necessária para o chat"
          description="Para usar o mentor de IA, autorize o tratamento de dados da finalidade Chat com IA (LGPD)."
        />
        <MentorCheckInsCard />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 px-1 min-h-0"
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full min-h-[280px]">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary" />
            </div>
            <p className="font-display font-semibold text-foreground text-lg tracking-tight mb-1">
              Como posso ajudar sua saúde financeira hoje?
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Pergunte sobre metas, dívidas, diagnóstico ou próximos passos. Suas conversas ficam salvas aqui.
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
                  onClick={() => setInput(suggestion)}
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
                className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[88%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/60 border border-border text-foreground',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <ChatMessageContent content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.diagnosis && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {msg.diagnosis.state.code} · {msg.diagnosis.state.label_pt} ·{' '}
                      {msg.diagnosis.priority.title}
                    </p>
                  )}
                  {msg.role === 'assistant' && msg.mentor && (
                    <MentorStructuredCards mentor={msg.mentor} />
                  )}
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

      <div className="flex-shrink-0 pt-3 sm:pt-4 pb-2 sm:pb-4">
        <div className="flex gap-2 rounded-2xl bg-muted/60 border border-border p-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem para a Clareza..."
            rows={1}
            disabled={isLoadingHistory || !hasConsent || consentLoading}
            className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isTyping || isLoadingHistory || !hasConsent}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              input.trim() && !isTyping && !isLoadingHistory && hasConsent
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/60 text-muted-foreground cursor-not-allowed',
            )}
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-2 text-center">
          A Clareza analisa seus lançamentos, metas e dívidas a cada mensagem. Pode cometer erros — use como apoio.
        </p>
      </div>
    </div>
  );
}
