import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2, Send, MessageSquare, Package } from 'lucide-react';
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

interface GarageMessage {
  id: string;
  order_id: string | null;
  user_id: string | null;
  sender_type: string;
  message: string;
  created_at: string;
  read_at: string | null;
  // joined
  order_number?: string;
  customer_email?: string;
  customer_name?: string;
}

const ContactMessagesManager = () => {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [garageMessages, setGarageMessages] = useState<GarageMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  const fetchContactMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching contact messages:', error);
    } else {
      setContactMessages((data as ContactMessage[]) || []);
    }
  };

  const fetchGarageMessages = async () => {
    // Get all client messages from order_messages
    const { data: msgs, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('sender_type', 'client')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching garage messages:', error);
      return;
    }
    if (!msgs || msgs.length === 0) {
      setGarageMessages([]);
      return;
    }

    // Get unique order_ids to fetch order info
    const orderIds = [...new Set(msgs.filter(m => m.order_id).map(m => m.order_id!))];
    let ordersMap: Record<string, { order_number: string; customer_email: string; customer_first_name: string }> = {};
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, customer_email, customer_first_name')
        .in('id', orderIds);
      if (orders) {
        for (const o of orders) {
          ordersMap[o.id] = { order_number: o.order_number, customer_email: o.customer_email, customer_first_name: o.customer_first_name };
        }
      }
    }

    setGarageMessages(msgs.map(m => ({
      ...m,
      sender_type: m.sender_type,
      order_number: m.order_id ? ordersMap[m.order_id]?.order_number : undefined,
      customer_email: m.order_id ? ordersMap[m.order_id]?.customer_email : undefined,
      customer_name: m.order_id ? ordersMap[m.order_id]?.customer_first_name : undefined,
    })));
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchContactMessages(), fetchGarageMessages()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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

  const handleGarageReply = async (msg: GarageMessage) => {
    const text = replyText[msg.id]?.trim();
    if (!text) return;
    setReplying(msg.id);
    try {
      // Insert admin reply
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: msg.order_id,
          message: text,
          sender_type: 'admin',
          user_id: null,
        });
      if (error) throw error;

      // Send email notification to client
      const recipientEmail = msg.customer_email || '';
      if (recipientEmail) {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            recipient: 'client',
            customerEmail: recipientEmail,
            customerName: msg.customer_name || 'Client',
            orderNumber: msg.order_number || undefined,
            messageText: text,
          },
        });
      }

      toast.success('Réponse envoyée');
      setReplyText(prev => ({ ...prev, [msg.id]: '' }));
      fetchGarageMessages();
    } catch (e) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setReplying(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[hsl(0_0%_95%)]">Messages</h2>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="contact">
        <TabsList className="bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)]">
          <TabsTrigger value="contact" className="gap-1.5 data-[state=active]:bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_70%)]">
            <Mail className="w-3.5 h-3.5" />
            Contact ({contactMessages.length})
          </TabsTrigger>
          <TabsTrigger value="garage" className="gap-1.5 data-[state=active]:bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_70%)]">
            <MessageSquare className="w-3.5 h-3.5" />
            Garage ({garageMessages.length})
          </TabsTrigger>
        </TabsList>

        {/* Contact Tab */}
        <TabsContent value="contact">
          {contactMessages.length === 0 ? (
            <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucun message de contact.</div>
          ) : (
            <div className="space-y-2">
              {contactMessages.map(msg => (
                <div key={msg.id} className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors"
                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  >
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
                      <Badge
                        variant={msg.replied ? 'default' : 'secondary'}
                        className={msg.replied
                          ? 'bg-primary/20 text-primary border-primary/30 text-xs'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs'}
                      >
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
                        <a
                          href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}&body=${encodeURIComponent(`Bonjour ${msg.name},\n\n`)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                            <Mail className="w-3.5 h-3.5" /> Répondre
                          </Button>
                        </a>
                        <Button
                          size="sm" variant="outline"
                          className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]"
                          onClick={(e) => { e.stopPropagation(); toggleReplied(msg.id, msg.replied); }}
                        >
                          {msg.replied
                            ? <><Circle className="w-3.5 h-3.5" /> Non répondu</>
                            : <><CheckCircle className="w-3.5 h-3.5" /> Marquer répondu</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Garage Tab */}
        <TabsContent value="garage">
          {garageMessages.length === 0 ? (
            <div className="text-center py-12 text-[hsl(0_0%_55%)]">Aucun message garage.</div>
          ) : (
            <div className="space-y-2">
              {garageMessages.map(msg => (
                <div key={msg.id} className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(0_0%_100%/0.05)] transition-colors"
                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-mineral/20 flex items-center justify-center shrink-0">
                      {msg.order_id ? <Package className="w-4 h-4 text-mineral" /> : <MessageSquare className="w-4 h-4 text-mineral" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-[hsl(0_0%_90%)] truncate">
                          {msg.customer_name || 'Client'}
                        </span>
                        {msg.customer_email && (
                          <>
                            <span className="text-xs text-[hsl(0_0%_45%)]">·</span>
                            <span className="text-xs text-[hsl(0_0%_55%)] truncate">{msg.customer_email}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {msg.order_number && (
                          <span className="text-xs font-mono text-mineral">{msg.order_number}</span>
                        )}
                        <span className="text-xs text-[hsl(0_0%_60%)] truncate">{msg.message.substring(0, 60)}...</span>
                      </div>
                    </div>
                    <span className="text-xs text-[hsl(0_0%_45%)] shrink-0">{formatDate(msg.created_at)}</span>
                  </div>
                  {expandedId === msg.id && (
                    <div className="px-4 pb-4 border-t border-[hsl(0_0%_18%)]">
                      <div className="pt-3 mb-3">
                        <p className="text-sm text-[hsl(0_0%_75%)] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                      <div className="flex gap-2 items-end">
                        <textarea
                          value={replyText[msg.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder="Répondre..."
                          rows={2}
                          className="flex-1 bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] rounded-lg px-3 py-2 text-sm text-[hsl(0_0%_85%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:border-primary/40 resize-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          disabled={!replyText[msg.id]?.trim() || replying === msg.id}
                          onClick={(e) => { e.stopPropagation(); handleGarageReply(msg); }}
                          className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0"
                        >
                          {replying === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Répondre
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactMessagesManager;
