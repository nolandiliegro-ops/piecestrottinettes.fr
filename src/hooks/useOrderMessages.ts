import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OrderMessage {
  id: string;
  order_id: string | null;
  user_id: string | null;
  sender_type: 'client' | 'admin';
  message: string;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ConversationSummary {
  order_id: string;
  order_number: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Fetch messages for a specific order (or direct messages when orderId is 'direct')
export const useOrderMessages = (orderId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      if (orderId === 'direct') {
        const { data, error } = await supabase
          .from('order_messages')
          .select('*')
          .is('order_id', null)
          .eq('user_id', user?.id || '')
          .order('created_at', { ascending: true });
        if (error) throw error;
        return (data || []).map(m => ({ ...m, sender_type: m.sender_type as 'client' | 'admin' })) as OrderMessage[];
      }
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(m => ({ ...m, sender_type: m.sender_type as 'client' | 'admin' })) as OrderMessage[];
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;
    const filter = orderId === 'direct' ? undefined : `order_id=eq.${orderId}`;
    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        ...(filter ? { filter } : {}),
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
        queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
        queryClient.invalidateQueries({ queryKey: ['order-conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient]);

  return { messages, isLoading };
};

// Send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, message, senderType, userId, imageUrl }: {
      orderId: string | null; message: string; senderType: 'client' | 'admin'; userId?: string; imageUrl?: string;
    }) => {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId || null,
          message,
          sender_type: senderType,
          user_id: userId || null,
          image_url: imageUrl || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-messages', variables.orderId || 'direct'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      queryClient.invalidateQueries({ queryKey: ['order-conversations'] });
    },
  });
};

// Mark admin messages as read for a specific order
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      if (orderId === 'direct') return;
      const { error } = await supabase
        .from('order_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .eq('sender_type', 'admin')
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      queryClient.invalidateQueries({ queryKey: ['order-conversations'] });
    },
  });
};

// Count total unread messages for the current user
export const useUnreadMessagesCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('order_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'admin')
        .is('read_at', null);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('unread-messages-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_messages',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  return count;
};

// Fetch all conversations (grouped by order) for the current user
export const useOrderConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['order-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('user_id', user.id);
      if (ordersError) throw ordersError;

      const orderIds = (orders || []).map(o => o.id);

      // Fetch order-linked messages
      let orderMessages: OrderMessage[] = [];
      if (orderIds.length > 0) {
        const { data, error } = await supabase
          .from('order_messages')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        orderMessages = (data || []) as unknown as OrderMessage[];
      }

      // Fetch direct messages (order_id IS NULL)
      const { data: directMsgs, error: directError } = await supabase
        .from('order_messages')
        .select('*')
        .is('order_id', null)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (directError) throw directError;

      const conversations: ConversationSummary[] = [];

      // Group order messages
      if (orders && orders.length > 0) {
        for (const order of orders) {
          const msgs = orderMessages.filter(m => m.order_id === order.id);
          if (msgs.length > 0) {
            const unread = msgs.filter(m => m.sender_type === 'admin' && !m.read_at).length;
            conversations.push({
              order_id: order.id,
              order_number: order.order_number,
              last_message: msgs[0].message,
              last_message_at: msgs[0].created_at,
              unread_count: unread,
            });
          }
        }
      }

      // Add direct messages as a single conversation
      if (directMsgs && directMsgs.length > 0) {
        const unread = directMsgs.filter((m: any) => m.sender_type === 'admin' && !m.read_at).length;
        conversations.push({
          order_id: 'direct',
          order_number: 'Message général',
          last_message: directMsgs[0].message,
          last_message_at: directMsgs[0].created_at,
          unread_count: unread,
        });
      }

      return conversations.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
    enabled: !!user?.id,
  });
};
