
// chatting-api.js
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

// Create a new chat for a group
router.post('/groups/:group_id/chats/create', async (req, res) => {
  const { group_id } = req.params;
  const { title, chat_type = 'general', created_by } = req.body;

  if (!created_by) {
    return res.status(400).json({ error: 'created_by is required' });
  }

  if (!['general', 'topic', 'help', 'notes'].includes(chat_type)) {
    return res.status(400).json({ error: 'Invalid chat type' });
  }

  try {
    // Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', created_by)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Only group members can create chats' });
    }

    // Create the chat
    const { data, error } = await supabase
      .from('chatting')
      .insert({
        group_id: group_id,
        title: title,
        chat_type: chat_type,
        created_by: created_by
      })
      .select(`
        *,
        profiles!created_by (name, email)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Chat created successfully',
      chat: data
    });
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for a group
router.get('/groups/:group_id/chats', async (req, res) => {
  const { group_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Only group members can view chats' });
    }

    // Get all chats for the group
    const { data, error } = await supabase
      .from('chatting')
      .select(`
        *,
        profiles!created_by (name),
        chat_messages!inner (
          id,
          created_at
        )
      `)
      .eq('group_id', group_id)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Get unread counts for each chat
    const chatsWithUnread = await Promise.all(
      (data || []).map(async (chat) => {
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .gt('created_at', await getLastReadAt(chat.id, user_id));

        return {
          ...chat,
          unread_count: unreadCount || 0,
          message_count: chat.chat_messages?.length || 0
        };
      })
    );

    res.status(200).json({
      chats: chatsWithUnread,
      count: chatsWithUnread.length
    });
  } catch (err) {
    console.error('Error fetching group chats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get chat messages
router.get('/chats/:chat_id/messages', async (req, res) => {
  const { chat_id } = req.params;
  const { user_id, page = 1, limit = 50 } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user has access to the chat
    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chat_id)
      .eq('user_id', user_id)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get messages with sender info and replies
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles!sender_id (name, email, role),
        reply_to:chat_messages!reply_to_id (
          id,
          content,
          sender_id,
          profiles!sender_id (name)
        )
      `)
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Mark messages as read for this user
    await markMessagesAsRead(chat_id, user_id);

    res.status(200).json({
      messages: messages || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: (messages?.length || 0) >= limit
      }
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/chats/:chat_id/messages', async (req, res) => {
  const { chat_id } = req.params;
  const { sender_id, content, message_type = 'text', document_url = null, document_name = null, document_size = null, document_type = null, reply_to_id = null } = req.body;

  if (!sender_id || !content) {
    return res.status(400).json({ error: 'sender_id and content are required' });
  }

  try {
    // Verify user has access to the chat
    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chat_id)
      .eq('user_id', sender_id)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Create the message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chat_id,
        sender_id: sender_id,
        content: content,
        message_type: message_type,
        document_url: document_url,
        document_name: document_name,
        document_size: document_size,
        document_type: document_type,
        reply_to_id: reply_to_id
      })
      .select(`
        *,
        profiles!sender_id (name, email, role),
        reply_to:chat_messages!reply_to_id (
          id,
          content,
          sender_id,
          profiles!sender_id (name)
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Message sent successfully',
      message_data: data
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Share a note/document in chat
router.post('/chats/:chat_id/share-note', async (req, res) => {
  const { chat_id } = req.params;
  const { uploaded_by, title, description, file_url, file_name, file_size, file_type, subject_area } = req.body;

  if (!uploaded_by || !title || !file_url || !file_name || !file_size || !file_type) {
    return res.status(400).json({ 
      error: 'uploaded_by, title, file_url, file_name, file_size, and file_type are required' 
    });
  }

  try {
    // Verify user has access to the chat
    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chat_id)
      .eq('user_id', uploaded_by)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Create the shared note
    const { data: note, error: noteError } = await supabase
      .from('chat_shared_notes')
      .insert({
        chat_id: chat_id,
        uploaded_by: uploaded_by,
        title: title,
        description: description,
        file_url: file_url,
        file_name: file_name,
        file_size: file_size,
        file_type: file_type,
        subject_area: subject_area
      })
      .select(`
        *,
        profiles!uploaded_by (name, email)
      `)
      .single();

    if (noteError) throw noteError;

    // Also create a message about the shared note
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chat_id,
        sender_id: uploaded_by,
        content: `Shared note: ${title}`,
        message_type: 'note',
        document_url: file_url,
        document_name: file_name,
        document_size: file_size,
        document_type: file_type
      })
      .select(`
        *,
        profiles!sender_id (name, email, role)
      `)
      .single();

    if (messageError) throw messageError;

    res.status(201).json({
      message: 'Note shared successfully',
      note: note,
      message: message
    });
  } catch (err) {
    console.error('Error sharing note:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add reaction to message
router.post('/messages/:message_id/reactions', async (req, res) => {
  const { message_id } = req.params;
  const { user_id, reaction_type } = req.body;

  if (!user_id || !reaction_type) {
    return res.status(400).json({ error: 'user_id and reaction_type are required' });
  }

  const validReactions = ['like', 'helpful', 'thanks', 'question', 'important'];
  if (!validReactions.includes(reaction_type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  try {
    // Verify user has access to the message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('chat_id')
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', message.chat_id)
      .eq('user_id', user_id)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add reaction
    const { data, error } = await supabase
      .from('chat_reactions')
      .insert({
        message_id: message_id,
        user_id: user_id,
        reaction_type: reaction_type
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Reaction already exists' });
      }
      throw error;
    }

    res.status(201).json({
      message: 'Reaction added successfully',
      reaction: data
    });
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get chat participants
router.get('/chats/:chat_id/participants', async (req, res) => {
  const { chat_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user has access to the chat
    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chat_id)
      .eq('user_id', user_id)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Get participants with profile info
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        *,
        profiles!user_id (name, email, role, faculty, course)
      `)
      .eq('chat_id', chat_id)
      .order('role', { ascending: false })
      .order('joined_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      participants: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    console.error('Error fetching chat participants:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get shared notes for a chat
router.get('/chats/:chat_id/notes', async (req, res) => {
  const { chat_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user has access to the chat
    const { data: access, error: accessError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chat_id)
      .eq('user_id', user_id)
      .single();

    if (accessError || !access) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Get shared notes
    const { data, error } = await supabase
      .from('chat_shared_notes')
      .select(`
        *,
        profiles!uploaded_by (name, email)
      `)
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      notes: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    console.error('Error fetching shared notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper functions
async function getLastReadAt(chat_id, user_id) {
  const { data } = await supabase
    .from('chat_participants')
    .select('last_read_at')
    .eq('chat_id', chat_id)
    .eq('user_id', user_id)
    .single();

  return data?.last_read_at || new Date(0).toISOString();
}

async function markMessagesAsRead(chat_id, user_id) {
  // Update last_read_at for the participant
  await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('chat_id', chat_id)
    .eq('user_id', user_id);

  // Update read_by array for messages (this is a simplified approach)
  // In a production app, you might want a separate table for read receipts
}

// Delete a message
router.delete('/messages/:message_id', async (req, res) => {
  const { message_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Verify user owns the message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== user_id) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    // Delete the message
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', message_id);

    if (error) throw error;

    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a message
router.patch('/messages/:message_id', async (req, res) => {
  const { message_id } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ error: 'user_id and content are required' });
  }

  try {
    // Verify user owns the message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== user_id) {
      return res.status(403).json({ error: 'Can only edit your own messages' });
    }

    // Update the message
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content: content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', message_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Message updated successfully',
      message_data: data
    });
  } catch (err) {
    console.error('Error updating message:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;