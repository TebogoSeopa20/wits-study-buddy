// backend/connections-api.js
// connections-api.js - Updated for status support
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

// Get all connections for a user with optional status filter
router.get('/connections/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { status } = req.query; // Optional status filter

  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) {
      // If no connections exist yet, return empty array
      if (error.code === 'PGRST116') {
        return res.status(200).json({ connected_users: [] });
      }
      throw error;
    }

    let connections = data.connected_users || [];
    
    // Filter by status if provided
    if (status) {
      connections = connections.filter(conn => conn.status === status);
    }

    res.status(200).json({
      ...data,
      connected_users: connections
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connections with full profile details
router.get('/connections/:user_id/details', async (req, res) => {
  const { user_id } = req.params;
  const { status } = req.query; // Optional status filter

  try {
    // Use the SQL function we created
    const { data, error } = await supabase
      .rpc('get_user_connections_with_details', {
        target_user_id: user_id,
        filter_status: status || null
      });

    if (error) throw error;

    res.status(200).json({ connections: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a connection request
router.post('/connections/:user_id/send-request', async (req, res) => {
  const { user_id } = req.params;
  const { target_user_id } = req.body;

  if (!target_user_id) {
    return res.status(400).json({ error: 'target_user_id is required' });
  }

  if (user_id === target_user_id) {
    return res.status(400).json({ error: 'Cannot send connection request to yourself' });
  }

  try {
    // Use the SQL function to send connection request
    const { error } = await supabase
      .rpc('send_connection_request', {
        requester_id: user_id,
        target_id: target_user_id
      });

    if (error) throw error;

    res.status(200).json({ 
      message: 'Connection request sent successfully',
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept a connection request
router.post('/connections/:user_id/accept', async (req, res) => {
  const { user_id } = req.params;
  const { requester_id } = req.body;

  if (!requester_id) {
    return res.status(400).json({ error: 'requester_id is required' });
  }

  try {
    // Use the SQL function to accept connection request
    const { error } = await supabase
      .rpc('accept_connection_request', {
        user_id: user_id,
        requester_id: requester_id
      });

    if (error) throw error;

    res.status(200).json({ 
      message: 'Connection request accepted successfully',
      status: 'accepted'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a connection request
router.post('/connections/:user_id/reject', async (req, res) => {
  const { user_id } = req.params;
  const { requester_id } = req.body;

  if (!requester_id) {
    return res.status(400).json({ error: 'requester_id is required' });
  }

  try {
    // Use the SQL function to reject connection request
    const { error } = await supabase
      .rpc('reject_connection_request', {
        user_id: user_id,
        requester_id: requester_id
      });

    if (error) throw error;

    res.status(200).json({ 
      message: 'Connection request rejected successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block a user
router.post('/connections/:user_id/block', async (req, res) => {
  const { user_id } = req.params;
  const { blocked_user_id } = req.body;

  if (!blocked_user_id) {
    return res.status(400).json({ error: 'blocked_user_id is required' });
  }

  try {
    // Use the SQL function to block user
    const { error } = await supabase
      .rpc('block_user', {
        blocker_id: user_id,
        blocked_id: blocked_user_id
      });

    if (error) throw error;

    res.status(200).json({ 
      message: 'User blocked successfully',
      status: 'blocked'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connection status between two users
router.get('/connections/:user_id/status/:other_user_id', async (req, res) => {
  const { user_id, other_user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_connection_status', {
        user1_id: user_id,
        user2_id: other_user_id
      });

    if (error) throw error;

    res.status(200).json({ 
      status: data || 'none',
      user1_id: user_id,
      user2_id: other_user_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a connection entirely
router.post('/connections/:user_id/remove', async (req, res) => {
  const { user_id } = req.params;
  const { connection_id } = req.body;

  if (!connection_id) {
    return res.status(400).json({ error: 'connection_id is required' });
  }

  try {
    // Use the SQL function to remove connection
    const { error } = await supabase
      .rpc('remove_connection', {
        target_user_id: user_id,
        connection_to_remove: connection_id
      });

    if (error) throw error;

    res.status(200).json({ message: 'Connection removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connection statistics for a user
router.get('/connections/:user_id/stats', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_connection_counts', {
        target_user_id: user_id
      });

    if (error) throw error;

    // Convert array to object for easier consumption
    const stats = {};
    data.forEach(item => {
      stats[item.status] = parseInt(item.count);
    });

    // Add total count
    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    res.status(200).json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending connection requests (incoming)
router.get('/connections/:user_id/pending-requests', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_user_connections_with_details', {
        target_user_id: user_id,
        filter_status: 'pending_approval'
      });

    if (error) throw error;

    res.status(200).json({ 
      pending_requests: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sent connection requests (outgoing)
router.get('/connections/:user_id/sent-requests', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_user_connections_with_details', {
        target_user_id: user_id,
        filter_status: 'pending'
      });

    if (error) throw error;

    res.status(200).json({ 
      sent_requests: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get accepted connections (friends)
router.get('/connections/:user_id/friends', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_user_connections_with_details', {
        target_user_id: user_id,
        filter_status: 'accepted'
      });

    if (error) throw error;

    res.status(200).json({ 
      friends: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update connection status manually (admin/debug endpoint)
router.patch('/connections/:user_id/update-status', async (req, res) => {
  const { user_id } = req.params;
  const { connection_id, status } = req.body;

  if (!connection_id || !status) {
    return res.status(400).json({ 
      error: 'connection_id and status are required' 
    });
  }

  const validStatuses = ['pending', 'accepted', 'blocked', 'pending_approval'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    const { error } = await supabase
      .rpc('update_connection_status', {
        target_user_id: user_id,
        connection_id: connection_id,
        new_status: status
      });

    if (error) throw error;

    res.status(200).json({ 
      message: 'Connection status updated successfully',
      status: status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all connections for a user (admin endpoint)
router.delete('/connections/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ message: 'All connections deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;