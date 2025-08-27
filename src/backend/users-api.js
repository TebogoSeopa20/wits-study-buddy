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

// Fetch all tasks for a specific user
router.get('/tasks/:user_id', async (req, res) => {
    const { user_id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch tasks for a specific user and date
router.get('/tasks/:user_id/date/:date', async (req, res) => {
    const { user_id, date } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('date', date)
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch tasks for a specific user within a date range
router.get('/tasks/:user_id/range/:start_date/:end_date', async (req, res) => {
    const { user_id, start_date, end_date } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .gte('date', start_date)
            .lte('date', end_date)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new task
router.post('/tasks', async (req, res) => {
    const { title, description, date, time, category, priority, status, user_id } = req.body;
    
    // Validate required fields
    if (!title || !date || !category || !priority || !status || !user_id) {
        return res.status(400).json({ 
            error: 'Missing required fields: title, date, category, priority, status, user_id' 
        });
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                description,
                date,
                time,
                category,
                priority,
                status,
                user_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an existing task
router.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, time, category, priority, status, user_id } = req.body;
    
    // Validate required fields
    if (!title || !date || !category || !priority || !status || !user_id) {
        return res.status(400).json({ 
            error: 'Missing required fields: title, date, category, priority, status, user_id' 
        });
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                title,
                description,
                date,
                time,
                category,
                priority,
                status,
                user_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task status only
router.patch('/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a task
router.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.status(200).json({ message: 'Task deleted successfully', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get task statistics for a user
router.get('/tasks/:user_id/stats', async (req, res) => {
    const { user_id } = req.params;
    
    try {
        // Get all tasks for the user
        const { data: allTasks, error: allError } = await supabase
            .from('tasks')
            .select('status, date')
            .eq('user_id', user_id);
        
        if (allError) throw allError;
        
        if (!allTasks || allTasks.length === 0) {
            return res.status(200).json({
                total: 0,
                completed: 0,
                pending: 0,
                in_progress: 0,
                overdue: 0
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            total: allTasks.length,
            completed: allTasks.filter(task => task.status === 'completed').length,
            pending: allTasks.filter(task => task.status === 'pending').length,
            in_progress: allTasks.filter(task => task.status === 'in_progress').length,
            overdue: allTasks.filter(task => 
                task.status !== 'completed' && task.date < today
            ).length
        };
        
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get task by ID
router.get('/tasks/single/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get tasks by category for a user
router.get('/tasks/:user_id/category/:category', async (req, res) => {
    const { user_id, category } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('category', category)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get tasks by priority for a user
router.get('/tasks/:user_id/priority/:priority', async (req, res) => {
    const { user_id, priority } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('priority', priority)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get tasks by status for a user
router.get('/tasks/:user_id/status/:status', async (req, res) => {
    const { user_id, status } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('status', status)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
        
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;