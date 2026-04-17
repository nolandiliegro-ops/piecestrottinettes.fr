import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2, Send, MessageSquare, Package, ArrowLeft, User, Paperclip, X, ExternalLink, Lock } from 'lucide-react';
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

type ConvStatus = 'pending' | 'replied' | 'closed';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  replied: boolean;
  status: ConvStatus;
  matched_user_id: string | null;
  last_reply_at: string | null;
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
  order_id: string | null;
  order_number: string | null;
  display_name: string;
  email: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  status: ConvStatus;
}

const STATUS_PILL: Record<ConvStatus, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  replied: { label: 'Répondu', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  closed: { label: 'Fermé', cls: 'bg-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_60%)] border-[hsl(0_0%_25%)]' },
};

// ─── Contact Conversation View ───
const ContactConversationView = ({ contact, onBack, onRefresh }: { contact: ContactMessage; onBack: () => void; onRefresh: () => void }) => {
  const [replies, setReplies] = useState<OrderMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(contact.matched_user_id);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchReplies = async () => {
    setLoading(true);
    // Fetch replies linked to this contact thread
    const queries: Promise<any>[] = [
      supabase.from('order_messages').select('*').eq('contact_message_id', contact.id).order('created_at', { ascending: true })
    ];
    if (matchedUserId) {
      queries.push(
        supabase.from('order_messages').select('*').eq('user_id', matchedUserId).is('order_id', null).is('contact_message_id', null).order('created_at', { ascending: true })
      );
    }
    const results = await Promise.all(queries);
    const all: OrderMsg[] = [];
    for (const r of results) if (r.data) all.push(...(r.data as OrderMsg[]));
    // Dedup by id
    const seen = new Set<string>();
    const dedup = all.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
    dedup.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setReplies(dedup);
    setLoading(false);
  };

  useEffect(() => { fetchReplies(); }, [contact.id, matchedUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [replies]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image trop volumineuse (max 5MB)'); return; }
    setImageFile(file);
  };

  const matchUser = async (): Promise<string | null> => {
    if (matchedUserId) return matchedUserId;
    const { data } = await supabase
      .from('orders')
      .select('user_id')
      .eq('customer_email', contact.email)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle();
    return data?.user_id || null;
  };

  const handleSend = async () => {
    if (!replyText.trim() && !imageFile) return;
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploading(true);
        try {
          // Use contact.id as folder for guest, or matched user_id if available
          const folder = matchedUserId || contact.id;
          imageUrl = await uploadMessageImage(imageFile, folder);
        } finally {
          setUploading(false);
        }
      }
      const msgText = replyText.trim() || '📷 Image';
      const matched = await matchUser();
      if (matched && matched !== matchedUserId) setMatchedUserId(matched);

      const { error: insertErr } = await supabase.from('order_messages').insert({
        message: msgText,
        sender_type: 'admin',
        user_id: matched,
        order_id: null,
        image_url: imageUrl,
        contact_message_id: contact.id,
      } as any);
      if (insertErr) throw insertErr;

      const { error: updErr } = await supabase
        .from('contact_messages')
        .update({
          status: 'replied',
          replied: true,
          matched_user_id: matched,
          last_reply_at: new Date().toISOString(),
        } as any)
        .eq('id', contact.id);
      if (updErr) console.warn(updErr);

      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            recipient: 'client',
            customerEmail: contact.email,
            customerName: contact.name,
            messageText: msgText,
            conversationId: contact.id,
            imageUrl: imageUrl || undefined,
          },
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }

      toast.success('Réponse envoyée au client');
      setReplyText('');
      setImageFile(null);
      if (inputRef.current) inputRef.current.value = '';
      fetchReplies();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'closed', replied: true } as any)
        .eq('id', contact.id);
      if (error) throw error;
      toast.success('Conversation fermée');
      onRefresh();
      onBack();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setClosing(false);
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const initials = contact.name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[hsl(0_0%_18%)] shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)] shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_70%)] border border-[hsl(0_0%_20%)] text-[11px] font-semibold">
              📨 Contact
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_PILL[contact.status].cls}`}>
              {STATUS_PILL[contact.status].label}
            </span>
            {matchedUserId && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold">
                ✓ Compte client lié
              </span>
            )}
          </div>
          <p className="text-xs text-[hsl(0_0%_60%)] truncate">
            <span className="font-medium text-[hsl(0_0%_85%)]">{contact.name}</span>
            <span className="text-[hsl(0_0%_50%)]"> · {contact.email}</span>
          </p>
        </div>
        {contact.status !== 'closed' && (
          <Button
            variant="outline"
            size="sm"
            disabled={closing}
            onClick={handleClose}
            className="gap-1.5 border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)] shrink-0"
          >
            {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Fermer
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-hide">
        {/* Initial contact message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-xl px-3.5 py-2.5 bg-[hsl(0_0%_100%/0.08)] text-[hsl(0_0%_80%)] rounded-bl-sm">
            <p className="text-[11px] uppercase tracking-wider text-[hsl(0_0%_55%)] font-semibold mb-1">{contact.subject}</p>
            <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
            <p className="text-[10px] mt-1 text-[hsl(0_0%_45%)]">👤 {contact.name} · {formatTime(contact.created_at)}</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          replies.map(msg => {
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button size="sm" disabled={(!replyText.trim() && !imageFile) || sending || uploading} onClick={handleSend} className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0">
            {sending || uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Contact Tab ───
const ContactTab = ({ messages, onRefresh }: { messages: ContactMessage[]; onRefresh: () => void }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ConvStatus>('all');
  const [replyCounts, setReplyCounts] = useState<Map<string, number>>(new Map());

  // Fetch reply counts per contact
  useEffect(() => {
    if (messages.length === 0) return;
    (async () => {
      const ids = messages.map(m => m.id);
      const { data } = await supabase
        .from('order_messages')
        .select('contact_message_id')
        .in('contact_message_id', ids);
      const map = new Map<string, number>();
      for (const r of (data || [])) {
        const k = (r as any).contact_message_id as string;
        map.set(k, (map.get(k) || 0) + 1);
      }
      setReplyCounts(map);
    })();
  }, [messages]);

  const counts = useMemo(() => ({
    all: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    replied: messages.filter(m => m.status === 'replied').length,
    closed: messages.filter(m => m.status === 'closed').length,
  }), [messages]);

  const sorted = useMemo(() => {
    const statusOrder: Record<ConvStatus, number> = { pending: 0, replied: 1, closed: 2 };
    return [...messages].sort((a, b) => {
      const so = statusOrder[a.status] - statusOrder[b.status];
      if (so !== 0) return so;
      const ad = new Date(a.last_reply_at || a.created_at).getTime();
      const bd = new Date(b.last_reply_at || b.created_at).getTime();
      return bd - ad;
    });
  }, [messages]);

  const filtered = useMemo(
    () => filter === 'all' ? sorted : sorted.filter(m => m.status === filter),
    [sorted, filter]
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const selected = selectedId ? messages.find(m => m.id === selectedId) : null;
  if (selected) {
    return <ContactConversationView contact={selected} onBack={() => { setSelectedId(null); onRefresh(); }} onRefresh={onRefresh} />;
  }

  const FilterBtn = ({ value, label, count }: { value: 'all' | ConvStatus; label: string; count: number }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        filter === value
          ? 'bg-primary/20 text-primary border-primary/40'
          : 'bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_65%)] hover:text-[hsl(0_0%_90%)]'
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <FilterBtn value="all" label="Tous" count={counts.all} />
        <FilterBtn value="pending" label="En attente" count={counts.pending} />
        <FilterBtn value="replied" label="Répondus" count={counts.replied} />
        <FilterBtn value="closed" label="Fermés" count={counts.closed} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucun message.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => {
            const initials = msg.name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
            const replyCount = replyCounts.get(msg.id) || 0;
            return (
              <div
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">{msg.name}</span>
                    <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                    <span className="text-xs text-[hsl(0_0%_55%)] truncate">{msg.email}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_PILL[msg.status].cls}`}>
                      {STATUS_PILL[msg.status].label}
                    </span>
                    {replyCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-semibold">
                        {replyCount} réponse{replyCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(0_0%_70%)] truncate font-medium">{msg.subject}</p>
                  <p className="text-xs text-[hsl(0_0%_55%)] truncate">{msg.message.substring(0, 80)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-[hsl(0_0%_45%)]">{formatDate(msg.last_reply_at || msg.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const markClientMessagesRead = async () => {
    let q = supabase
      .from('order_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', thread.user_id)
      .eq('sender_type', 'client')
      .is('read_at', null);
    if (thread.order_id) q = q.eq('order_id', thread.order_id);
    else q = q.is('order_id', null);
    await q;
  };

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

    // Mark client messages as read on open
    const hasUnread = (data || []).some(m => m.sender_type === 'client' && !m.read_at);
    if (hasUnread) markClientMessagesRead();
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

  const handleClose = async () => {
    setClosing(true);
    try {
      const payload = {
        user_id: thread.user_id,
        order_id: thread.order_id,
        status: 'closed' as const,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('conversation_status')
        .upsert(payload, { onConflict: 'user_id,order_id' });
      if (error) throw error;
      toast.success('Conversation fermée');
      onBack();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la fermeture');
    } finally {
      setClosing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error('Image trop volumineuse (max 5MB)'); return; }
    setImageFile(file);
  };

  const formatTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

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
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_PILL[thread.status].cls}`}>
              {STATUS_PILL[thread.status].label}
            </span>
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
        {thread.status !== 'closed' && (
          <Button
            variant="outline"
            size="sm"
            disabled={closing}
            onClick={handleClose}
            className="gap-1.5 border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:text-[hsl(0_0%_90%)] shrink-0"
          >
            {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Fermer
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
  const [filter, setFilter] = useState<'all' | ConvStatus>('all');

  const fetchThreads = async () => {
    setLoading(true);

    const { data: clientMsgs, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('sender_type', 'client')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    if (!clientMsgs || clientMsgs.length === 0) { setThreads([]); setLoading(false); return; }

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

    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || '']));

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

    // Fetch conversation statuses
    const { data: statuses } = await supabase
      .from('conversation_status')
      .select('user_id, order_id, status')
      .in('user_id', userIds);
    const statusMap = new Map<string, ConvStatus>();
    for (const s of (statuses || [])) {
      const key = `${s.user_id}__${s.order_id || 'general'}`;
      statusMap.set(key, s.status as ConvStatus);
    }

    const result: ClientThread[] = threadKeys.map(key => {
      const [uid, oid] = key.split('__');
      const msgs = grouped.get(key)!;
      const userInfo = userInfoMap.get(uid);
      const profileName = profileMap.get(uid);
      const displayName = userInfo?.name || profileName || 'Client';
      const email = userInfo?.email || '';
      const isGeneral = oid === 'general';
      const status = statusMap.get(key) || 'pending';

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
        status,
      };
    });

    // Sort: pending first, then by date desc
    const statusOrder: Record<ConvStatus, number> = { pending: 0, replied: 1, closed: 2 };
    result.sort((a, b) => {
      const so = statusOrder[a.status] - statusOrder[b.status];
      if (so !== 0) return so;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
    setThreads(result);
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, []);

  const counts = useMemo(() => ({
    all: threads.length,
    pending: threads.filter(t => t.status === 'pending').length,
    replied: threads.filter(t => t.status === 'replied').length,
    closed: threads.filter(t => t.status === 'closed').length,
  }), [threads]);

  const filteredThreads = useMemo(
    () => filter === 'all' ? threads : threads.filter(t => t.status === filter),
    [threads, filter]
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (selectedThread) {
    return <GarageConversationView thread={selectedThread} onBack={() => { setSelectedThread(null); fetchThreads(); }} />;
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const FilterBtn = ({ value, label, count, color }: { value: 'all' | ConvStatus; label: string; count: number; color?: string }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        filter === value
          ? 'bg-primary/20 text-primary border-primary/40'
          : `bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_65%)] hover:text-[hsl(0_0%_90%)] ${color || ''}`
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <FilterBtn value="all" label="Tous" count={counts.all} />
        <FilterBtn value="pending" label="En attente" count={counts.pending} />
        <FilterBtn value="replied" label="Répondus" count={counts.replied} />
        <FilterBtn value="closed" label="Fermés" count={counts.closed} />
      </div>

      {filteredThreads.length === 0 ? (
        <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucune conversation.</div>
      ) : (
        <div className="space-y-2">
          {filteredThreads.map(t => (
            <div
              key={`${t.user_id}-${t.order_id || 'general'}`}
              onClick={() => setSelectedThread(t)}
              className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                {t.order_id ? <Package className="w-4 h-4 text-primary" /> : <MessageSquare className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">{t.display_name}</span>
                  <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                  <span className="text-xs text-primary/80 font-mono">
                    {t.order_number || 'Question générale'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_PILL[t.status].cls}`}>
                    {STATUS_PILL[t.status].label}
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
      )}
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
