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

// ==========================
// GET all tasks
// ==========================
router.get('/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('date', { ascending: true }); // optional: order by date

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET task by id
// ==========================
router.get('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET tasks by user_id
// ==========================
router.get('/tasks/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// POST: create new task
// ==========================
router.post('/tasks', async (req, res) => {
  const { user_id, title, description, date, time, reminder, email, category, priority, status } = req.body;

  if (!user_id || !title || !date || !time) {
    return res.status(400).json({ error: 'user_id, title, date, and time are required' });
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id,
          title,
          description: description || null,
          date,
          time,
          reminder: reminder || false,
          email: email || null,
          category: category || 'general',
          priority: priority || 'medium',
          status: status || 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// PUT: update a task by id
// ==========================
router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, reminder, email, category, priority, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title,
        description,
        date,
        time,
        reminder,
        email,
        category,
        priority,
        status,
        updated_at: new Date() // update timestamp
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// DELETE: delete a task by id
// ==========================
router.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select(); // returns deleted rows

    if (error) throw error;
    res.status(200).json({ message: `Task with id ${id} deleted`, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
