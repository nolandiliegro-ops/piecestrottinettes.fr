import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Send, Loader2, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import {
  useOrderConversations,
  useOrderMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  type ConversationSummary,
} from '@/hooks/useOrderMessages';

// Conversation List
const ConversationList = ({
  conversations,
  isLoading,
  onSelect,
}: {
  conversations: ConversationSummary[];
  isLoading: boolean;
  onSelect: (conv: ConversationSummary) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-mineral" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-mineral/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-mineral/40" />
        </div>
        <h3 className="font-display text-lg text-carbon tracking-wide mb-2">AUCUN MESSAGE</h3>
        <p className="text-carbon/50 max-w-sm text-sm">
          Vos conversations avec le support apparaîtront ici. Envoyez un premier message depuis le détail d'une commande.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <motion.button
          key={conv.order_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(conv)}
          className="w-full text-left p-4 bg-white/60 backdrop-blur-md border border-white/10 rounded-2xl hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-mineral" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-carbon text-sm">{conv.order_number}</span>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-carbon/50 truncate mt-0.5">{conv.last_message}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-carbon/40">
                {format(new Date(conv.last_message_at), "d MMM", { locale: fr })}
              </span>
              <ChevronRight className="w-4 h-4 text-carbon/30 group-hover:text-mineral transition-colors" />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// Chat View
const ChatView = ({
  orderId,
  orderNumber,
  onBack,
}: {
  orderId: string;
  orderNumber: string;
  onBack: () => void;
}) => {
  const { user } = useAuth();
  const { messages, isLoading } = useOrderMessages(orderId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when opening
  useEffect(() => {
    markAsRead.mutate(orderId);
  }, [orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id) return;
    const text = input.trim();
    setInput('');
    await sendMessage.mutateAsync({
      orderId,
      message: text,
      senderType: 'client',
      userId: user.id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-carbon/10 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-mineral/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="font-display text-sm tracking-wide text-carbon">COMMANDE</h3>
          <span className="font-mono text-mineral text-sm font-bold">{orderNumber}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-mineral" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-carbon/40">Aucun message. Envoyez le premier !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.sender_type === 'client';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", isClient ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  isClient
                    ? "bg-mineral text-white rounded-br-md"
                    : "bg-white/80 border border-carbon/10 text-carbon rounded-bl-md"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    isClient ? "text-white/60" : "text-carbon/40"
                  )}>
                    {format(new Date(msg.created_at), "d MMM HH:mm", { locale: fr })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-carbon/10">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            rows={1}
            className="flex-1 resize-none bg-white/60 border border-carbon/10 rounded-xl px-4 py-3 text-sm text-carbon placeholder:text-carbon/30 focus:outline-none focus:border-mineral/40 min-h-[44px] max-h-[120px]"
          />
          <Button
            size="icon"
            disabled={!input.trim() || sendMessage.isPending}
            onClick={handleSend}
            className="w-11 h-11 rounded-xl bg-mineral hover:bg-mineral/90 text-white shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const GarageMessages = () => {
  const { data: conversations = [], isLoading } = useOrderConversations();
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {selectedConv ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <ChatView
              orderId={selectedConv.order_id}
              orderNumber={selectedConv.order_number}
              onBack={() => setSelectedConv(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-carbon tracking-wide">MESSAGES</h2>
                <p className="text-sm text-carbon/50">Vos conversations avec le support</p>
              </div>
            </div>
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              onSelect={setSelectedConv}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GarageMessages;
