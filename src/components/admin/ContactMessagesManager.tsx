import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2, Send, MessageSquare, Package, ArrowLeft, User, Paperclip, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadMessageImage = async (file: File, userId: string): Promise<string> => {
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Image trop volumineuse (max 5MB)');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `admin/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('order-messages-images').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('order-messages-images').getPublicUrl(path);
  return data.publicUrl;
};

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  replied: boolean;
}

interface OrderMsg {
  id: string;
  order_id: string | null;
  user_id: string | null;
  sender_type: string;
  message: string;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
}

interface ClientThread {
  user_id: string;
  order_id: string | null; // null = general question, string = order-specific
  order_number: string | null;
  display_name: string;
  email: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
}

// ─── Contact Tab ───
const ContactTab = ({ messages, onRefresh }: { messages: ContactMessage[]; onRefresh: () => void }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleReplied = async (id: string, current: boolean) => {
    const { error } = await supabase.from('contact_messages').update({ replied: !current }).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    onRefresh();
    toast.success(!current ? 'Marqué comme répondu' : 'Marqué comme non répondu');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (messages.length === 0) return <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucun message de contact.</div>;

  return (
    <div className="space-y-2">
      {messages.map(msg => (
        <div key={msg.id} className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors" onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">{msg.name}</span>
                <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                <span className="text-xs text-[hsl(0_0%_55%)] truncate">{msg.email}</span>
              </div>
              <span className="text-sm text-[hsl(0_0%_70%)] truncate">{msg.subject}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[hsl(0_0%_45%)]">{formatDate(msg.created_at)}</span>
              <Badge variant={msg.replied ? 'default' : 'secondary'} className={msg.replied ? 'bg-primary/20 text-primary border-primary/30 text-xs' : 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs'}>
                {msg.replied ? 'Répondu' : 'En attente'}
              </Badge>
            </div>
          </div>
          {expandedId === msg.id && (
            <div className="px-4 pb-4 border-t border-[hsl(0_0%_18%)]">
              <div className="pt-3 mb-3">
                <p className="text-sm text-[hsl(0_0%_75%)] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
              <div className="flex gap-2">
                <a href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}&body=${encodeURIComponent(`Bonjour ${msg.name},\n\n`)}`} onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90"><Mail className="w-3.5 h-3.5" /> Répondre</Button>
                </a>
                <Button size="sm" variant="outline" className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]" onClick={(e) => { e.stopPropagation(); toggleReplied(msg.id, msg.replied); }}>
                  {msg.replied ? <><Circle className="w-3.5 h-3.5" /> Non répondu</> : <><CheckCircle className="w-3.5 h-3.5" /> Marquer répondu</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Garage Conversation View ───
const GarageConversationView = ({ thread, onBack }: { thread: ClientThread; onBack: () => void }) => {
  const [messages, setMessages] = useState<OrderMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    let query = supabase
      .from('order_messages')
      .select('*')
      .eq('user_id', thread.user_id);
    
    if (thread.order_id) {
      query = query.eq('order_id', thread.order_id);
    } else {
      query = query.is('order_id', null);
    }
    
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) { console.error(error); setLoading(false); return; }
    setMessages((data || []) as OrderMsg[]);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [thread.user_id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`admin-thread-${thread.user_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages' }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [thread.user_id]);

  const handleReply = async () => {
    if (!replyText.trim() && !imageFile) return;
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadMessageImage(imageFile, thread.user_id);
        } finally {
          setUploading(false);
        }
      }
      const msgText = replyText.trim() || '📷 Image';
      const { error } = await supabase.from('order_messages').insert({
        message: msgText,
        sender_type: 'admin',
        user_id: thread.user_id,
        order_id: thread.order_id || null,
        image_url: imageUrl,
      });
      if (error) throw error;

      // Send email notification to client
      if (thread.email) {
        try {
           await supabase.functions.invoke('send-message-notification', {
              body: {
                recipient: 'client',
                customerEmail: thread.email,
                customerName: thread.display_name,
                orderNumber: thread.order_number || undefined,
                messageText: msgText,
                conversationId: thread.order_id || thread.user_id,
              },
            });
        } catch (e) {
          console.error('Email notification failed:', e);
        }
      }

      toast.success('Réponse envoyée');
      setReplyText('');
      setImageFile(null);
      if (inputRef.current) inputRef.current.value = '';
      fetchMessages();
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image trop volumineuse (max 5MB)'); return; }
    setImageFile(file);
  };

  const formatTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[hsl(0_0%_18%)] shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)] shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {thread.order_number ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
                📦 {thread.order_number}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_70%)] border border-[hsl(0_0%_20%)] text-[11px] font-semibold">
                💬 Question générale
              </span>
            )}
          </div>
          <p className="text-xs text-[hsl(0_0%_60%)] truncate">
            <span className="font-medium text-[hsl(0_0%_85%)]">{thread.display_name}</span>
            {thread.email ? <span className="text-[hsl(0_0%_50%)]"> · {thread.email}</span> : null}
          </p>
        </div>
        {thread.order_number && (
          <Button
            variant="outline"
            size="sm"
            title={`Voir la commande ${thread.order_number}`}
            onClick={() => navigate(`/admin?tab=orders&order=${thread.order_number}`)}
            className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir la commande
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-[hsl(0_0%_55%)] text-sm">Aucun message</div>
        ) : (
          messages.map(msg => {
            const isAdmin = msg.sender_type === 'admin';
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${isAdmin ? 'bg-primary/20 text-[hsl(0_0%_90%)] rounded-br-sm' : 'bg-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_80%)] rounded-bl-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img src={msg.image_url} alt="Image jointe" className="max-w-[240px] max-h-[180px] object-cover rounded-lg border border-[hsl(0_0%_20%)] hover:opacity-80 transition-opacity" />
                    </a>
                  )}
                  <p className={`text-[10px] mt-1 ${isAdmin ? 'text-primary/60' : 'text-[hsl(0_0%_45%)]'}`}>
                    {isAdmin ? '🟢 Vous' : '👤 Client'} · {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply */}
      <div className="shrink-0 pt-3 border-t border-[hsl(0_0%_18%)]">
        {imageFile && (
          <div className="mb-2 inline-flex items-center gap-2 bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] rounded-lg p-1.5 pr-2">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-12 h-12 object-cover rounded" />
            <span className="text-xs text-[hsl(0_0%_70%)] max-w-[140px] truncate">{imageFile.name}</span>
            <button onClick={() => { setImageFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_90%)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={sending || uploading} className="shrink-0 border-[hsl(0_0%_18%)] text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)] h-[60px]" title="Joindre une image">
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Répondre au client..."
            rows={2}
            className="flex-1 bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] rounded-lg px-3 py-2 text-sm text-[hsl(0_0%_85%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:border-primary/40 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
          />
          <Button size="sm" disabled={(!replyText.trim() && !imageFile) || sending || uploading} onClick={handleReply} className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0">
            {sending || uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Garage Tab ───
const GarageTab = () => {
  const [threads, setThreads] = useState<ClientThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ClientThread | null>(null);

  const fetchThreads = async () => {
    setLoading(true);

    // 1. Get all client messages
    const { data: clientMsgs, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('sender_type', 'client')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    if (!clientMsgs || clientMsgs.length === 0) { setThreads([]); setLoading(false); return; }

    // 2. Group by user_id + order_id (separate threads per order and general)
    const grouped = new Map<string, OrderMsg[]>();
    for (const m of clientMsgs) {
      if (!m.user_id) continue;
      const threadKey = `${m.user_id}__${m.order_id || 'general'}`;
      if (!grouped.has(threadKey)) grouped.set(threadKey, []);
      grouped.get(threadKey)!.push(m as OrderMsg);
    }

    const threadKeys = [...grouped.keys()];
    if (threadKeys.length === 0) { setThreads([]); setLoading(false); return; }

    const userIds = [...new Set(threadKeys.map(k => k.split('__')[0]))];
    const orderIds = [...new Set(
      threadKeys.map(k => k.split('__')[1]).filter(id => id !== 'general')
    )];

    // 3. Resolve names from profiles
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || '']));

    // 4. Resolve names/emails from orders + order numbers
    const { data: orders } = await supabase
      .from('orders')
      .select('id, user_id, order_number, customer_first_name, customer_last_name, customer_email')
      .in('user_id', userIds);
    const userInfoMap = new Map<string, { name: string; email: string }>();
    const orderNumberMap = new Map<string, string>();
    for (const o of (orders || [])) {
      if (o.user_id && !userInfoMap.has(o.user_id)) {
        userInfoMap.set(o.user_id, { name: `${o.customer_first_name} ${o.customer_last_name}`, email: o.customer_email });
      }
      orderNumberMap.set(o.id, o.order_number);
    }

    // 5. Build threads
    const result: ClientThread[] = threadKeys.map(key => {
      const [uid, oid] = key.split('__');
      const msgs = grouped.get(key)!;
      const userInfo = userInfoMap.get(uid);
      const profileName = profileMap.get(uid);
      const displayName = userInfo?.name || profileName || 'Client';
      const email = userInfo?.email || '';
      const isGeneral = oid === 'general';

      return {
        user_id: uid,
        order_id: isGeneral ? null : oid,
        order_number: isGeneral ? null : (orderNumberMap.get(oid) || null),
        display_name: displayName,
        email,
        last_message: msgs[0].message,
        last_message_at: msgs[0].created_at,
        message_count: msgs.length,
        unread_count: msgs.filter(m => !m.read_at).length,
      };
    });

    result.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setThreads(result);
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (selectedThread) {
    return <GarageConversationView thread={selectedThread} onBack={() => { setSelectedThread(null); fetchThreads(); }} />;
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (threads.length === 0) return <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucun message garage.</div>;

  return (
    <div className="space-y-2">
      {threads.map(t => (
        <div
          key={`${t.user_id}-${t.order_id || 'general'}`}
          onClick={() => setSelectedThread(t)}
          className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            {t.order_id ? <Package className="w-4 h-4 text-primary" /> : <MessageSquare className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">{t.display_name}</span>
              <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
              <span className="text-xs text-primary/80 font-mono">
                {t.order_number || 'Question générale'}
              </span>
            </div>
            <p className="text-xs text-[hsl(0_0%_60%)] truncate">{t.last_message.substring(0, 80)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-[hsl(0_0%_45%)]">{formatDate(t.last_message_at)}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[hsl(0_0%_50%)]">{t.message_count} msg</span>
              {t.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{t.unread_count}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───
const ContactMessagesManager = () => {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContactMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (!error) setContactMessages((data as ContactMessage[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchContactMessages(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[hsl(0_0%_95%)]">Messages</h2>
        <Button variant="outline" size="sm" onClick={fetchContactMessages} className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </Button>
      </div>

      <Tabs defaultValue="contact">
        <TabsList className="bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)]">
          <TabsTrigger value="contact" className="gap-1.5 data-[state=active]:bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_70%)]">
            <Mail className="w-3.5 h-3.5" /> Contact ({contactMessages.length})
          </TabsTrigger>
          <TabsTrigger value="garage" className="gap-1.5 data-[state=active]:bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_70%)]">
            <MessageSquare className="w-3.5 h-3.5" /> Garage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <ContactTab messages={contactMessages} onRefresh={fetchContactMessages} />
        </TabsContent>
        <TabsContent value="garage">
          <GarageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactMessagesManager;
