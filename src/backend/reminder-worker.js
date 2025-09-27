const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

class ReminderWorker {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    this.Transport = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Reminder worker started');
    
    // Check every minute
    setInterval(() => this.checkReminders(), 60000);
    
    // Initial check
    await this.checkReminders();
  }

  async checkReminders() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 300000);

      // Get tasks with due reminders (without joining profiles)
      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('reminder_enabled', true)
        .eq('reminders_sent', false)
        .lte('date', fiveMinutesFromNow.toISOString())
        .gte('date', now.toISOString())
        .is('snoozed_until', null);

      if (error) {
        console.error('Error fetching tasks for reminders:', error);
        return;
      }

      for (const task of tasks) {
        await this.processReminder(task);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async processReminder(task) {
    try {
      const taskTime = new Date(task.date);
      const now = new Date();
      
      // Check if any reminder interval is due
      const dueInterval = task.reminder_intervals.find(interval => {
        const reminderTime = new Date(taskTime.getTime() - interval * 60000);
        return reminderTime <= now && reminderTime > new Date(now.getTime() - 60000); // Within last minute
      });

      if (dueInterval) {
        console.log(`Sending reminder for task: ${task.title}`);
        
        // Send email if enabled
        if (task.email_notifications) {
          await this.sendEmailReminder(task);
        }

        // Mark as sent
        await this.supabase
          .from('tasks')
          .update({
            reminders_sent: true,
            last_reminder_sent: new Date().toISOString()
          })
          .eq('id', task.id);
      }
    } catch (error) {
      console.error('Error processing reminder:', error);
    }
  }

  async sendEmailReminder(task) {
    try {
      // Get user profile for email
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('email, name')
        .eq('user_id', task.user_id)
        .single();

      if (error || !profile || !profile.email) {
        console.error('Error fetching user profile for email:', error);
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: profile.email,
        subject: `🔔 Reminder: ${task.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Study Session Reminder</h2>
            <p>Hello ${profile.name},</p>
            <p>This is a reminder for your upcoming study session:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #1e40af;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${task.title}</h3>
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date(task.date).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${new Date(task.date).toLocaleTimeString()}</p>
              <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${task.duration} hours</p>
              ${task.location ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${task.location}</p>` : ''}
              ${task.description ? `<p style="margin: 5px 0;"><strong>📝 Description:</strong> ${task.description}</p>` : ''}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              Don't forget to prepare for your session! You can view this in your calendar at Wits Study Buddy.
            </p>
            <br>
            <p>Best regards,<br><strong>Wits Study Buddy Team</strong></p>
          </div>
        `
      };

      await this.Transport.sendMail(mailOptions);
      console.log(`Email sent to ${profile.email} for task: ${task.title}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

module.exports = ReminderWorker;