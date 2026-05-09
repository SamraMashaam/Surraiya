import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import socket from '../socket';

const API_URL = process.env.REACT_APP_API_URL;

export function useChat({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]); // messages for active conversation
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: [{ userId, userName }] }
  const [unreadCounts, setUnreadCounts] = useState({}); // { conversationId: count }
  const [blockedConversations, setBlockedConversations] = useState({});

  const typingTimeoutRef = useRef({}); // debounce typing indicators
  const activeConversationRef = useRef(null); // stable ref for socket handlers

  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // ─── Initial load + socket setup ─────────────────────────────────────────────
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    socket.connect();
    fetchConversations();

    socket.on('chat-receive-message', ({ message, conversationId }) => {
      // If message is for the active conversation, append it
      if (activeConversationRef.current?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
        // Mark as read immediately since user is looking at it
        socket.emit('chat-mark-read', { conversationId, userId: user._id });
      } else {
        // Increment unread count for other conversations
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }

      // Update lastMessage preview in conversation list
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversationId);

        if (exists) {
          // Just update the lastMessage
          return prev
            .map((c) =>
              c._id === conversationId
                ? {
                    ...c,
                    lastMessage: {
                      content: message.content,
                      sender: message.sender,
                      createdAt: message.createdAt,
                    },
                  }
                : c
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Conversation was deleted by this user but a new message arrived
          // Re-fetch it from the API and add it back to the list
          axios.get(`${API_URL}/api/chat/conversations/${user._id}`)
            .then((res) => setConversations(res.data))
            .catch((err) => console.error('[useChat] refetch error:', err));
          return prev;
        }
      });
    });

    socket.on('chat-blocked', ({ conversationId, message }) => {
      setBlockedConversations((prev) => ({
        ...prev,
        [conversationId]: message,
      }));
    });

    socket.on('chat-conversation-restored', ({ conversationId, conversation }) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversationId);
        if (exists) {
          // Already in list — just update lastMessage
          return prev
            .map((c) => c._id === conversationId ? conversation : c)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Was deleted — restore it to the top of the list
          return [conversation, ...prev];
        }
      });

      // Increment unread count if it's not the active conversation
      if (activeConversationRef.current?._id !== conversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    });

    socket.on('chat-user-typing', ({ conversationId, userId, userName }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (current.find((u) => u.userId === userId)) return prev;
        return { ...prev, [conversationId]: [...current, { userId, userName }] };
      });
    });

    socket.on('chat-user-stop-typing', ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(
          (u) => u.userId !== userId
        ),
      }));
    });

    socket.on('chat-error', ({ error }) => {
      setError(error);
    });

    return () => {
      socket.off('chat-receive-message');
      socket.off('chat-user-typing');
      socket.off('chat-user-stop-typing');
      socket.off('chat-error');
      socket.off('chat-blocked');
      socket.off('chat-conversation-restored');
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ─── Fetch all conversations ──────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/api/chat/conversations/${userId}`);
        setConversations(res.data);
        socket.emit('chat-connect', {
        userId,
        conversationIds: res.data.map((c) => c._id),
        });
    } catch (err) {
        console.error('[useChat] fetch conversations error:', err);
        setError('Failed to load conversations');
    } finally {
        setLoading(false);
    }
    }, [user?._id, user?.id]);

  // ─── Select a conversation ────────────────────────────────────────────────────
  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessagesLoading(true);
    setMessages([]);

    // Clear unread count
    setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));

    try {
      const res = await axios.get(
        `${API_URL}/api/chat/messages/${conversation._id}`
      );
      setMessages(res.data);

      // Mark as read
      socket.emit('chat-mark-read', {
        conversationId: conversation._id,
        userId: user._id,
      });
    } catch (err) {
      console.error('[useChat] fetch messages error:', err);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [user?._id]);

  // ─── Send a message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback((content) => {
    if (!content?.trim() || !activeConversationRef.current) return;

    socket.emit('chat-send-message', {
      conversationId: activeConversationRef.current._id,
      senderId: user._id,
      content: content.trim(),
    });

    // Stop typing indicator when message is sent
    socket.emit('chat-stop-typing', {
      conversationId: activeConversationRef.current._id,
      userId: user._id,
    });
  }, [user?._id]);

  // ─── Typing indicator ─────────────────────────────────────────────────────────
  const sendTyping = useCallback(() => {
    const conversationId = activeConversationRef.current?._id;
    if (!conversationId) return;

    socket.emit('chat-typing', {
      conversationId,
      userId: user._id,
      userName: user.userName,
    });

    // Auto stop typing after 2 seconds of no keystrokes
    clearTimeout(typingTimeoutRef.current[conversationId]);
    typingTimeoutRef.current[conversationId] = setTimeout(() => {
      socket.emit('chat-stop-typing', {
        conversationId,
        userId: user._id,
      });
    }, 2000);
  }, [user?._id, user?.userName]);

  // ─── Start a new DM ───────────────────────────────────────────────────────────
  const startDM = useCallback(async (otherUserId) => {
    try {
      const res = await axios.post(`${API_URL}/api/chat/conversations/dm`, {
        userIdA: user._id,
        userIdB: otherUserId,
      });

      const conversation = res.data;

      // Add to list if not already there
      setConversations((prev) => {
        if (prev.find((c) => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });

      // Join the socket room for this conversation
      socket.emit('chat-join-conversation', { conversationId: conversation._id });

      // Open it
      selectConversation(conversation);
      return conversation;
    } catch (err) {
      console.error('[useChat] start DM error:', err);
      setError('Failed to start conversation');
    }
  }, [user?._id, selectConversation]);

  // ─── Create a group chat ──────────────────────────────────────────────────────
  const createGroup = useCallback(async ({ userName, participantIds }) => {
    try {
      const res = await axios.post(`${API_URL}/api/chat/conversations/group`, {
        userName,
        participants: participantIds,
        adminId: user._id,
      });

      const conversation = res.data;

      setConversations((prev) => [conversation, ...prev]);

      // Join the socket room
      socket.emit('chat-join-conversation', { conversationId: conversation._id });

      // Open it
      selectConversation(conversation);
      return conversation;
    } catch (err) {
      console.error('[useChat] create group error:', err);
      setError('Failed to create group chat');
    }
  }, [user?._id, selectConversation]);

  // ─── Search users ─────────────────────────────────────────────────────────────
  const searchUsers = useCallback(async (query) => {
    if (!query?.trim()) return [];
    if (!user?._id) {
        console.warn('[searchUsers] user not ready yet');
        return [];
    }
    try {
        const res = await axios.get(`${API_URL}/api/chat/users/search`, {
        params: { query, excludeId: user._id },
        });
        return res.data;
    } catch (err) {
        console.error('[useChat] search users error:', err);
        return [];
    }
    }, [user?._id]);

  // ─── Get conversation display name ────────────────────────────────────────────
  const getConversationName = useCallback((conversation) => {
    if (conversation.type === 'group') return conversation.name;
    // For DMs, show the other person's name
    const other = conversation.participants?.find((p) => p._id !== user._id);
    return other?.userName || 'Unknown User';
  }, [user?._id]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await axios.delete(`${API_URL}/api/chat/conversations/${conversationId}`, {
        data: { userId: user?._id || user?.id },
      });

      // Remove from conversations list
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));

      // Clear active conversation if it's the one being deleted
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('[useChat] delete conversation error:', err);
      setError('Failed to delete conversation');
    }
  }, [user?._id, user?.id]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    messagesLoading,
    error,
    typingUsers,
    unreadCounts,
    blockedConversations,
    selectConversation,
    sendMessage,
    sendTyping,
    startDM,
    createGroup,
    searchUsers,
    getConversationName,
    fetchConversations,
    deleteConversation, 
  };
}