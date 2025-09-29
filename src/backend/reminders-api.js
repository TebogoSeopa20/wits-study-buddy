// reminders-api.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

console.log('🔧 Email configuration check:');
console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

let transporter;
let emailEnabled = false;

// Initialize email transporter with fallback
const initializeEmail = async () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email credentials not configured');
        console.log('💡 Reminders will be logged but not sent via email');
        return;
    }

    try {
        // Try Gmail first
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.verify();
        emailEnabled = true;
        console.log('✅ Email transporter ready - Gmail configuration working');
    } catch (error) {
        console.log('❌ Gmail configuration failed:', error.message);
        console.log('💡 Reminders will be logged but not sent via email');
        console.log('🔧 To fix this:');
        console.log('   1. Enable 2-factor authentication on your Gmail');
        console.log('   2. Generate an App Password (not your regular password)');
        console.log('   3. Update EMAIL_PASS in your .env file with the App Password');
        transporter = null;
        emailEnabled = false;
    }
};

// Initialize on startup
initializeEmail();

// Validate Wits University student email format (same as your server.js)
function isValidWitsEmail(email) {
    const emailRegex = /^\d+@students\.wits\.ac\.za$/i;
    return emailRegex.test(email);
}

// Send reminder endpoint
router.post('/send', async (req, res) => {
    const { to, subject, message, event_type, event_id, reminder_time, user_name } = req.body;

    // Validation
    if (!to || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: to, subject, message'
        });
    }

    // Validate email format (must be Wits student email)
    if (!isValidWitsEmail(to)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email format. Only @students.wits.ac.za emails are supported.'
        });
    }

    try {
        // If email is not enabled, log the reminder and return success
        if (!emailEnabled || !transporter) {
            console.log('📧 REMINDER LOGGED (Email not configured):', {
                to,
                subject,
                event_id,
                reminder_time,
                would_have_sent_at: new Date().toLocaleString()
            });
            
            return res.status(200).json({ 
                success: true, 
                message: 'Reminder logged (email service not configured)',
                logged: true,
                emailEnabled: false
            });
        }

        const mailOptions = {
            from: {
                name: 'Wits Study Buddy',
                address: process.env.EMAIL_USER
            },
            to: to,
            subject: subject,
            html: message,
            replyTo: process.env.EMAIL_USER
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Reminder sent to ${to} for event ${event_id || 'unknown'}`);
        console.log('Message ID:', info.messageId);

        res.status(200).json({ 
            success: true, 
            message: 'Reminder sent successfully',
            messageId: info.messageId,
            emailEnabled: true
        });
    } catch (error) {
        console.error('❌ Error sending email reminder:', error.message);
        
        // Even if email fails, log the reminder
        console.log('📧 REMINDER (EMAIL FAILED):', {
            to,
            subject,
            event_id,
            reminder_time,
            error: error.message
        });
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send reminder email: ' + error.message,
            logged: true
        });
    }
});

// Health check endpoint for email service
router.get('/health', async (req, res) => {
    if (!transporter || !emailEnabled) {
        return res.status(200).json({
            success: false,
            message: 'Email service not configured or not working',
            emailEnabled: false,
            configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
        });
    }

    try {
        await transporter.verify();
        res.status(200).json({
            success: true,
            message: 'Email service is healthy',
            emailEnabled: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Email service is not available: ' + error.message,
            emailEnabled: false
        });
    }
});

// Test endpoint - Only accepts Wits student emails
router.post('/test', async (req, res) => {
    try {
        const { to } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        // Validate email format (must be Wits student email)
        if (!isValidWitsEmail(to)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format. Only @students.wits.ac.za emails are supported for testing.'
            });
        }

        // If email is not enabled, return appropriate message
        if (!emailEnabled || !transporter) {
            return res.status(400).json({
                success: false,
                error: 'Email service is not configured. Please check your EMAIL_USER and EMAIL_PASS environment variables.',
                emailEnabled: false
            });
        }

        const mailOptions = {
            from: {
                name: 'Wits Study Buddy',
                address: process.env.EMAIL_USER
            },
            to: to,
            subject: 'Test Email from Wits Study Buddy',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">✅ Wits Study Buddy - Test Email</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>This is a test email from the Wits Study Buddy system.</strong></p>
                        <p>If you're receiving this, your email configuration is working correctly!</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Recipient:</strong> ${to}</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This email confirms that the reminder system is properly configured.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Test email sent successfully to: ${to}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Test email sent successfully',
            messageId: info.messageId,
            to: to,
            emailEnabled: true
        });
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send test email: ' + error.message,
            emailEnabled: false
        });
    }
});

// Configuration help endpoint
router.get('/config-help', (req, res) => {
    const configInfo = {
        emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set',
        emailPass: process.env.EMAIL_PASS ? 'Set' : 'Not set',
        emailEnabled: emailEnabled,
        stepsToFix: [
            '1. Go to your Google Account: https://myaccount.google.com/',
            '2. Enable 2-Factor Authentication',
            '3. Go to "Security" → "App passwords"',
            '4. Generate a new app password for "Mail"',
            '5. Use the 16-character app password (without spaces) in your .env file',
            '6. Restart your server'
        ]
    };
    
    res.status(200).json(configInfo);
});

module.exports = router;