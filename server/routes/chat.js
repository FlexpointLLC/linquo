const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // Get messages for a session
  router.get('/sessions/:sessionId/messages', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await db.getMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Get active sessions (for agents)
  router.get('/sessions', authenticateToken, async (req, res) => {
    try {
      const sessions = await db.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // Create a new session
  router.post('/sessions', async (req, res) => {
    try {
      const { sessionId, customerName } = req.body;
      await db.createSession(sessionId, customerName);
      res.status(201).json({ success: true, sessionId });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  // Update session status
  router.patch('/sessions/:sessionId', authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      await db.updateSessionStatus(sessionId, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  });

  return router;
};