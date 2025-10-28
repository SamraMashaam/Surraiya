import FocusSession from "../models/FocusSession.js";

// CREATE FocusSession
export const createFocusSession = async (req, res) => {
  try {
    const session = new FocusSession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ all sessions
export const getSessions = async (req, res) => {
  try {
    const sessions = await FocusSession.find();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ sessions for a specific user
export const getSessionsByUser = async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.params.userId });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE FocusSession
// UPDATE FocusSession
export const updateSession = async (req, res) => {
  try {
    const updated = await FocusSession.findOneAndUpdate(
      { sessionId: req.params.id },
      { $set: req.body },
      { new: true, upsert: false } // don't auto-create
    );

    if (!updated) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE FocusSession
export const deleteSession = async (req, res) => {
  try {
    const deleted = await FocusSession.findOneAndDelete({
      sessionId: req.params.id,
    });
    if (!deleted)
      return res.status(404).json({ message: "Session not found" });
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
