// study-groups-api.js
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

// Get all groups (including scheduled ones)
router.get('/groups', async (req, res) => {
  const { status = 'active', limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email),
        group_members!inner (user_id, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply limit and offset for pagination
    query = query.range(offset, offset + limit - 1);

    const { data: groups, error, count } = await query;

    if (error) throw error;

    // Process groups to include member count and membership status
    const processedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        // Get member count
        const { count: memberCount, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('status', 'active');

        if (countError) console.error('Error counting members:', countError);

        return {
          ...group,
          member_count: memberCount || 0,
          is_scheduled: group.is_scheduled || false
        };
      })
    );

    res.status(200).json({
      groups: processedGroups || [],
      count: count || 0,
      total: count || 0
    });
  } catch (err) {
    console.error('Error fetching all groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new study group
router.post('/groups/create', async (req, res) => {
  const {
    name,
    description,
    subject,
    creator_id,
    max_members = 10,
    is_private = false,
    faculty = null,
    course = null,
    year_of_study = null,
    scheduled_start = null,
    scheduled_end = null,
    meeting_times = []
  } = req.body;

  // Validation
  if (!name || !subject || !creator_id) {
    return res.status(400).json({
      error: 'name, subject, and creator_id are required'
    });
  }

  // Check if this is a scheduled group
  const isScheduled = scheduled_start && scheduled_end;
  
  if (isScheduled) {
    if (new Date(scheduled_start) >= new Date(scheduled_end)) {
      return res.status(400).json({
        error: 'scheduled_start must be before scheduled_end'
      });
    }

    if (new Date(scheduled_start) <= new Date()) {
      return res.status(400).json({
        error: 'scheduled_start must be in the future'
      });
    }
  }

  try {
    let data;
    let error;
    
    if (isScheduled) {
      // Use scheduled creation function
      ({ data, error } = await supabase
        .rpc('create_scheduled_study_group', {
          group_name: name,
          group_description: description || null,
          group_subject: subject,
          creator_user_id: creator_id,
          schedule_start: scheduled_start,
          schedule_end: scheduled_end,
          meeting_times_json: meeting_times,
          group_max_members: max_members,
          group_is_private: is_private,
          group_faculty: faculty,
          group_course: course,
          group_year_of_study: year_of_study
        }));
    } else {
      // Use regular creation function
      ({ data, error } = await supabase
        .rpc('create_study_group', {
          group_name: name,
          group_description: description || null,
          group_subject: subject,
          creator_user_id: creator_id,
          group_max_members: max_members,
          group_is_private: is_private,
          group_faculty: faculty,
          group_course: course,
          group_year_of_study: year_of_study
        }));
    }

    if (error) throw error;

    // Get the created group details
    const { data: groupDetails, error: detailsError } = await supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email)
      `)
      .eq('id', data)
      .single();

    if (detailsError) throw detailsError;

    res.status(201).json({
      message: `Study group ${isScheduled ? 'scheduled' : 'created'} successfully`,
      group: groupDetails
    });
  } catch (err) {
    console.error('Error creating study group:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add these new endpoints to your study-groups-api.js

// Create scheduled study group
router.post('/groups/create-scheduled', async (req, res) => {
  const {
    name,
    description,
    subject,
    creator_id,
    scheduled_start,
    scheduled_end,
    meeting_times = [],
    max_members = 10,
    is_private = false,
    faculty = null,
    course = null,
    year_of_study = null
  } = req.body;

  // Validation
  if (!name || !subject || !creator_id || !scheduled_start || !scheduled_end) {
    return res.status(400).json({
      error: 'name, subject, creator_id, scheduled_start, and scheduled_end are required'
    });
  }

  if (new Date(scheduled_start) >= new Date(scheduled_end)) {
    return res.status(400).json({
      error: 'scheduled_start must be before scheduled_end'
    });
  }

  if (new Date(scheduled_start) <= new Date()) {
    return res.status(400).json({
      error: 'scheduled_start must be in the future'
    });
  }

  try {
    const { data, error } = await supabase
      .rpc('create_scheduled_study_group', {
        group_name: name,
        group_description: description || null,
        group_subject: subject,
        creator_user_id: creator_id,
        schedule_start: scheduled_start,
        schedule_end: scheduled_end,
        meeting_times_json: meeting_times,
        group_max_members: max_members,
        group_is_private: is_private,
        group_faculty: faculty,
        group_course: course,
        group_year_of_study: year_of_study
      });

    if (error) throw error;

    // Get the created group details
    const { data: groupDetails, error: detailsError } = await supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email)
      `)
      .eq('id', data)
      .single();

    if (detailsError) throw detailsError;

    res.status(201).json({
      message: 'Scheduled study group created successfully',
      group: groupDetails
    });
  } catch (err) {
    console.error('Error creating scheduled study group:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get active scheduled groups for user
router.get('/groups/user/:user_id/scheduled/active', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_active_scheduled_groups', {}, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });

    if (error) throw error;

    res.status(200).json({
      groups: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    console.error('Error fetching active scheduled groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming scheduled groups
router.get('/groups/scheduled/upcoming', async (req, res) => {
  const { days_ahead = 7 } = req.query;

  try {
    const { data, error } = await supabase
      .rpc('get_upcoming_scheduled_groups', {
        days_ahead: parseInt(days_ahead)
      });

    if (error) throw error;

    res.status(200).json({
      groups: data || [],
      count: data ? data.length : 0,
      days_ahead: parseInt(days_ahead)
    });
  } catch (err) {
    console.error('Error fetching upcoming scheduled groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update group schedule
router.patch('/groups/:group_id/schedule', async (req, res) => {
  const { group_id } = req.params;
  const { user_id, scheduled_start, scheduled_end, meeting_times } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  if (scheduled_start && scheduled_end && new Date(scheduled_start) >= new Date(scheduled_end)) {
    return res.status(400).json({ error: 'scheduled_start must be before scheduled_end' });
  }

  try {
    // Verify user is creator or admin
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership || !['creator', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only group creators and admins can update schedule' });
    }

    // Build update object
    const updateFields = {};
    if (scheduled_start !== undefined) updateFields.scheduled_start = scheduled_start;
    if (scheduled_end !== undefined) updateFields.scheduled_end = scheduled_end;
    if (meeting_times !== undefined) updateFields.meeting_times = meeting_times;
    
    // If both start and end are provided, mark as scheduled
    if (scheduled_start && scheduled_end) {
      updateFields.is_scheduled = true;
      updateFields.status = 'scheduled'; // Reset to scheduled status
    }

    // Update group schedule
    const { data, error } = await supabase
      .from('study_groups')
      .update(updateFields)
      .eq('id', group_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Group schedule updated successfully',
      group: data
    });
  } catch (err) {
    console.error('Error updating group schedule:', err);
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger for schedule cleanup (for testing/admin purposes)
router.post('/admin/update-group-schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('update_group_status_based_on_schedule');

    if (error) throw error;

    res.status(200).json({
      message: 'Group schedules updated successfully',
      success: true
    });
  } catch (err) {
    console.error('Error updating group schedules:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all groups for a user
router.get('/groups/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { status = 'active' } = req.query;

  try {
    const { data, error } = await supabase
      .rpc('get_user_groups', {
        target_user_id: user_id,
        group_status: status
      });

    if (error) throw error;

    res.status(200).json({
      groups: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get group details by ID
router.get('/groups/:group_id', async (req, res) => {
  const { group_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email, faculty, course)
      `)
      .eq('id', group_id)
      .single();

    if (error) throw error;

    // Get member count
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group_id)
      .eq('status', 'active');

    if (countError) throw countError;

    res.status(200).json({
      group: {
        ...data,
        member_count: memberCount || 0
      }
    });
  } catch (err) {
    console.error('Error fetching group details:', err);
    
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Get group members
router.get('/groups/:group_id/members', async (req, res) => {
  const { group_id } = req.params;

  try {
    const { data, error } = await supabase
      .rpc('get_group_members_details', {
        target_group_id: group_id
      });

    if (error) throw error;

    res.status(200).json({
      members: data || [],
      count: data ? data.length : 0
    });
  } catch (err) {
    console.error('Error fetching group members:', err);
    res.status(500).json({ error: err.message });
  }
});

// Join a group
router.post('/groups/:group_id/join', async (req, res) => {
  const { group_id } = req.params;
  const { user_id, invited_by = null } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('join_study_group', {
        target_group_id: group_id,
        joining_user_id: user_id,
        inviter_id: invited_by
      });

    if (error) throw error;

    res.status(200).json({
      message: 'Successfully joined the group',
      success: data
    });
  } catch (err) {
    console.error('Error joining group:', err);
    
    // Handle specific error cases
    if (err.message.includes('Group not found')) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (err.message.includes('already a member')) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }
    if (err.message.includes('Group is full')) {
      return res.status(400).json({ error: 'Group has reached maximum capacity' });
    }
    if (err.message.includes('Must be connected')) {
      return res.status(403).json({ error: 'Must be connected to a group member to join private groups' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Join group by invite code
router.post('/groups/join-by-code', async (req, res) => {
  const { invite_code, user_id } = req.body;

  if (!invite_code || !user_id) {
    return res.status(400).json({ error: 'invite_code and user_id are required' });
  }

  try {
    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, name, status')
      .eq('invite_code', invite_code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invalid invite code' });
      }
      throw groupError;
    }

    // Join the group
    const { data, error } = await supabase
      .rpc('join_study_group', {
        target_group_id: group.id,
        joining_user_id: user_id
      });

    if (error) throw error;

    res.status(200).json({
      message: `Successfully joined ${group.name}`,
      group_id: group.id,
      group_name: group.name
    });
  } catch (err) {
    console.error('Error joining group by code:', err);
    
    if (err.message.includes('already a member')) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }
    if (err.message.includes('Group is full')) {
      return res.status(400).json({ error: 'Group has reached maximum capacity' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Leave a group
router.post('/groups/:group_id/leave', async (req, res) => {
  const { group_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('leave_study_group', {
        target_group_id: group_id,
        leaving_user_id: user_id
      });

    if (error) throw error;

    res.status(200).json({
      message: 'Successfully left the group',
      success: data
    });
  } catch (err) {
    console.error('Error leaving group:', err);
    
    if (err.message.includes('not a member')) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }
    if (err.message.includes('must transfer ownership')) {
      return res.status(400).json({ 
        error: 'Group creator must transfer ownership or delete group before leaving' 
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Remove a member from group
router.post('/groups/:group_id/remove-member', async (req, res) => {
  const { group_id } = req.params;
  const { user_id, target_user_id } = req.body;

  if (!user_id || !target_user_id) {
    return res.status(400).json({ error: 'user_id and target_user_id are required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('remove_group_member', {
        target_group_id: group_id,
        target_user_id: target_user_id,
        removing_user_id: user_id
      });

    if (error) throw error;

    res.status(200).json({
      message: 'Member removed successfully',
      success: data
    });
  } catch (err) {
    console.error('Error removing member:', err);
    
    if (err.message.includes('Only group creators and admins')) {
      return res.status(403).json({ error: 'Only group creators and admins can remove members' });
    }
    if (err.message.includes('not a member')) {
      return res.status(400).json({ error: 'Target user is not a member of this group' });
    }
    if (err.message.includes('Cannot remove group creator')) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Delete a group
router.delete('/groups/:group_id', async (req, res) => {
  const { group_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('delete_study_group', {
        target_group_id: group_id,
        deleting_user_id: user_id
      });

    if (error) throw error;

    res.status(200).json({
      message: 'Group deleted successfully',
      success: data
    });
  } catch (err) {
    console.error('Error deleting group:', err);
    
    if (err.message.includes('Only group creator')) {
      return res.status(403).json({ error: 'Only group creator can delete the group' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Update group details
router.patch('/groups/:group_id', async (req, res) => {
  const { group_id } = req.params;
  const { user_id, ...updates } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // Validate allowed update fields
  const allowedFields = ['name', 'description', 'subject', 'max_members', 'is_private', 'status'];
  const updateFields = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields[key] = updates[key];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    // Verify user is creator or admin
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership || !['creator', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only group creators and admins can update group details' });
    }

    // Update group
    const { data, error } = await supabase
      .from('study_groups')
      .update(updateFields)
      .eq('id', group_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Group updated successfully',
      group: data
    });
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search/Find public groups
router.get('/groups/search/public', async (req, res) => {
  const { subject, faculty, year_of_study } = req.query;

  try {
    const { data, error } = await supabase
      .rpc('find_public_groups', {
        search_subject: subject || null,
        search_faculty: faculty || null,
        search_year: year_of_study || null
      });

    if (error) throw error;

    res.status(200).json({
      groups: data || [],
      count: data ? data.length : 0,
      filters: {
        subject: subject || null,
        faculty: faculty || null,
        year_of_study: year_of_study || null
      }
    });
  } catch (err) {
    console.error('Error searching groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get group by invite code (for preview before joining)
router.get('/groups/by-code/:invite_code', async (req, res) => {
  const { invite_code } = req.params;

  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select(`
        id, name, description, subject, max_members, is_private,
        faculty, course, year_of_study, created_at,
        profiles!creator_id (name)
      `)
      .eq('invite_code', invite_code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invalid invite code' });
      }
      throw error;
    }

    // Get member count
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', data.id)
      .eq('status', 'active');

    if (countError) throw countError;

    res.status(200).json({
      group: {
        ...data,
        member_count: memberCount || 0
      }
    });
  } catch (err) {
    console.error('Error fetching group by code:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update member role (promote/demote)
router.patch('/groups/:group_id/members/:member_id/role', async (req, res) => {
  const { group_id, member_id } = req.params;
  const { user_id, new_role } = req.body;

  if (!user_id || !new_role) {
    return res.status(400).json({ error: 'user_id and new_role are required' });
  }

  const validRoles = ['admin', 'member'];
  if (!validRoles.includes(new_role)) {
    return res.status(400).json({ error: 'new_role must be either admin or member' });
  }

  try {
    // Verify user is creator
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership || membership.role !== 'creator') {
      return res.status(403).json({ error: 'Only group creator can change member roles' });
    }

    // Update member role
    const { data, error } = await supabase
      .from('group_members')
      .update({ role: new_role })
      .eq('group_id', group_id)
      .eq('user_id', member_id)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    res.status(200).json({
      message: `Member role updated to ${new_role}`,
      member: data
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get group statistics
router.get('/groups/:group_id/stats', async (req, res) => {
  const { group_id } = req.params;

  try {
    // Get member stats
    const { data: memberStats, error: statsError } = await supabase
      .from('group_members')
      .select('role, status')
      .eq('group_id', group_id);

    if (statsError) throw statsError;

    const stats = {
      total_members: memberStats.filter(m => m.status === 'active').length,
      creators: memberStats.filter(m => m.role === 'creator' && m.status === 'active').length,
      admins: memberStats.filter(m => m.role === 'admin' && m.status === 'active').length,
      regular_members: memberStats.filter(m => m.role === 'member' && m.status === 'active').length,
      total_left: memberStats.filter(m => m.status === 'left').length,
      total_removed: memberStats.filter(m => m.status === 'removed').length
    };

    res.status(200).json({ stats });
  } catch (err) {
    console.error('Error fetching group stats:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;