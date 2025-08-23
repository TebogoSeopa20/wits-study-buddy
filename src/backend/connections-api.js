// backend/connections-api.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Get all connections for a user
router.get('/connections', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Get connections where user is either the requester or the recipient
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`userId.eq.${userId},participantId.eq.${userId}`);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new connection request
router.post('/connections', async (req, res) => {
  const { userId, participantId, status = 'pending' } = req.body;

  if (!userId || !participantId) {
    return res.status(400).json({ error: 'User ID and Participant ID are required' });
  }

  try {
    // Check if connection already exists
    const { data: existingConnections, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(userId.eq.${userId},participantId.eq.${participantId}),and(userId.eq.${participantId},participantId.eq.${userId})`);

    if (checkError) throw checkError;

    if (existingConnections && existingConnections.length > 0) {
      return res.status(409).json({ 
        error: 'Connection already exists',
        connection: existingConnections[0] 
      });
    }

    // Create new connection
    const { data, error } = await supabase
      .from('connections')
      .insert([
        {
          userId,
          participantId,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update connection status
router.put('/connections/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const { data, error } = await supabase
      .from('connections')
      .update({ 
        status, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a connection
router.delete('/connections/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Connection deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;