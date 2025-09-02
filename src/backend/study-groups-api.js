// study-groups-api.js - FIXED VERSION with Scheduled Groups Join Support
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

// Update the isScheduledGroupActive function in study-groups-api.js
function isScheduledGroupActive(group) {
  if (!group.is_scheduled) {
    return group.status === 'active';
  }
  
  // For scheduled groups, check if current time is within the scheduled period
  const now = new Date();
  const startDate = new Date(group.scheduled_start);
  const endDate = new Date(group.scheduled_end);
  
  // Group is active if current time is between start and end dates
  return now >= startDate && now <= endDate;
}

// Generate a random invite code
function generateInviteCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// CREATE GROUP ENDPOINT - ADD THIS
router.post('/groups', async (req, res) => {
  const {
    name,
    description,
    subject,
    faculty,
    course,
    year_of_study,
    max_members,
    is_private,
    creator_id,
    is_scheduled,
    scheduled_start,
    scheduled_end,
    meeting_times
  } = req.body;

  // Validate required fields
  if (!name || !subject || !creator_id) {
    return res.status(400).json({ error: 'Name, subject, and creator ID are required' });
  }

  try {
    // Generate a unique invite code
    const invite_code = generateInviteCode();
    
    // Prepare group data
    const groupData = {
      name,
      description: description || '',
      subject,
      faculty: faculty || null,
      course: course || null,
      year_of_study: year_of_study || null,
      max_members: max_members || 10,
      is_private: is_private || false,
      creator_id,
      invite_code,
      status: 'active'
    };

    // Add scheduling data if this is a scheduled group
    if (is_scheduled) {
      groupData.is_scheduled = true;
      groupData.scheduled_start = scheduled_start;
      groupData.scheduled_end = scheduled_end;
      groupData.meeting_times = meeting_times;
      groupData.status = 'scheduled'; // Set status to scheduled initially
    }

    // Insert the new group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert(groupData)
      .select()
      .single();

    if (groupError) throw groupError;

    // Add the creator as the first member with 'creator' role
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: creator_id,
        role: 'creator',
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (membershipError) throw membershipError;

    // Return the created group with member count
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (countError) console.error('Error counting members:', countError);

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...group,
        member_count: memberCount || 1
      }
    });

  } catch (err) {
    console.error('Error creating group:', err);
    
    // Handle specific error cases
    if (err.code === '23505') { // Unique violation (likely duplicate invite code)
      // Retry with a new invite code
      return res.status(500).json({ error: 'Please try creating the group again' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Get all groups (including scheduled ones) - FIXED
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
          is_scheduled: group.is_scheduled || false,
          // Calculate current status for scheduled groups
          current_status: group.is_scheduled ? 
            (isScheduledGroupActive(group) ? 'active' : group.status) : 
            group.status
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

// Get all groups for a user - FIXED
router.get('/groups/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { status = 'active' } = req.query;

  try {
    // First get all groups the user is a member of
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id, role, status')
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (membershipsError) throw membershipsError;

    if (!memberships || memberships.length === 0) {
      return res.status(200).json({
        groups: [],
        count: 0
      });
    }

    const groupIds = memberships.map(m => m.group_id);

    // Now get the actual group details
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email)
      `)
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: groups, error: groupsError } = await query;

    if (groupsError) throw groupsError;

    // Process groups to include member count and user role
    const processedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        // Get member count
        const { count: memberCount, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('status', 'active');

        if (countError) console.error('Error counting members:', countError);

        // Get user's role in this group
        const membership = memberships.find(m => m.group_id === group.id);
        const user_role = membership ? membership.role : null;

        return {
          ...group,
          member_count: memberCount || 0,
          is_scheduled: group.is_scheduled || false,
          user_role: user_role,
          // Calculate current status for scheduled groups
          current_status: group.is_scheduled ? 
            (isScheduledGroupActive(group) ? 'active' : group.status) : 
            group.status
        };
      })
    );

    res.status(200).json({
      groups: processedGroups || [],
      count: processedGroups.length
    });
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get group members - NEW ENDPOINT
// Get group members - FIXED ENDPOINT
router.get('/groups/:group_id/members', async (req, res) => {
  const { group_id } = req.params;

  try {
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        status,
        joined_at,
        profiles:user_id (name, email, faculty, course, year_of_study)
      `)
      .eq('group_id', group_id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Format the response to include member details
    const formattedMembers = (members || []).map(member => ({
      member_id: member.user_id,
      name: member.profiles?.name || 'Unknown User',
      email: member.profiles?.email || '',
      faculty: member.profiles?.faculty || '',
      course: member.profiles?.course || '',
      year_of_study: member.profiles?.year_of_study || '',
      role: member.role,
      member_status: member.status, // Use the actual status field
      joined_at: member.joined_at
    }));

    res.status(200).json({
      members: formattedMembers,
      count: formattedMembers.length
    });
  } catch (err) {
    console.error('Error fetching group members:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update the join group endpoint in study-groups-api.js
router.post('/groups/:group_id/join', async (req, res) => {
  const { group_id } = req.params;
  const { user_id, invited_by = null } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // First get the group details to check if it's joinable
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Group not found' });
      }
      throw groupError;
    }

    // Check if group is joinable (active or scheduled but now active)
    const isJoinable = group.status === 'active' || 
                      (group.is_scheduled && isScheduledGroupActive(group));

    if (!isJoinable) {
      return res.status(400).json({ 
        error: 'This group is not currently accepting members' 
      });
    }

    // Check if group is private and requires invitation
    if (group.is_private && !invited_by) {
      // Check if user is connected to any group member
      const { data: connections, error: connectionsError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group_id)
        .eq('status', 'active');

      if (connectionsError) throw connectionsError;

      // Check if user has any connections in this group
      const hasConnection = connections && connections.length > 0;

      if (!hasConnection) {
        return res.status(403).json({ 
          error: 'Must be connected to a group member to join private groups' 
        });
      }
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingMembership && !membershipError) {
      return res.status(400).json({ 
        error: 'User is already a member of this group' 
      });
    }

    // Check if group has reached maximum capacity
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group_id)
      .eq('status', 'active');

    if (countError) throw countError;

    if (memberCount >= group.max_members) {
      return res.status(400).json({ 
        error: 'Group has reached maximum capacity' 
      });
    }

    // Join the group
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: group_id,
        user_id: user_id,
        role: 'member',
        status: 'active',
        invited_by: invited_by,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Successfully joined the group',
      membership: data
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
// Join group by invite code - FIXED to allow joining scheduled groups that are now active
// Update the join by code endpoint in study-groups-api.js
router.post('/groups/join-by-code', async (req, res) => {
  const { invite_code, user_id } = req.body;

  if (!invite_code || !user_id) {
    return res.status(400).json({ error: 'invite_code and user_id are required' });
  }

  try {
    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, name, status, is_scheduled, scheduled_start, scheduled_end, max_members, is_private')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invalid invite code' });
      }
      throw groupError;
    }

    // Check if group is joinable (active or scheduled but now active)
    const isJoinable = group.status === 'active' || 
                      (group.is_scheduled && isScheduledGroupActive(group));

    if (!isJoinable) {
      return res.status(400).json({ 
        error: 'This group is not currently accepting members' 
      });
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingMembership && !membershipError) {
      return res.status(400).json({ 
        error: 'You are already a member of this group' 
      });
    }

    // Check if group has reached maximum capacity
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (countError) throw countError;

    if (memberCount >= group.max_members) {
      return res.status(400).json({ 
        error: 'Group has reached maximum capacity' 
      });
    }

    // Join the group
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user_id,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

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
// Get group details by ID - FIXED to include current status for scheduled groups
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

    // Calculate current status for scheduled groups
    const current_status = data.is_scheduled ? 
      (isScheduledGroupActive(data) ? 'active' : data.status) : 
      data.status;

    res.status(200).json({
      group: {
        ...data,
        member_count: memberCount || 0,
        current_status: current_status
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

// Search/Find public groups - FIXED to include scheduled groups that are now active
router.get('/groups/search/public', async (req, res) => {
  const { subject, faculty, year_of_study, include_active_scheduled = true } = req.query;

  try {
    // First get all public groups that match the filters
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles!creator_id (name, email)
      `)
      .eq('is_private', false);

    // Apply filters if provided
    if (subject) query = query.eq('subject', subject);
    if (faculty) query = query.eq('faculty', faculty);
    if (year_of_study) query = query.eq('year_of_study', year_of_study);

    const { data: groups, error } = await query;

    if (error) throw error;

    // Process groups to include member count and filter by active status
    const processedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        // Get member count
        const { count: memberCount, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('status', 'active');

        if (countError) console.error('Error counting members:', countError);

        // Calculate current status for scheduled groups
        const current_status = group.is_scheduled ? 
          (isScheduledGroupActive(group) ? 'active' : group.status) : 
          group.status;

        return {
          ...group,
          member_count: memberCount || 0,
          current_status: current_status
        };
      })
    );

    // Filter groups based on current status
    const filteredGroups = processedGroups.filter(group => {
      // Always include active groups
      if (group.current_status === 'active') return true;
      
      // Include scheduled groups that are now active if requested
      if (include_active_scheduled && group.is_scheduled && isScheduledGroupActive(group)) {
        return true;
      }
      
      return false;
    });

    res.status(200).json({
      groups: filteredGroups || [],
      count: filteredGroups.length,
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