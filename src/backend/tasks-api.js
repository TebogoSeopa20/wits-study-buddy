const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// Validation middleware
const validateTask = (req, res, next) => {
    const { user_id, title, date, category, priority, status } = req.body;
    
    if (!user_id || !title || !date || !category || !priority || !status) {
        return res.status(400).json({ 
            error: 'Missing required fields: user_id, title, date, category, priority, and status are required' 
        });
    }
    
    // Validate category
    const validCategories = ['assignment', 'exam', 'study', 'project', 'meeting', 'other'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ 
            error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
        });
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ 
            error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') 
        });
    }
    
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ 
            error: 'Invalid date format. Use YYYY-MM-DD format' 
        });
    }
    
    // Validate time format if provided (HH:MM)
    if (req.body.time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(req.body.time)) {
            return res.status(400).json({ 
                error: 'Invalid time format. Use HH:MM format' 
            });
        }
    }
    
    next();
};

// ==========================
// GET all tasks (admin only - should be removed in production)
// ==========================
router.get('/tasks', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error fetching all tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET task by id
// ==========================
router.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Task not found' });
            }
            throw error;
        }
        
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching task by ID:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET tasks by user_id with optional filtering
// ==========================
router.get('/tasks/user/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { status, category, priority, date_from, date_to, limit, offset } = req.query;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    try {
        let query = supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id);
        
        // Apply filters
        if (status) {
            const validStatuses = ['pending', 'in_progress', 'completed'];
            if (validStatuses.includes(status)) {
                query = query.eq('status', status);
            }
        }
        
        if (category) {
            const validCategories = ['assignment', 'exam', 'study', 'project', 'meeting', 'other'];
            if (validCategories.includes(category)) {
                query = query.eq('category', category);
            }
        }
        
        if (priority) {
            const validPriorities = ['low', 'medium', 'high'];
            if (validPriorities.includes(priority)) {
                query = query.eq('priority', priority);
            }
        }
        
        if (date_from) {
            query = query.gte('date', date_from);
        }
        
        if (date_to) {
            query = query.lte('date', date_to);
        }
        
        // Apply pagination
        if (limit && !isNaN(limit)) {
            query = query.limit(parseInt(limit));
        }
        
        if (offset && !isNaN(offset)) {
            query = query.range(parseInt(offset), parseInt(offset) + (limit ? parseInt(limit) : 100) - 1);
        }
        
        // Order by date and time
        query = query.order('date', { ascending: true }).order('time', { ascending: true });
        
        const { data, error } = await query;

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error fetching tasks for user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET tasks by date range (for calendar views)
// ==========================
router.get('/tasks/user/:user_id/range', async (req, res) => {
    const { user_id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Both start_date and end_date are required' });
    }
    
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
        console.error('Error fetching tasks for date range:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET upcoming tasks (next 7 days)
// ==========================
router.get('/tasks/user/:user_id/upcoming', async (req, res) => {
    const { user_id } = req.params;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .gte('date', today)
            .lte('date', nextWeekStr)
            .neq('status', 'completed')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error fetching upcoming tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET overdue tasks
// ==========================
router.get('/tasks/user/:user_id/overdue', async (req, res) => {
    const { user_id } = req.params;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user_id)
            .lt('date', today)
            .neq('status', 'completed')
            .order('date', { ascending: false });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error fetching overdue tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// GET task statistics for user
// ==========================
router.get('/tasks/user/:user_id/stats', async (req, res) => {
    const { user_id } = req.params;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    try {
        // Get all tasks for user
        const { data: allTasks, error: allError } = await supabase
            .from('tasks')
            .select('status, priority, category, date')
            .eq('user_id', user_id);
            
        if (allError) throw allError;
        
        const tasks = allTasks || [];
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            overdue: tasks.filter(t => t.date < today && t.status !== 'completed').length,
            high_priority: tasks.filter(t => t.priority === 'high').length,
            medium_priority: tasks.filter(t => t.priority === 'medium').length,
            low_priority: tasks.filter(t => t.priority === 'low').length,
            by_category: {
                assignment: tasks.filter(t => t.category === 'assignment').length,
                exam: tasks.filter(t => t.category === 'exam').length,
                study: tasks.filter(t => t.category === 'study').length,
                project: tasks.filter(t => t.category === 'project').length,
                meeting: tasks.filter(t => t.category === 'meeting').length,
                other: tasks.filter(t => t.category === 'other').length
            }
        };
        
        res.status(200).json(stats);
    } catch (err) {
        console.error('Error fetching task stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// POST: create new task
// ==========================
router.post('/tasks', validateTask, async (req, res) => {
    const { user_id, title, description, date, time, reminder, email, category, priority, status } = req.body;

    try {
        const taskData = {
            user_id: parseInt(user_id),
            title: title.trim(),
            description: description ? description.trim() : null,
            date,
            time: time || null,
            reminder: reminder || false,
            email: email || null,
            category,
            priority,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select()
            .single();

        if (error) throw error;
        
        res.status(201).json(data);
    } catch (err) {
        console.error('Error creating task:', err);
        
        if (err.code === '23505') {
            res.status(409).json({ error: 'Duplicate task detected' });
        } else if (err.code === '23503') {
            res.status(400).json({ error: 'Invalid user ID' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// ==========================
// PUT: update a task by id
// ==========================
router.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, time, reminder, email, category, priority, status } = req.body;
    
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    // Validate fields if they are provided
    if (category) {
        const validCategories = ['assignment', 'exam', 'study', 'project', 'meeting', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
            });
        }
    }
    
    if (priority) {
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ 
                error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') 
            });
        }
    }
    
    if (status) {
        const validStatuses = ['pending', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
            });
        }
    }

    try {
        // First check if task exists
        const { data: existingTask, error: fetchError } = await supabase
            .from('tasks')
            .select('id')
            .eq('id', id)
            .single();
            
        if (fetchError && fetchError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        if (fetchError) throw fetchError;
        
        // Prepare update data
        const updateData = {
            updated_at: new Date().toISOString()
        };
        
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (date !== undefined) updateData.date = date;
        if (time !== undefined) updateData.time = time || null;
        if (reminder !== undefined) updateData.reminder = reminder;
        if (email !== undefined) updateData.email = email || null;
        if (category !== undefined) updateData.category = category;
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// PATCH: update task status only
// ==========================
router.patch('/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
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

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Task not found' });
            }
            throw error;
        }
        
        res.status(200).json(data);
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// DELETE: delete a task by id
// ==========================
router.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }

    try {
        // First check if task exists
        const { data: existingTask, error: fetchError } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', id)
            .single();
            
        if (fetchError && fetchError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        if (fetchError) throw fetchError;

        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        
        res.status(200).json({ 
            message: `Task "${existingTask.title}" deleted successfully`,
            deleted_task: data[0] || null
        });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// DELETE: delete multiple tasks
// ==========================
router.delete('/tasks/user/:user_id/bulk', async (req, res) => {
    const { user_id } = req.params;
    const { task_ids } = req.body;
    
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
        return res.status(400).json({ error: 'task_ids array is required and cannot be empty' });
    }
    
    // Validate all task_ids are numbers
    const invalidIds = task_ids.filter(id => isNaN(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ error: 'All task IDs must be valid numbers' });
    }

    try {
        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', user_id)
            .in('id', task_ids)
            .select();

        if (error) throw error;
        
        res.status(200).json({ 
            message: `${data.length} tasks deleted successfully`,
            deleted_tasks: data
        });
    } catch (err) {
        console.error('Error bulk deleting tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================
// Error handling middleware
// ==========================
router.use((err, req, res, next) => {
    console.error('Unhandled error in tasks router:', err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;