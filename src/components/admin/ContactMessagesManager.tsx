import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2, Send, MessageSquare, Package, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    // Get ALL messages for this user_id (both client & admin)
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .or(`user_id.eq.${thread.user_id}`)
      .order('created_at', { ascending: true });
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
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('order_messages').insert({
        message: replyText.trim(),
        sender_type: 'admin',
        user_id: thread.user_id,
        order_id: null,
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
              messageText: replyText.trim(),
              conversationId: thread.user_id,
            },
          });
        } catch (e) {
          console.error('Email notification failed:', e);
        }
      }

      toast.success('Réponse envoyée');
      setReplyText('');
      fetchMessages();
    } catch (e) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[hsl(0_0%_18%)] shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)]">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-[hsl(0_0%_90%)]">{thread.display_name}</p>
          <p className="text-xs text-[hsl(0_0%_55%)]">{thread.email}</p>
        </div>
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
        <div className="flex gap-2 items-end">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Répondre au client..."
            rows={2}
            className="flex-1 bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] rounded-lg px-3 py-2 text-sm text-[hsl(0_0%_85%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:border-primary/40 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
          />
          <Button size="sm" disabled={!replyText.trim() || sending} onClick={handleReply} className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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

    // 2. Group by user_id
    const grouped = new Map<string, OrderMsg[]>();
    for (const m of clientMsgs) {
      if (!m.user_id) continue;
      if (!grouped.has(m.user_id)) grouped.set(m.user_id, []);
      grouped.get(m.user_id)!.push(m as OrderMsg);
    }

    const userIds = [...grouped.keys()];
    if (userIds.length === 0) { setThreads([]); setLoading(false); return; }

    // 3. Resolve names from profiles
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || '']));

    // 4. Resolve names/emails from orders
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, customer_first_name, customer_last_name, customer_email')
      .in('user_id', userIds);
    const orderMap = new Map<string, { name: string; email: string }>();
    for (const o of (orders || [])) {
      if (o.user_id && !orderMap.has(o.user_id)) {
        orderMap.set(o.user_id, { name: `${o.customer_first_name} ${o.customer_last_name}`, email: o.customer_email });
      }
    }

    // 5. Count unread admin messages per user (messages from admin that client hasn't read)
    // For admin view, "unread" = client messages not yet handled. We count client msgs with no admin reply after them.
    // Simplification: just count total client messages

    // 6. Build threads
    const result: ClientThread[] = userIds.map(uid => {
      const msgs = grouped.get(uid)!;
      const orderInfo = orderMap.get(uid);
      const profileName = profileMap.get(uid);
      const displayName = orderInfo?.name || profileName || 'Client';
      const email = orderInfo?.email || '';

      return {
        user_id: uid,
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
          key={t.user_id}
          onClick={() => setSelectedThread(t)}
          className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">{t.display_name}</span>
              {t.email && (
                <>
                  <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                  <span className="text-xs text-[hsl(0_0%_55%)] truncate">{t.email}</span>
                </>
              )}
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
