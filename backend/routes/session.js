const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

// Get session status
router.get("/:userId", async (req, res) => {
  try {
    let session = await Session.findOne({ userId: req.params.userId });
    if (!session) {
      session = new Session({ 
        userId: req.params.userId, 
        isActive: false,
        inactivityThreshold: 5 
      });
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start session
router.post("/:userId/start", async (req, res) => {
  try {
    let session = await Session.findOne({ userId: req.params.userId });
    if (!session) {
      session = new Session({ userId: req.params.userId });
    }
    
    session.isActive = true;
    session.startedAt = new Date();
    session.lastActivityAt = new Date();
    await session.save();
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop session
router.post("/:userId/stop", async (req, res) => {
  try {
    let session = await Session.findOne({ userId: req.params.userId });
    if (session) {
      session.isActive = false;
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update inactivity threshold
router.put("/:userId/threshold", async (req, res) => {
  try {
    let session = await Session.findOne({ userId: req.params.userId });
    if (!session) {
      session = new Session({ userId: req.params.userId });
    }
    
    session.inactivityThreshold = req.body.threshold;
    await session.save();
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;