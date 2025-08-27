// notifications-api.js
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

// Helper function to create notification
const createNotification = async (notificationData) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
};

// Get all notifications for a user
router.get('/notifications/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { limit = 20, offset = 0, unread_only = false } = req.query;

  try {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey (
          user_id,
          name,
          email,
          role,
          faculty,
          course
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({
      notifications: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread notification count
router.get('/notifications/:user_id/count', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ unread_count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.patch('/notifications/:notification_id/read', async (req, res) => {
  const { notification_id } = req.params;
  const { user_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ 
      message: 'Notification marked as read',
      notification: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.post('/notifications/:user_id/read-all', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
router.delete('/notifications/:notification_id', async (req, res) => {
  const { notification_id } = req.params;
  const { user_id } = req.body;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all notifications for user
router.delete('/notifications/:user_id/all', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notification creation endpoints for specific events

// Connection request notification
router.post('/notifications/connection-request', async (req, res) => {
  const { sender_id, target_user_id, connection_id } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    const notification = await createNotification({
      user_id: target_user_id,
      sender_id: sender_id,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${senderProfile?.name || 'Someone'} wants to connect with you`,
      related_entity_type: 'connection',
      related_entity_id: connection_id,
      metadata: {
        status: 'pending',
        action_required: true,
        connection_id: connection_id
      }
    });

    res.status(201).json({ 
      message: 'Connection notification created',
      notification 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connection accepted notification
router.post('/notifications/connection-accepted', async (req, res) => {
  const { sender_id, target_user_id, connection_id } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    const notification = await createNotification({
      user_id: target_user_id,
      sender_id: sender_id,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${senderProfile?.name || 'Someone'} accepted your connection request`,
      related_entity_type: 'connection',
      related_entity_id: connection_id,
      metadata: {
        status: 'accepted',
        connection_id: connection_id
      }
    });

    res.status(201).json({ 
      message: 'Connection accepted notification created',
      notification 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group invitation notification
router.post('/notifications/group-invitation', async (req, res) => {
  const { sender_id, target_user_id, group_id, group_name, invite_code } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    const notification = await createNotification({
      user_id: target_user_id,
      sender_id: sender_id,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${senderProfile?.name || 'Someone'} invited you to join "${group_name}"`,
      related_entity_type: 'study_group',
      related_entity_id: group_id,
      metadata: {
        group_name: group_name,
        invite_code: invite_code,
        action_required: true
      }
    });

    res.status(201).json({ 
      message: 'Group invitation notification created',
      notification 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group join request notification (for group admins)
router.post('/notifications/group-join-request', async (req, res) => {
  const { sender_id, group_id, group_name, admin_user_ids } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    // Create notifications for all group admins
    const notifications = [];
    
    for (const admin_id of admin_user_ids) {
      const notification = await createNotification({
        user_id: admin_id,
        sender_id: sender_id,
        type: 'group_join_request',
        title: 'Join Request',
        message: `${senderProfile?.name || 'Someone'} wants to join "${group_name}"`,
        related_entity_type: 'study_group',
        related_entity_id: group_id,
        metadata: {
          group_name: group_name,
          action_required: true
        }
      });
      
      if (notification) notifications.push(notification);
    }

    res.status(201).json({ 
      message: 'Group join request notifications created',
      notifications 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group member joined notification
router.post('/notifications/group-member-joined', async (req, res) => {
  const { sender_id, group_id, group_name, admin_user_ids } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    // Create notifications for all group admins
    const notifications = [];
    
    for (const admin_id of admin_user_ids) {
      const notification = await createNotification({
        user_id: admin_id,
        sender_id: sender_id,
        type: 'group_member_joined',
        title: 'New Group Member',
        message: `${senderProfile?.name || 'Someone'} joined "${group_name}"`,
        related_entity_type: 'study_group',
        related_entity_id: group_id,
        metadata: {
          group_name: group_name
        }
      });
      
      if (notification) notifications.push(notification);
    }

    res.status(201).json({ 
      message: 'Group member joined notifications created',
      notifications 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Study session created notification
router.post('/notifications/study-session-created', async (req, res) => {
  const { sender_id, group_id, group_name, session_title, member_user_ids } = req.body;

  try {
    // Get sender profile for notification message
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', sender_id)
      .single();

    // Create notifications for all group members
    const notifications = [];
    
    for (const member_id of member_user_ids) {
      const notification = await createNotification({
        user_id: member_id,
        sender_id: sender_id,
        type: 'study_session_created',
        title: 'New Study Session',
        message: `${senderProfile?.name || 'Someone'} created a new study session: "${session_title}" in "${group_name}"`,
        related_entity_type: 'study_session',
        related_entity_id: group_id,
        metadata: {
          group_name: group_name,
          session_title: session_title
        }
      });
      
      if (notification) notifications.push(notification);
    }

    res.status(201).json({ 
      message: 'Study session notifications created',
      notifications 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System announcement notification
router.post('/notifications/system-announcement', async (req, res) => {
  const { title, message, target_user_ids = null } = req.body;

  try {
    let notifications = [];

    if (target_user_ids) {
      // Send to specific users
      for (const user_id of target_user_ids) {
        const notification = await createNotification({
          user_id: user_id,
          type: 'system_announcement',
          title: title || 'System Announcement',
          message: message,
          related_entity_type: 'system',
          metadata: {
            is_system: true
          }
        });
        
        if (notification) notifications.push(notification);
      }
    } else {
      // Send to all users (be careful with this in production!)
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('user_id');

      if (allUsers) {
        for (const user of allUsers) {
          const notification = await createNotification({
            user_id: user.user_id,
            type: 'system_announcement',
            title: title || 'System Announcement',
            message: message,
            related_entity_type: 'system',
            metadata: {
              is_system: true
            }
          });
          
          if (notification) notifications.push(notification);
        }
      }
    }

    res.status(201).json({ 
      message: 'System announcements sent',
      count: notifications.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notification preferences for user
router.get('/notifications/:user_id/preferences', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default preferences if none exist
    const defaultPreferences = {
      connection_requests: true,
      connection_accepted: true,
      group_invitations: true,
      group_join_requests: true,
      group_updates: true,
      study_sessions: true,
      messages: true,
      system_announcements: true,
      email_notifications: false,
      push_notifications: true
    };

    res.status(200).json(data || { ...defaultPreferences, user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update notification preferences
router.put('/notifications/:user_id/preferences', async (req, res) => {
  const { user_id } = req.params;
  const preferences = req.body;

  try {
    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user_id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({ user_id, ...preferences })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint for real-time notifications (optional)
router.post('/notifications/webhook', async (req, res) => {
  // This would handle real-time notifications from Supabase Realtime
  // You can integrate this with Socket.io or similar for live updates
  const { event, data } = req.body;

  try {
    // Handle different event types
    switch (event) {
      case 'connection_request':
        // Process connection request notification
        break;
      case 'group_activity':
        // Process group activity notification
        break;
      default:
        console.log('Unknown notification event:', event);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;