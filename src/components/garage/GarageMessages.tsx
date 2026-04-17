import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Send, Loader2, Package, ChevronRight, Mail, Plus, Paperclip, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  useOrderConversations,
  useOrderMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  type ConversationSummary,
  type OrderMessage,
} from '@/hooks/useOrderMessages';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadMessageImage = async (file: File, userId: string): Promise<string> => {
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Image trop volumineuse (max 5 Mo)');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('order-messages-images').upload(path, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('order-messages-images').getPublicUrl(path);
  return urlData.publicUrl;
};

// Image preview in chat bubble
const MessageImage = ({ url }: { url: string }) => {
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <>
      <img
        src={url}
        alt="Image jointe"
        onClick={() => setFullscreen(true)}
        className="mt-2 rounded-lg max-w-[240px] max-h-[180px] object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
      />
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
          <img src={url} alt="Image jointe" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </>
  );
};

// Attachment button + hidden file input
const AttachButton = ({ onFileSelected, disabled }: { onFileSelected: (file: File) => void; disabled?: boolean }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-11 h-11 rounded-xl text-carbon/40 hover:text-mineral hover:bg-mineral/10 shrink-0"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
          e.target.value = '';
        }}
      />
    </>
  );
};

// Image preview before sending
const ImagePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="relative inline-block">
      <img src={url} alt="Aperçu" className="w-20 h-20 object-cover rounded-xl border border-carbon/10" />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// New Message Form
const NewMessageForm = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const sendMessage = useSendMessage();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: userOrders = [] } = useQuery({
    queryKey: ['user-orders-for-message', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, order_items(part_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        first_item: o.order_items?.[0]?.part_name || '',
      }));
    },
    enabled: !!user?.id,
  });

  const handleFileSelected = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }
    setImageFile(file);
  };

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || !user?.id) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadMessageImage(imageFile, user.id);
      }

      const fullMessage = subject.trim() ? `[${subject.trim()}]\n${message.trim()}` : message.trim();
      await sendMessage.mutateAsync({
        orderId: selectedOrderId || null,
        message: fullMessage || '📷 Image',
        senderType: 'client',
        userId: user.id,
        imageUrl,
      });

      const selectedOrder = userOrders.find(o => o.id === selectedOrderId);
      const convId = selectedOrderId || user.id;
      const customerName = profile?.display_name || user.email || 'Client';

      try {
        await Promise.all([
          supabase.functions.invoke('send-message-notification', {
            body: {
              recipient: 'admin',
              customerEmail: user.email,
              customerName,
              orderNumber: selectedOrder?.order_number || undefined,
              messageText: fullMessage || '📷 Image',
              conversationId: convId,
              imageUrl,
              userId: user.id,
            },
          }),
          supabase.functions.invoke('send-message-notification', {
            body: {
              recipient: 'client-ack',
              customerEmail: user.email,
              customerName,
              orderNumber: selectedOrder?.order_number || undefined,
              messageText: fullMessage || '📷 Image',
              conversationId: convId,
              imageUrl,
            },
          }),
        ]);
      } catch (e) {
        console.error('Failed to send notifications:', e);
      }

      toast.success('Message envoyé !');
      onClose();
    } catch (e) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white/80 backdrop-blur-md border border-mineral/20 rounded-2xl p-5 mb-5 space-y-4"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-carbon/5">
        <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
          <span className="text-lg">✉️</span>
        </div>
        <div>
          <h3 className="font-display text-sm tracking-wide text-carbon">NOUS CONTACTER</h3>
          <p className="text-xs text-carbon/50">Une question sur une commande ou un produit ?</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-carbon/70 uppercase tracking-wide">Sujet</label>
        <Input
          placeholder="Ex: Question sur ma commande..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-white border-carbon/10 rounded-xl text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-carbon/70 uppercase tracking-wide">Commande liée (optionnel)</label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full bg-white border border-carbon/10 rounded-xl px-3 py-2.5 text-sm text-carbon focus:outline-none focus:border-mineral/40 transition-colors"
        >
          <option value="">Aucune commande</option>
          {userOrders.map(o => (
            <option key={o.id} value={o.id}>
              {o.order_number}{o.first_item ? ` — ${o.first_item}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-carbon/70 uppercase tracking-wide">Message</label>
        <Textarea
          placeholder="Décrivez votre demande..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-white border-carbon/10 rounded-xl text-sm min-h-[100px] resize-none"
        />
      </div>

      {imageFile && (
        <div className="pt-1">
          <ImagePreview file={imageFile} onRemove={() => setImageFile(null)} />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <AttachButton onFileSelected={handleFileSelected} disabled={sending} />
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-carbon/50">
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={(!message.trim() && !imageFile) || sending}
          className="rounded-xl bg-mineral hover:bg-mineral/90 text-white gap-1.5 px-5"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Envoyer
        </Button>
      </div>
    </motion.div>
  );
};

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
          Envoyez un premier message en cliquant sur le bouton ci-dessus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const isDirect = conv.order_id === 'direct';
        const preview = (conv.last_message || '').length > 60
          ? (conv.last_message || '').substring(0, 60) + '…'
          : (conv.last_message || '');
        const isPending = conv.last_sender_type === 'client';
        return (
          <motion.button
            key={conv.order_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(conv)}
            className="w-full text-left p-5 bg-white shadow-sm hover:shadow-lg rounded-2xl border border-gray-100 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {isDirect ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm font-semibold">
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Message général
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-700 text-white text-sm font-mono font-bold">
                      {conv.order_number}
                    </span>
                  )}
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    isPending
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  )}>
                    {isPending ? 'En attente' : 'Répondu'}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{preview || 'Nouvelle conversation'}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(conv.last_message_at), { locale: fr, addSuffix: true })}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-700 transition-colors" />
              </div>
            </div>
          </motion.button>
        );
      })}
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
  const { profile } = useProfile();
  const { messages, isLoading } = useOrderMessages(orderId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAdminReplyHint, setShowAdminReplyHint] = useState(false);
  const lastAdminMsgIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId !== 'direct') markAsRead.mutate(orderId);
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect new admin reply → show hint for 3s
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastAdmin = [...messages].reverse().find((m) => m.sender_type === 'admin');
    if (!lastAdmin) return;
    if (lastAdminMsgIdRef.current === null) {
      // initial mount — don't trigger
      lastAdminMsgIdRef.current = lastAdmin.id;
      return;
    }
    if (lastAdmin.id !== lastAdminMsgIdRef.current) {
      lastAdminMsgIdRef.current = lastAdmin.id;
      setShowAdminReplyHint(true);
      const t = setTimeout(() => setShowAdminReplyHint(false), 3000);
      return () => clearTimeout(t);
    }
  }, [messages]);

  const handleFileSelected = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }
    setImageFile(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || !user?.id) return;
    const text = input.trim();
    setInput('');
    setUploading(true);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadMessageImage(imageFile, user.id);
        setImageFile(null);
      }

      // Persist welcome message before first client message
      if (messages.length === 0 && orderId !== 'direct' && orderNumber) {
        try {
          await supabase.functions.invoke('create-welcome-message', {
            body: { orderId, orderNumber, userId: user.id },
          });
        } catch (err) {
          console.warn('Welcome message skipped:', err);
        }
      }

      await sendMessage.mutateAsync({
        orderId: orderId === 'direct' ? null : orderId,
        message: text || '📷 Image',
        senderType: 'client',
        userId: user.id,
        imageUrl,
      });

      const convId = orderId !== 'direct' ? orderId : user.id;
      const customerName = profile?.display_name || user.email || 'Client';
      try {
        await Promise.all([
          supabase.functions.invoke('send-message-notification', {
            body: {
              recipient: 'admin',
              customerEmail: user.email,
              customerName,
              orderNumber: orderId !== 'direct' ? orderNumber : undefined,
              messageText: text || '📷 Image',
              conversationId: convId,
              imageUrl,
            },
          }),
          supabase.functions.invoke('send-message-notification', {
            body: {
              recipient: 'client-ack',
              customerEmail: user.email,
              customerName,
              orderNumber: orderId !== 'direct' ? orderNumber : undefined,
              messageText: text || '📷 Image',
              conversationId: convId,
              imageUrl,
            },
          }),
        ]);
      } catch (e) {
        console.error('Failed to send notifications:', e);
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
      setInput(text);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-4 border-b border-carbon/10 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-mineral/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="font-display text-sm tracking-wide text-carbon">
            {orderId === 'direct' ? 'MESSAGE GÉNÉRAL' : 'COMMANDE'}
          </h3>
          <span className="font-mono text-mineral text-sm font-bold">{orderNumber}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-mineral" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#4A7C59]/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#4A7C59]" />
            </div>
            <h3 className="font-display text-lg text-carbon tracking-wide mb-2">Démarrez la discussion</h3>
            <p className="text-sm text-carbon/55 max-w-xs mb-3">
              Décrivez votre problème ou envoyez une photo. On répond sous 24 h.
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-carbon/5 text-carbon/60 text-[11px] font-medium">
              🔒 Conversation privée
            </span>
            {orderId !== 'direct' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-6 flex justify-start"
              >
                <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/80 border border-carbon/10 text-carbon">
                  <p className="text-sm whitespace-pre-wrap">
                    Bonjour ! 👋 Je suis là pour vous aider avec votre commande <span className="font-mono font-bold">{orderNumber}</span>. Décrivez-moi votre problème, envoyez une photo si besoin — je vous réponds dans les plus brefs délais.
                  </p>
                  <p className="text-[10px] mt-1 text-carbon/40">Support · à l'instant</p>
                </div>
              </motion.div>
            )}
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
                  {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                  {msg.image_url && <MessageImage url={msg.image_url} />}
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

      <AnimatePresence>
        {showAdminReplyHint && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="shrink-0 pb-2 flex justify-start"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mineral/15 text-mineral text-[11px] font-medium">
              💬 Le support vient de répondre
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 pt-3 border-t border-carbon/10">
        {imageFile && (
          <div className="mb-2">
            <ImagePreview file={imageFile} onRemove={() => setImageFile(null)} />
          </div>
        )}
        <div className="flex items-end gap-2">
          <AttachButton onFileSelected={handleFileSelected} disabled={uploading || sendMessage.isPending} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex : Mon frein avant grince depuis hier, voici une photo..."
            rows={1}
            className="flex-1 resize-none bg-white/60 border border-carbon/10 rounded-xl px-4 py-3 text-sm text-carbon placeholder:text-carbon/30 focus:outline-none focus:border-mineral/40 min-h-[44px] max-h-[120px]"
          />
          <Button
            size="icon"
            disabled={(!input.trim() && !imageFile) || sendMessage.isPending || uploading}
            onClick={handleSend}
            className="w-11 h-11 rounded-xl bg-mineral hover:bg-mineral/90 text-white shrink-0"
          >
            {(sendMessage.isPending || uploading) ? (
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
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open conversation from deep link (?orderId=...&orderNumber=...)
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');
    if (!orderId || !orderNumber) return;
    if (isLoading) return;

    const existing = conversations.find((c) => c.order_id === orderId);
    if (existing) {
      setSelectedConv(existing);
    } else {
      setSelectedConv({
        order_id: orderId,
        order_number: orderNumber,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      } as ConversationSummary);
    }
    // Clean URL while keeping the messages tab active
    setSearchParams({ tab: 'messages' }, { replace: true });
  }, [searchParams, conversations, isLoading, setSearchParams]);

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
              <Button
                onClick={() => setShowNewMessage(!showNewMessage)}
                className="rounded-xl bg-mineral hover:bg-mineral/90 text-white gap-1.5 text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau message
              </Button>
            </div>
            <AnimatePresence>
              {showNewMessage && (
                <NewMessageForm onClose={() => setShowNewMessage(false)} />
              )}
            </AnimatePresence>
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