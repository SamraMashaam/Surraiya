import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

function initChatSocket(io) {
  io.on('connection', (socket) => {

    // ─── Join conversation rooms ──────────────────────────────────────────────
    // Called when a user opens the chat page — joins all their conversation
    // rooms so they receive messages in real time
    socket.on('chat-connect', ({ userId, conversationIds }) => {
      if (!userId || !conversationIds) return;

      socket.data.chatUserId = userId;

      conversationIds.forEach((id) => {
        socket.join(`chat:${id}`);
      });

      console.log(`[Chat] ${userId} joined ${conversationIds.length} conversation room(s)`);
    });

    // ─── Join a single new conversation room ─────────────────────────────────
    // Called when a user creates or opens a new conversation
    socket.on('chat-join-conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`chat:${conversationId}`);
      console.log(`[Chat] socket ${socket.id} joined chat:${conversationId}`);
    });

    // ─── Send a message ───────────────────────────────────────────────────────
    socket.on('chat-send-message', async ({ conversationId, senderId, content }) => {
      if (!conversationId || !senderId || !content?.trim()) return;

      try {
        // Save message to MongoDB
        const message = await Message.create({
          conversationId,
          sender: senderId,
          content: content.trim(),
          readBy: [senderId], // sender has already read their own message
        });

        // Populate sender info before broadcasting
        await message.populate('sender', 'userName email');

        // Update the conversation's lastMessage snapshot
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            content: message.content,
            sender: senderId,
            createdAt: message.createdAt,
          },
          updatedAt: new Date(), // bump updatedAt so it sorts to top of list
        });

        // Broadcast to everyone in the conversation room including sender
        io.to(`chat:${conversationId}`).emit('chat-receive-message', {
          message,
          conversationId,
        });

        console.log(`[Chat] message in ${conversationId} from ${senderId}`);
      } catch (err) {
        console.error('[Chat] send message error:', err);
        socket.emit('chat-error', { error: 'Failed to send message' });
      }
    });

    // ─── Mark messages as read ────────────────────────────────────────────────
    socket.on('chat-mark-read', async ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      try {
        // Mark all unread messages in this conversation as read by this user
        await Message.updateMany(
          {
            conversationId,
            readBy: { $ne: userId },
          },
          {
            $addToSet: { readBy: userId },
          }
        );

        // Notify others in the room that this user has read the messages
        socket.to(`chat:${conversationId}`).emit('chat-messages-read', {
          conversationId,
          userId,
        });
      } catch (err) {
        console.error('[Chat] mark read error:', err);
      }
    });

    // ─── Typing indicators ────────────────────────────────────────────────────
    socket.on('chat-typing', ({ conversationId, userId, userName }) => {
      if (!conversationId) return;
      socket.to(`chat:${conversationId}`).emit('chat-user-typing', {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on('chat-stop-typing', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(`chat:${conversationId}`).emit('chat-user-stop-typing', {
        conversationId,
        userId,
      });
    });

    // ─── Cleanup on disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Socket.IO automatically removes the socket from all rooms on disconnect
      // Nothing extra needed here — video disconnect is handled in videoSocket.js
    });
  });
}

export { initChatSocket };