// activities-api.js
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

// Create a new activity
router.post('/activities/create', async (req, res) => {
  const {
    user_id,
    title,
    activity_type,
    description,
    activity_date,
    activity_time,
    duration_hours,
    location,
    priority = 'medium',
    group_id = null,
    is_recurring = false,
    recurrence_pattern = null,
    recurrence_end_date = null
  } = req.body;

  // Validation
  if (!user_id || !title || !activity_type || !activity_date || !activity_time || !duration_hours) {
    return res.status(400).json({
      error: 'user_id, title, activity_type, activity_date, activity_time, and duration_hours are required'
    });
  }

  // Validate activity type
  const validTypes = ['study', 'assignment', 'exam', 'meeting', 'personal', 'other'];
  if (!validTypes.includes(activity_type)) {
    return res.status(400).json({
      error: 'activity_type must be one of: ' + validTypes.join(', ')
    });
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      error: 'priority must be one of: ' + validPriorities.join(', ')
    });
  }

  // Validate duration
  if (duration_hours <= 0 || duration_hours > 24) {
    return res.status(400).json({
      error: 'duration_hours must be between 0.1 and 24 hours'
    });
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id,
        title,
        activity_type,
        description: description || null,
        activity_date,
        activity_time,
        duration_hours,
        location: location || null,
        priority,
        group_id: group_id || null,
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        recurrence_end_date: recurrence_end_date || null
      })
      .select(`
        *,
        profiles:user_id (name, email)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Activity created successfully',
      activity: data
    });
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get activities for a user with optional filters
router.get('/activities/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { 
    start_date, 
    end_date, 
    activity_type, 
    is_completed,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    let query = supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (name, email),
        study_groups:group_id (name, subject)
      `, { count: 'exact' })
      .eq('user_id', user_id);

    // Apply filters
    if (start_date) {
      query = query.gte('activity_date', start_date);
    }
    if (end_date) {
      query = query.lte('activity_date', end_date);
    }
    if (activity_type) {
      query = query.eq('activity_type', activity_type);
    }
    if (is_completed !== undefined) {
      query = query.eq('is_completed', is_completed === 'true');
    }

    // Apply ordering and pagination
    query = query
      .order('activity_date', { ascending: true })
      .order('activity_time', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      activities: data || [],
      count: data ? data.length : 0,
      total: count || 0
    });
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get activities for a specific date range
router.get('/activities/range', async (req, res) => {
  const { 
    user_id, 
    start_date, 
    end_date,
    include_completed = false
  } = req.query;

  if (!user_id || !start_date || !end_date) {
    return res.status(400).json({
      error: 'user_id, start_date, and end_date are required'
    });
  }

  try {
    let query = supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (name, email),
        study_groups:group_id (name, subject)
      `)
      .eq('user_id', user_id)
      .gte('activity_date', start_date)
      .lte('activity_date', end_date)
      .order('activity_date', { ascending: true })
      .order('activity_time', { ascending: true });

    if (!include_completed || include_completed === 'false') {
      query = query.eq('is_completed', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({
      activities: data || [],
      count: data ? data.length : 0,
      range: { start_date, end_date }
    });
  } catch (err) {
    console.error('Error fetching activities by range:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get activity by ID
router.get('/activities/:activity_id', async (req, res) => {
  const { activity_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (name, email, faculty, course),
        study_groups:group_id (name, subject, description)
      `)
      .eq('id', activity_id)
      .single();

    if (error) throw error;

    res.status(200).json({ activity: data });
  } catch (err) {
    console.error('Error fetching activity:', err);
    
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Update an activity
router.patch('/activities/:activity_id', async (req, res) => {
  const { activity_id } = req.params;
  const { user_id, ...updates } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.user_id;
  delete updates.created_at;

  // Validate allowed update fields
  const allowedFields = [
    'title', 'activity_type', 'description', 'activity_date', 
    'activity_time', 'duration_hours', 'location', 'priority',
    'is_completed', 'completed_at', 'group_id', 'is_recurring',
    'recurrence_pattern', 'recurrence_end_date'
  ];
  
  const updateFields = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields[key] = updates[key];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  // Set updated_at timestamp
  updateFields.updated_at = new Date().toISOString();

  try {
    // Verify user owns the activity
    const { data: existingActivity, error: verifyError } = await supabase
      .from('activities')
      .select('user_id')
      .eq('id', activity_id)
      .single();

    if (verifyError) throw verifyError;

    if (existingActivity.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only update your own activities' });
    }

    // Update activity
    const { data, error } = await supabase
      .from('activities')
      .update(updateFields)
      .eq('id', activity_id)
      .select(`
        *,
        profiles:user_id (name, email),
        study_groups:group_id (name, subject)
      `)
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Activity updated successfully',
      activity: data
    });
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark activity as completed/incomplete
router.patch('/activities/:activity_id/complete', async (req, res) => {
  const { activity_id } = req.params;
  const { user_id, completed = true } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user owns the activity
    const { data: existingActivity, error: verifyError } = await supabase
      .from('activities')
      .select('user_id')
      .eq('id', activity_id)
      .single();

    if (verifyError) throw verifyError;

    if (existingActivity.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only update your own activities' });
    }

    const updateData = {
      is_completed: completed,
      updated_at: new Date().toISOString()
    };

    if (completed) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activity_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: `Activity marked as ${completed ? 'completed' : 'incomplete'}`,
      activity: data
    });
  } catch (err) {
    console.error('Error updating activity completion:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an activity
router.delete('/activities/:activity_id', async (req, res) => {
  const { activity_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user owns the activity
    const { data: existingActivity, error: verifyError } = await supabase
      .from('activities')
      .select('user_id')
      .eq('id', activity_id)
      .single();

    if (verifyError) {
      if (verifyError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Activity not found' });
      }
      throw verifyError;
    }

    if (existingActivity.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only delete your own activities' });
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activity_id);

    if (error) throw error;

    res.status(200).json({
      message: 'Activity deleted successfully',
      success: true
    });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get calendar statistics for a user
router.get('/activities/user/:user_id/stats', async (req, res) => {
  const { user_id } = req.params;
  const { month, year } = req.query;

  // Default to current month/year if not provided
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

  try {
    // Get all activities for the month
    const { data: activities, error } = await supabase
      .from('activities')
      .select('activity_type, is_completed, group_id')
      .eq('user_id', user_id)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate);

    if (error) throw error;

    const stats = {
      study_sessions: activities?.filter(a => a.activity_type === 'study' && !a.is_completed).length || 0,
      upcoming_deadlines: activities?.filter(a => 
        (a.activity_type === 'assignment' || a.activity_type === 'exam') && !a.is_completed
      ).length || 0,
      group_sessions: activities?.filter(a => a.group_id !== null && !a.is_completed).length || 0,
      completed_activities: activities?.filter(a => a.is_completed).length || 0,
      total_activities: activities?.length || 0
    };

    res.status(200).json({
      stats,
      period: { month: targetMonth, year: targetYear, start_date: startDate, end_date: endDate }
    });
  } catch (err) {
    console.error('Error fetching calendar stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming activities (next 7 days)
router.get('/activities/user/:user_id/upcoming', async (req, res) => {
  const { user_id } = req.params;
  const { limit = 10 } = req.query;

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (name, email),
        study_groups:group_id (name, subject)
      `)
      .eq('user_id', user_id)
      .eq('is_completed', false)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)
      .order('activity_date', { ascending: true })
      .order('activity_time', { ascending: true })
      .limit(parseInt(limit));

    if (error) throw error;

    res.status(200).json({
      upcoming_activities: data || [],
      count: data ? data.length : 0,
      range: { start_date: startDate, end_date: endDate }
    });
  } catch (err) {
    console.error('Error fetching upcoming activities:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;