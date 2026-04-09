import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  replied: boolean;
  source: 'contact';
}

interface OrderMessageItem {
  id: string;
  order_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  sender_type: 'client' | 'admin';
  message: string;
  created_at: string;
  read_at: string | null;
  source: 'order';
}

type UnifiedMessage = ContactMessage | OrderMessageItem;

const ContactMessagesManager = () => {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [orderMessages, setOrderMessages] = useState<OrderMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'contact' | 'orders'>('all');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);

    // Fetch contact messages
    const { data: contacts, error: contactErr } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (contactErr) {
      console.error('Error fetching contact messages:', contactErr);
    } else {
      setContactMessages((contacts || []).map(m => ({ ...m, source: 'contact' as const })));
    }

    // Fetch order messages (client messages only — admin sees what clients sent)
    const { data: orderMsgs, error: orderErr } = await supabase
      .from('order_messages')
      .select('*')
      .eq('sender_type', 'client')
      .order('created_at', { ascending: false });

    if (orderErr) {
      console.error('Error fetching order messages:', orderErr);
    } else {
      // Get unique order IDs to fetch order details
      const orderIds = [...new Set((orderMsgs || []).map(m => m.order_id))];
      
      let ordersMap: Record<string, { order_number: string; customer_email: string; customer_first_name: string; customer_last_name: string }> = {};
      
      if (orderIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, customer_email, customer_first_name, customer_last_name')
          .in('id', orderIds);
        
        if (orders) {
          ordersMap = Object.fromEntries(orders.map(o => [o.id, o]));
        }
      }

      setOrderMessages((orderMsgs || []).map(m => {
        const order = ordersMap[m.order_id];
        return {
          id: m.id,
          order_id: m.order_id,
          order_number: order?.order_number || 'N/A',
          customer_email: order?.customer_email || '',
          customer_name: order ? `${order.customer_first_name} ${order.customer_last_name}` : 'Client',
          sender_type: m.sender_type as 'client' | 'admin',
          message: m.message,
          created_at: m.created_at || '',
          read_at: m.read_at,
          source: 'order' as const,
        };
      }));
    }

    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const toggleReplied = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ replied: !current })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, replied: !current } : m));
      toast.success(!current ? 'Marqué comme répondu' : 'Marqué comme non répondu');
    }
  };

  const handleReplyToOrder = async (msg: OrderMessageItem) => {
    const text = replyText[msg.id]?.trim();
    if (!text) return;

    setSendingReply(msg.id);
    try {
      // Insert admin reply
      const { error: insertErr } = await supabase
        .from('order_messages')
        .insert({
          order_id: msg.order_id,
          message: text,
          sender_type: 'admin',
          user_id: null,
        });
      if (insertErr) throw insertErr;

      // Send email notification
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            customerEmail: msg.customer_email,
            customerName: msg.customer_name,
            orderNumber: msg.order_number,
            messageText: text,
          },
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr);
      }

      setReplyText(prev => ({ ...prev, [msg.id]: '' }));
      toast.success('Réponse envoyée');
      fetchMessages();
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingReply(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Build unified list
  const allMessages: UnifiedMessage[] = (() => {
    let list: UnifiedMessage[] = [];
    if (filter === 'all' || filter === 'contact') list = [...list, ...contactMessages];
    if (filter === 'all' || filter === 'orders') list = [...list, ...orderMessages];
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-[hsl(0_0%_95%)]">
          Messages ({allMessages.length})
        </h2>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg p-0.5">
            {(['all', 'contact', 'orders'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors",
                  filter === f
                    ? "bg-primary/20 text-primary"
                    : "text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_75%)]"
                )}
              >
                {f === 'all' ? 'Tous' : f === 'contact' ? 'Contact' : 'Commandes'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {allMessages.length === 0 ? (
        <div className="text-center py-12 text-[hsl(0_0%_55%)]">
          Aucun message reçu pour le moment.
        </div>
      ) : (
        <div className="space-y-2">
          {allMessages.map(msg => (
            <div
              key={msg.id}
              className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors"
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              >
                <div className="flex-shrink-0">
                  {msg.source === 'contact' ? (
                    <Mail className="w-4 h-4 text-[hsl(0_0%_45%)]" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">
                      {msg.source === 'contact' ? msg.name : (msg as OrderMessageItem).customer_name}
                    </span>
                    <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                    <span className="text-xs text-[hsl(0_0%_55%)] truncate">
                      {msg.source === 'contact' ? msg.email : (msg as OrderMessageItem).customer_email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(0_0%_70%)] truncate">
                      {msg.source === 'contact' ? (msg as ContactMessage).subject : `Commande ${(msg as OrderMessageItem).order_number}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[hsl(0_0%_45%)]">{formatDate(msg.created_at)}</span>
                  {msg.source === 'contact' ? (
                    <Badge
                      variant={(msg as ContactMessage).replied ? 'default' : 'secondary'}
                      className={(msg as ContactMessage).replied
                        ? 'bg-primary/20 text-primary border-primary/30 text-xs'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs'}
                    >
                      {(msg as ContactMessage).replied ? 'Répondu' : 'En attente'}
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      Commande
                    </Badge>
                  )}
                </div>
              </div>

              {expandedId === msg.id && (
                <div className="px-4 pb-4 border-t border-[hsl(0_0%_18%)]">
                  <div className="pt-3 mb-3">
                    <p className="text-sm text-[hsl(0_0%_75%)] whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {msg.source === 'contact' ? (
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${(msg as ContactMessage).email}?subject=${encodeURIComponent('Re: ' + (msg as ContactMessage).subject)}&body=${encodeURIComponent(`Bonjour ${(msg as ContactMessage).name},\n\n`)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                            <Mail className="w-3.5 h-3.5" />
                            Répondre
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReplied((msg as ContactMessage).id, (msg as ContactMessage).replied);
                          }}
                        >
                          {(msg as ContactMessage).replied
                            ? <><Circle className="w-3.5 h-3.5" /> Non répondu</>
                            : <><CheckCircle className="w-3.5 h-3.5" /> Marquer répondu</>
                          }
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="Répondre au client..."
                          value={replyText[msg.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReplyToOrder(msg as OrderMessageItem);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] rounded-lg text-sm text-[hsl(0_0%_90%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:border-primary/50"
                        />
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary hover:bg-primary/90"
                          disabled={!replyText[msg.id]?.trim() || sendingReply === msg.id}
                          onClick={() => handleReplyToOrder(msg as OrderMessageItem)}
                        >
                          {sendingReply === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessagesManager;
