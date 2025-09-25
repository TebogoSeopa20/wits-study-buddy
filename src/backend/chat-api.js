const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Get all conversations for a user
router.get('/conversations', async (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations (
          id,
          name,
          type,
          created_by,
          created_at,
          updated_at,
          group_id,
          study_groups (group_name)
        ),
        last_read_at,
        role,
        status
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('updated_at', { foreignTable: 'conversations', ascending: false });

    if (error) throw error;

    // Format the response and get last message for each conversation
    const conversations = await Promise.all(data.map(async (item) => {
      const conversation = item.conversation;
      
      // Get last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversation.id)
        .gt('created_at', item.last_read_at || '1970-01-01')
        .neq('sender_id', user_id);

      return {
        ...conversation,
        lastMessage: lastMessage || null,
        unreadCount: unreadCount || 0,
        participantRole: item.role,
        participantStatus: item.status
      };
    }));

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific conversation
router.get('/conversation/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', id)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        study_groups (group_name, description)
      `)
      .eq('id', id)
      .single();

    if (conversationError) throw conversationError;

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        joined_at,
        last_read_at,
        role,
        status,
        profiles (name, email, faculty, course)
      `)
      .eq('conversation_id', id)
      .eq('status', 'active');

    if (participantsError) throw participantsError;

    res.status(200).json({
      ...conversation,
      participants: participants
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a direct conversation
router.post('/conversation/direct', async (req, res) => {
  const { user1_id, user2_id } = req.body;

  if (!user1_id || !user2_id) {
    return res.status(400).json({ error: 'user1_id and user2_id are required' });
  }

  if (user1_id === user2_id) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  try {
    // Check if conversation already exists
    const { data: existingConversation, error: checkError } = await supabase
      .rpc('get_direct_conversation', { 
        user1_id: user1_id, 
        user2_id: user2_id 
      });

    if (checkError) {
      console.error('Error checking existing conversation:', checkError);
      // Continue with creation anyway
    }

    if (existingConversation && existingConversation.length > 0) {
      return res.status(200).json({ 
        message: 'Conversation already exists',
        conversation_id: existingConversation[0].id 
      });
    }

    // Create new conversation
    const { data: conversationId, error: createError } = await supabase
      .rpc('create_direct_conversation', { 
        user1_id: user1_id, 
        user2_id: user2_id 
      });

    if (createError) {
      console.error('Error creating conversation:', createError);
      return res.status(500).json({ error: 'Failed to create conversation: ' + createError.message });
    }

    res.status(201).json({ 
      message: 'Direct conversation created successfully',
      conversation_id: conversationId 
    });
  } catch (err) {
    console.error('Unexpected error in create direct conversation:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Create a direct conversation
router.post('/conversation/direct', async (req, res) => {
  const { user1_id, user2_id } = req.body;

  if (!user1_id || !user2_id) {
    return res.status(400).json({ error: 'user1_id and user2_id are required' });
  }

  if (user1_id === user2_id) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  try {
    // Check if conversation already exists
    const { data: existingConversation, error: checkError } = await supabase
      .rpc('get_direct_conversation', { user1_id, user2_id });

    if (checkError) throw checkError;

    if (existingConversation) {
      return res.status(200).json({ 
        message: 'Conversation already exists',
        conversation: existingConversation 
      });
    }

    // Create new conversation
    const { data: conversation, error: createError } = await supabase
      .rpc('create_direct_conversation', { user1_id, user2_id });

    if (createError) throw createError;

    res.status(201).json({ 
      message: 'Direct conversation created successfully',
      conversation_id: conversation 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a group conversation
router.post('/conversation/group', async (req, res) => {
  const { group_id, creator_id } = req.body;

  if (!group_id || !creator_id) {
    return res.status(400).json({ error: 'group_id and creator_id are required' });
  }

  try {
    // Check if conversation already exists for this group
    const { data: existingConversation, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('group_id', group_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingConversation) {
      return res.status(200).json({ 
        message: 'Group conversation already exists',
        conversation_id: existingConversation.id 
      });
    }

    // Create new conversation
    const { data: conversation, error: createError } = await supabase
      .rpc('create_group_conversation', { group_id, creator_id });

    if (createError) throw createError;

    res.status(201).json({ 
      message: 'Group conversation created successfully',
      conversation_id: conversation 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversation_id', async (req, res) => {
  const { conversation_id } = req.params;
  const user_id = req.query.user_id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles (name, user_id),
        reply_to:messages!messages_reply_to_id_fkey (id, content, type, sender_id, profiles (name))
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) throw messagesError;

    // Mark messages as read
    await supabase
      .rpc('mark_messages_as_read', { 
        conversation_id: conversation_id, 
        user_id: user_id 
      });

    res.status(200).json(messages.reverse()); // Return in chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/message', async (req, res) => {
  const { conversation_id, sender_id, content, type, reply_to_id } = req.body;

  if (!conversation_id || !sender_id) {
    return res.status(400).json({ error: 'conversation_id and sender_id are required' });
  }

  if (!content && type === 'text') {
    return res.status(400).json({ error: 'content is required for text messages' });
  }

  try {
    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', sender_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        content,
        type: type || 'text',
        reply_to_id
      })
      .select(`
        *,
        sender:profiles (name, user_id),
        reply_to:messages!messages_reply_to_id_fkey (id, content, type, sender_id, profiles (name))
      `)
      .single();

    if (messageError) throw messageError;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    res.status(201).json({ 
      message: 'Message sent successfully',
      data: message 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload file and send as message
router.post('/upload', upload.single('file'), async (req, res) => {
  const { conversation_id, sender_id, reply_to_id } = req.body;
  const file = req.file;

  if (!conversation_id || !sender_id || !file) {
    return res.status(400).json({ error: 'conversation_id, sender_id, and file are required' });
  }

  try {
    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', sender_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine file type
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) fileType = 'image';
    else if (file.mimetype.startsWith('video/')) fileType = 'video';
    else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

    // Upload file to Supabase Storage
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
    const filePath = `chat-files/${conversation_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('chat-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('chat-files')
      .getPublicUrl(filePath);

    // Insert message with file info
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        content: publicUrl,
        type: fileType,
        file_name: file.originalname,
        file_size: file.size,
        file_url: publicUrl,
        mime_type: file.mimetype,
        reply_to_id
      })
      .select(`
        *,
        sender:profiles (name, user_id),
        reply_to:messages!messages_reply_to_id_fkey (id, content, type, sender_id, profiles (name))
      `)
      .single();

    if (messageError) throw messageError;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    res.status(201).json({ 
      message: 'File uploaded and message sent successfully',
      data: message 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.post('/messages/read', async (req, res) => {
  const { conversation_id, user_id } = req.body;

  if (!conversation_id || !user_id) {
    return res.status(400).json({ error: 'conversation_id and user_id are required' });
  }

  try {
    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages as read
    await supabase
      .rpc('mark_messages_as_read', { 
        conversation_id: conversation_id, 
        user_id: user_id 
      });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add participant to conversation (for groups)
router.post('/conversation/:id/participants', async (req, res) => {
  const { id } = req.params;
  const { user_id, added_by } = req.body;

  if (!user_id || !added_by) {
    return res.status(400).json({ error: 'user_id and added_by are required' });
  }

  try {
    // Check if adder has permission (admin or creator)
    const { data: adder, error: adderError } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', id)
      .eq('user_id', added_by)
      .single();

    if (adderError || !adder || (adder.role !== 'admin' && adder.role !== 'creator')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Check if user is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', id)
      .eq('user_id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingParticipant) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: id,
        user_id: user_id,
        joined_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (participantError) throw participantError;

    res.status(201).json({ 
      message: 'Participant added successfully',
      data: participant 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove participant from conversation
router.delete('/conversation/:id/participants/:user_id', async (req, res) => {
  const { id, user_id } = req.params;
  const { removed_by } = req.body;

  if (!removed_by) {
    return res.status(400).json({ error: 'removed_by is required' });
  }

  try {
    // Check if remover has permission (admin or creator, or self-removal)
    if (removed_by !== user_id) {
      const { data: remover, error: removerError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', id)
        .eq('user_id', removed_by)
        .single();

      if (removerError || !remover || (remover.role !== 'admin' && remover.role !== 'creator')) {
        return res.status(403).json({ error: 'Permission denied' });
      }
    }

    // Remove participant
    const { error: removeError } = await supabase
      .from('conversation_participants')
      .update({ 
        status: 'left',
        left_at: new Date().toISOString()
      })
      .eq('conversation_id', id)
      .eq('user_id', user_id);

    if (removeError) throw removeError;

    res.status(200).json({ message: 'Participant removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
router.delete('/message/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Check if user is the sender
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', id)
      .single();

    if (messageError) throw messageError;

    if (message.sender_id !== user_id) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;