import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

const router = express.Router();

// ─── Get all conversations for a user ────────────────────────────────────────
router.get('/conversations/:userId', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.params.userId,
    })
      .populate('participants', 'userName email')
      .populate('lastMessage.sender', 'userName')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error('[Chat] get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ─── Get or create a DM conversation ─────────────────────────────────────────
router.post('/conversations/dm', async (req, res) => {
  try {
    const { userIdA, userIdB } = req.body;

    if (!userIdA || !userIdB) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }

    if (userIdA === userIdB) {
      return res.status(400).json({ error: 'Cannot create a DM with yourself' });
    }

    const existing = await Conversation.findOne({
      type: 'dm',
      participants: { $all: [userIdA, userIdB], $size: 2 },
    })
      .populate('participants', 'userName email')
      .populate('lastMessage.sender', 'userName');

    if (existing) return res.json(existing);

    const conversation = await Conversation.create({
      type: 'dm',
      participants: [userIdA, userIdB],
    });

    const populated = await conversation.populate('participants', 'userName email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('[Chat] create DM error:', err);
    res.status(500).json({ error: 'Failed to create DM' });
  }
});

// ─── Create a group chat ──────────────────────────────────────────────────────
router.post('/conversations/group', async (req, res) => {
  try {
    const { userName, participants, adminId } = req.body;

    if (!userName?.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: 'Group chat requires at least 2 participants' });
    }

    const allParticipants = [...new Set([adminId, ...participants])];

    const conversation = await Conversation.create({
      type: 'group',
      userName: userName.trim(),
      participants: allParticipants,
      admin: adminId,
    });

    const populated = await conversation.populate('participants', 'userName email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('[Chat] create group error:', err);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
});

// ─── Get messages for a conversation ─────────────────────────────────────────
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'userName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (err) {
    console.error('[Chat] get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ─── Search users ─────────────────────────────────────────────────────────────
router.get('/users/search', async (req, res) => {
  try {
    const { query, excludeId } = req.query;

    if (!query?.trim()) return res.json([]);

    const users = await User.find({
      _id: { $ne: excludeId },
      $or: [
        { userName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('userName email')
      .limit(10);

    res.json(users);
  } catch (err) {
    console.error('[Chat] search users error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;