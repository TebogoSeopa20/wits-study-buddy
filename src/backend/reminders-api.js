const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Email Transport
const emailTransport = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test email connection on startup
emailTransport.verify((error, success) => {
  if (error) {
    console.error('Email transport verification failed:', error);
  } else {
    console.log('Email transport is ready to send messages');
  }
});

// Get all tasks for a user
router.get('/tasks/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Fetching tasks for user: ${userId}`);
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error fetching tasks:', error);
      throw error;
    }

    console.log(`Found ${tasks?.length || 0} tasks for user ${userId}`);
    res.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get upcoming reminders for a user
router.get('/reminders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 300000);
    
    console.log(`Fetching reminders for user: ${userId}`);
    
    // Get tasks with upcoming reminders
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('reminder_enabled', true)
      .eq('reminders_sent', false)
      .lte('date', fiveMinutesFromNow.toISOString())
      .gte('date', now.toISOString())
      .is('snoozed_until', null)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error fetching reminders:', error);
      throw error;
    }

    // Filter tasks that have reminders due
    const upcomingReminders = tasks.filter(task => {
      if (!task.reminder_intervals || task.reminder_intervals.length === 0) return false;
      
      const taskTime = new Date(task.date);
      
      return task.reminder_intervals.some(interval => {
        const reminderTime = new Date(taskTime.getTime() - interval * 60000);
        return reminderTime <= now && reminderTime > new Date(now.getTime() - 60000); // Within last minute
      });
    });

    console.log(`Found ${upcomingReminders.length} upcoming reminders for user ${userId}`);
    res.json({ reminders: upcomingReminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create/update task with reminder settings
router.post('/tasks', async (req, res) => {
  try {
    const { 
      title, 
      date, 
      user_id, 
      description, 
      category, 
      priority, 
      duration, 
      location, 
      reminder_enabled, 
      reminder_intervals, 
      email_notifications 
    } = req.body;

    console.log('Received task data:', { title, date, user_id, category });

    // Validate required fields
    if (!title || !date || !user_id) {
      console.error('Missing required fields:', { title, date, user_id });
      return res.status(400).json({ error: 'Title, date, and user_id are required' });
    }

    // Validate date is in the future
    const taskDate = new Date(date);
    const now = new Date();
    if (taskDate < now) {
      return res.status(400).json({ error: 'Cannot create tasks for past dates' });
    }

    // Check if task already exists (more precise matching)
    const taskStartTime = new Date(date);
    const fiveMinutesBefore = new Date(taskStartTime.getTime() - 300000);
    const fiveMinutesAfter = new Date(taskStartTime.getTime() + 300000);

    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .eq('title', title)
      .gte('date', fiveMinutesBefore.toISOString())
      .lte('date', fiveMinutesAfter.toISOString());

    if (checkError) {
      console.error('Error checking for existing tasks:', checkError);
      throw checkError;
    }

    let task;
    if (existingTasks && existingTasks.length > 0) {
      // Update existing task
      console.log('Updating existing task:', existingTasks[0].id);
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title,
          date,
          description: description || '',
          category: category || 'study',
          priority: priority || 'medium',
          duration: duration || 1,
          location: location || '',
          reminder_enabled: reminder_enabled !== undefined ? reminder_enabled : true,
          reminder_intervals: reminder_intervals || [15],
          email_notifications: email_notifications || false,
          reminders_sent: false, // Reset reminders when task is updated
          snoozed_until: null, // Reset snooze when task is updated
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTasks[0].id)
        .select();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }
      
      task = data[0];
      console.log('Task updated successfully:', task.id);
    } else {
      // Create new task
      console.log('Creating new task');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          date,
          user_id,
          description: description || '',
          category: category || 'study',
          priority: priority || 'medium',
          duration: duration || 1,
          location: location || '',
          reminder_enabled: reminder_enabled !== undefined ? reminder_enabled : true,
          reminder_intervals: reminder_intervals || [15],
          email_notifications: email_notifications || false,
          reminders_sent: false,
          snoozed_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }
      
      task = data[0];
      console.log('Task created successfully:', task.id);
    }

    res.json({ task });
  } catch (error) {
    console.error('Error creating/updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create/update reminder settings for a task
router.post('/reminders/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reminder_enabled, reminder_intervals, email_notifications } = req.body;

    console.log(`Updating reminder settings for task: ${taskId}`, {
      reminder_enabled,
      reminder_intervals,
      email_notifications
    });

    const { data, error } = await supabase
      .from('tasks')
      .update({
        reminder_enabled,
        reminder_intervals: reminder_intervals || [15],
        email_notifications,
        reminders_sent: false, // Reset when settings change
        snoozed_until: null, // Reset snooze
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Reminder settings updated successfully');
    res.json({ task: data[0] });
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
});

// Snooze a reminder
router.post('/reminders/:taskId/snooze', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { minutes } = req.body;

    const snoozedUntil = new Date(Date.now() + (minutes || 5) * 60000);

    console.log(`Snoozing reminder for task: ${taskId} until ${snoozedUntil}`);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        snoozed_until: snoozedUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error snoozing reminder:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Reminder snoozed successfully');
    res.json({ task: data[0] });
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ error: 'Failed to snooze reminder' });
  }
});

// Mark reminder as sent
router.post('/reminders/:taskId/sent', async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log(`Marking reminder as sent for task: ${taskId}`);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        reminders_sent: true,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Reminder marked as sent successfully');
    res.json({ task: data[0] });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    res.status(500).json({ error: 'Failed to mark reminder as sent' });
  }
});

// Send email notification
router.post('/reminders/:taskId/email', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userEmail, userName } = req.body;

    console.log(`Sending email for task: ${taskId}`);

    // Get task details
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task for email:', error);
      throw error;
    }

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get user profile for email if not provided
    let email = userEmail;
    let name = userName;
    
    if (!email || !name) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('user_id', task.user_id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profile) {
        email = profile.email;
        name = profile.name;
      }
    }

    if (!email) {
      console.error('No email address found for user:', task.user_id);
      return res.status(400).json({ error: 'No email address found for user' });
    }

    // Format date and time
    const taskDate = new Date(task.date);
    const formattedDate = taskDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = taskDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🔔 Study Reminder: ${task.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border-left: 4px solid #1e40af; }
                .activity-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
                .btn { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Wits Study Buddy</h1>
                    <h2>Study Session Reminder</h2>
                </div>
                <div class="content">
                    <p>Hello <strong>${name || 'there'}</strong>,</p>
                    <p>This is a reminder for your upcoming study session:</p>
                    
                    <div class="activity-details">
                        <h3 style="margin: 0 0 15px 0; color: #1e293b;">${task.title}</h3>
                        <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                        <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                        <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${task.duration || 1} hour(s)</p>
                        ${task.location ? `<p style="margin: 8px 0;"><strong>📍 Location:</strong> ${task.location}</p>` : ''}
                        ${task.description ? `<p style="margin: 8px 0;"><strong>📝 Description:</strong> ${task.description}</p>` : ''}
                        ${task.category ? `<p style="margin: 8px 0;"><strong>📚 Type:</strong> ${task.category}</p>` : ''}
                    </div>
                    
                    <p>Don't forget to prepare for your session! You can view this in your calendar at Wits Study Buddy.</p>
                    
                    <div class="footer">
                        <p>Best regards,<br><strong>Wits Study Buddy Team</strong></p>
                        <p><small>This is an automated reminder. Please do not reply to this email.</small></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await emailTransport.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    res.json({ 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// Get a specific task
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      throw error;
    }

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Delete a task
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;