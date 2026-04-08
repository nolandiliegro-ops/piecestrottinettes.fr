import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, Circle, RefreshCw, Loader2 } from 'lucide-react';
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

const ContactMessagesManager = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } else {
      setMessages((data as ContactMessage[]) || []);
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
      setMessages(prev => prev.map(m => m.id === id ? { ...m, replied: !current } : m));
      toast.success(!current ? 'Marqué comme répondu' : 'Marqué comme non répondu');
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
        <h2 className="text-lg font-semibold text-[hsl(0_0%_95%)]">
          Messages reçus ({messages.length})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-1.5 border-[hsl(0_0%_18%)] text-[hsl(0_0%_55%)]">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 text-[hsl(0_0%_55%)]">
          Aucun message reçu pour le moment.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_18%)] rounded-lg overflow-hidden"
            >
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(0_0%_70%)] truncate">{msg.subject}</span>
                  </div>
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
                    <p className="text-sm text-[hsl(0_0%_75%)] whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}&body=${encodeURIComponent(`Bonjour ${msg.name},\n\n`)}`}
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
                        toggleReplied(msg.id, msg.replied);
                      }}
                    >
                      {msg.replied
                        ? <><Circle className="w-3.5 h-3.5" /> Non répondu</>
                        : <><CheckCircle className="w-3.5 h-3.5" /> Marquer répondu</>
                      }
                    </Button>
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
