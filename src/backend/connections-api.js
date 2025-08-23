// connections-api.js
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
router.get('/connections/:user_id', async (req, res) => {
  const { user_id } = req.params;

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

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update connections for a user
router.post('/connections/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { connected_users } = req.body;

  if (!connected_users || !Array.isArray(connected_users)) {
    return res.status(400).json({ error: 'connected_users must be an array' });
  }

  try {
    // Check if the user already has a connections record
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let result;
    if (fetchError && fetchError.code === 'PGRST116') {
      // No existing record, create a new one
      result = await supabase
        .from('connections')
        .insert({
          user_id,
          connected_users,
          created_at: new Date(),
          updated_at: new Date()
        });
    } else if (fetchError) {
      throw fetchError;
    } else {
      // Update existing record
      result = await supabase
        .from('connections')
        .update({
          connected_users,
          updated_at: new Date()
        })
        .eq('user_id', user_id);
    }

    if (result.error) throw result.error;

    res.status(200).json({ message: 'Connections updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// connections-api.js - Updated /add endpoint
router.post('/connections/:user_id/add', async (req, res) => {
  const { user_id } = req.params;
  
  // Check if request body exists
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }
  
  const { connected_user_id } = req.body;

  if (!connected_user_id) {
    return res.status(400).json({ error: 'connected_user_id is required' });
  }

  try {
    // Use upsert to handle both insert and update scenarios
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results

    let updatedConnections;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingConnection) {
      // User already has connections, add to existing array if not already present
      updatedConnections = [...existingConnection.connected_users];
      
      // Check if connection already exists
      if (updatedConnections.includes(connected_user_id)) {
        return res.status(400).json({ 
          error: 'Connection already exists',
          message: 'This user is already in your connections list'
        });
      }
      
      updatedConnections.push(connected_user_id);
    } else {
      // No existing connections, create new array
      updatedConnections = [connected_user_id];
    }

    // Use upsert to handle both insert and update
    const { error: upsertError } = await supabase
      .from('connections')
      .upsert({
        user_id: user_id,
        connected_users: updatedConnections,
        updated_at: new Date().toISOString(),
        created_at: existingConnection ? existingConnection.created_at : new Date().toISOString()
      }, {
        onConflict: 'user_id', // Specify the conflict target
        ignoreDuplicates: false // We want to update on conflict
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    res.status(200).json({ 
      message: 'Connection added successfully',
      connected_users: updatedConnections
    });
  } catch (err) {
    console.error('Error adding connection:', err);
    
    if (err.code === '23505') { // PostgreSQL unique violation error code
      return res.status(400).json({ 
        error: 'Connection already exists',
        message: 'This user is already in your connections list'
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Remove a connection from a user's connections list
router.post('/connections/:user_id/remove', async (req, res) => {
  const { user_id } = req.params;
  const { connected_user_id } = req.body;

  if (!connected_user_id) {
    return res.status(400).json({ error: 'connected_user_id is required' });
  }

  try {
    // Get the user's current connections
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(200).json({ message: 'No connections to remove' });
      }
      throw fetchError;
    }

    // Remove the specified connection
    const updatedConnections = existingConnection.connected_users.filter(
      id => id !== connected_user_id
    );

    // Update the database
    const result = await supabase
      .from('connections')
      .update({
        connected_users: updatedConnections,
        updated_at: new Date()
      })
      .eq('user_id', user_id);

    if (result.error) throw result.error;

    res.status(200).json({ message: 'Connection removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all connections for a user
router.delete('/connections/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ message: 'Connections deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;