const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Get upcoming reminders for a user
router.get('/reminders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date().toISOString();
    
    // Get tasks with upcoming reminders
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('reminder_enabled', true)
      .gte('date', now)
      .order('date', { ascending: true });

    if (error) throw error;

    // Filter tasks that have reminders due
    const upcomingReminders = tasks.filter(task => {
      if (!task.reminder_intervals || task.reminder_intervals.length === 0) return false;
      
      const taskTime = new Date(task.date);
      const now = new Date();
      
      return task.reminder_intervals.some(interval => {
        const reminderTime = new Date(taskTime.getTime() - interval * 60000);
        return reminderTime > now && reminderTime <= new Date(now.getTime() + 300000); // Next 5 minutes
      });
    });

    res.json({ reminders: upcomingReminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create/update reminder settings for a task
router.post('/reminders/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reminder_enabled, reminder_intervals, email_notifications } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        reminder_enabled,
        reminder_intervals,
        email_notifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) throw error;

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

    const snoozedUntil = new Date(Date.now() + minutes * 60000);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        snoozed_until: snoozedUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) throw error;

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

    const { data, error } = await supabase
      .from('tasks')
      .update({
        reminders_sent: true,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) throw error;

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

    // Get task details
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Reminder: ${task.title}`,
      html: `
        <h2>Study Session Reminder</h2>
        <p>Hello ${userName},</p>
        <p>This is a reminder for your upcoming study session:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <h3>${task.title}</h3>
          <p><strong>Date:</strong> ${new Date(task.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(task.date).toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> ${task.duration} hours</p>
          ${task.location ? `<p><strong>Location:</strong> ${task.location}</p>` : ''}
          ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
        </div>
        <p>Don't forget to prepare for your session!</p>
        <br>
        <p>Best regards,<br>Wits Study Buddy</p>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;