// external-groups-api.js
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

// Get all public studygroups with creator information
router.get('/studygroups', async (req, res) => {
  const { page = 1, limit = 20, status = 'active', is_scheduled } = req.query;
  const offset = (page - 1) * limit;
  const limitInt = parseInt(limit);

  try {
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `, { count: 'exact' })
      .eq('is_private', false)
      .range(offset, offset + limitInt - 1)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply scheduled filter if provided
    if (is_scheduled !== undefined) {
      query = query.eq('is_scheduled', is_scheduled === 'true');
    }

    const { data: studygroups, error, count } = await query;

    if (error) throw error;

    // For each studygroup, get member details
    const studygroupsWithMembers = await Promise.all(
      (studygroups || []).map(async (studygroup) => {
        try {
          const { data: members, error: membersError } = await supabase
            .rpc('get_group_members_details', {
              target_group_id: studygroup.id
            });

          if (membersError) {
            console.error(`Error fetching members for studygroup ${studygroup.id}:`, membersError);
            // Fallback: get basic member count if RPC fails
            const { count: memberCount } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', studygroup.id)
              .eq('status', 'active')
              .catch(() => ({ count: 0 }));

            return { 
              ...studygroup, 
              members: [],
              member_count: memberCount || 0
            };
          }

          return { 
            ...studygroup, 
            members: members || [],
            member_count: members ? members.length : 0
          };
        } catch (err) {
          console.error(`Error processing studygroup ${studygroup.id}:`, err);
          return { 
            ...studygroup, 
            members: [],
            member_count: 0
          };
        }
      })
    );

    res.status(200).json({
      studygroups: studygroupsWithMembers,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitInt)
      }
    });
  } catch (err) {
    console.error('Error fetching studygroups:', err);
    res.status(500).json({ error: 'Failed to fetch studygroups' });
  }
});

// Get studygroup by ID with detailed information
router.get('/studygroups/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get studygroup details with creator information
    const { data: studygroup, error: studygroupError } = await supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `)
      .eq('id', id)
      .eq('is_private', false)
      .single();

    if (studygroupError) {
      if (studygroupError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Studygroup not found' });
      }
      throw studygroupError;
    }

    // Get member details
    let members = [];
    try {
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_group_members_details', {
          target_group_id: id
        });

      if (membersError) {
        console.error('Error fetching members via RPC, using fallback:', membersError);
        // Fallback: get basic member list
        const { data: fallbackMembers } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles (name, email, faculty, course, year_of_study),
            role,
            status,
            joined_at
          `)
          .eq('group_id', id)
          .eq('status', 'active')
          .catch(() => ({ data: [] }));

        members = fallbackMembers || [];
      } else {
        members = membersData || [];
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      members = [];
    }

    res.status(200).json({
      studygroup: {
        ...studygroup,
        members: members,
        member_count: members.length
      }
    });
  } catch (err) {
    console.error('Error fetching studygroup details:', err);
    res.status(500).json({ error: 'Failed to fetch studygroup details' });
  }
});

// Search studygroups with filters
router.get('/studygroups/search', async (req, res) => {
  const {
    subject,
    faculty,
    course,
    year_of_study,
    is_scheduled,
    page = 1,
    limit = 20
  } = req.query;
  
  const offset = (page - 1) * limit;
  const limitInt = parseInt(limit);

  try {
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `, { count: 'exact' })
      .eq('is_private', false)
      .eq('status', 'active')
      .range(offset, offset + limitInt - 1)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (subject) query = query.ilike('subject', `%${subject}%`);
    if (faculty) query = query.ilike('faculty', `%${faculty}%`);
    if (course) query = query.ilike('course', `%${course}%`);
    if (year_of_study) query = query.eq('year_of_study', year_of_study);
    if (is_scheduled !== undefined) {
      query = query.eq('is_scheduled', is_scheduled === 'true');
    }

    const { data: studygroups, error, count } = await query;

    if (error) throw error;

    // For each studygroup, get basic member count (not full details for performance)
    const studygroupsWithMemberCount = await Promise.all(
      (studygroups || []).map(async (studygroup) => {
        try {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', studygroup.id)
            .eq('status', 'active');

          if (countError) {
            console.error(`Error counting members for studygroup ${studygroup.id}:`, countError);
            return { ...studygroup, member_count: 0 };
          }

          return { ...studygroup, member_count: count || 0 };
        } catch (err) {
          console.error(`Error processing studygroup ${studygroup.id}:`, err);
          return { ...studygroup, member_count: 0 };
        }
      })
    );

    res.status(200).json({
      studygroups: studygroupsWithMemberCount,
      filters: {
        subject: subject || null,
        faculty: faculty || null,
        course: course || null,
        year_of_study: year_of_study || null,
        is_scheduled: is_scheduled || null
      },
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitInt)
      }
    });
  } catch (err) {
    console.error('Error searching studygroups:', err);
    res.status(500).json({ error: 'Failed to search studygroups' });
  }
});

// Get studygroups by faculty
router.get('/studygroups/faculty/:faculty', async (req, res) => {
  const { faculty } = req.params;
  const { is_scheduled, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const limitInt = parseInt(limit);

  try {
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `, { count: 'exact' })
      .eq('is_private', false)
      .eq('status', 'active')
      .ilike('faculty', `%${faculty}%`)
      .range(offset, offset + limitInt - 1)
      .order('created_at', { ascending: false });

    // Apply scheduled filter if provided
    if (is_scheduled !== undefined) {
      query = query.eq('is_scheduled', is_scheduled === 'true');
    }

    const { data: studygroups, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      studygroups: studygroups || [],
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitInt)
      }
    });
  } catch (err) {
    console.error('Error fetching studygroups by faculty:', err);
    res.status(500).json({ error: 'Failed to fetch studygroups by faculty' });
  }
});

// Get studygroups by subject
router.get('/studygroups/subject/:subject', async (req, res) => {
  const { subject } = req.params;
  const { is_scheduled, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const limitInt = parseInt(limit);

  try {
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `, { count: 'exact' })
      .eq('is_private', false)
      .eq('status', 'active')
      .ilike('subject', `%${subject}%`)
      .range(offset, offset + limitInt - 1)
      .order('created_at', { ascending: false });

    // Apply scheduled filter if provided
    if (is_scheduled !== undefined) {
      query = query.eq('is_scheduled', is_scheduled === 'true');
    }

    const { data: studygroups, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      studygroups: studygroups || [],
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitInt)
      }
    });
  } catch (err) {
    console.error('Error fetching studygroups by subject:', err);
    res.status(500).json({ error: 'Failed to fetch studygroups by subject' });
  }
});

// Get upcoming scheduled study groups (FIXED VERSION)
router.get('/studygroups/scheduled/upcoming', async (req, res) => {
  const { days_ahead = 7, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const daysAheadInt = parseInt(days_ahead);
  const limitInt = parseInt(limit);

  try {
    // Get current date and future date based on days_ahead
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + daysAheadInt * 24 * 60 * 60 * 1000).toISOString();

    // Query for scheduled groups that start within the specified timeframe
    const { data: studygroups, error, count } = await supabase
      .from('study_groups')
      .select(`
        *,
        profiles:creator_id (name, email, faculty, course, year_of_study)
      `, { count: 'exact' })
      .eq('is_private', false)
      .eq('is_scheduled', true)
      .in('status', ['scheduled', 'active'])
      .gte('scheduled_start', now)
      .lte('scheduled_start', futureDate)
      .range(offset, offset + limitInt - 1)
      .order('scheduled_start', { ascending: true });

    if (error) throw error;

    // For each studygroup, get member count
    const studygroupsWithMemberCount = await Promise.all(
      (studygroups || []).map(async (studygroup) => {
        try {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', studygroup.id)
            .eq('status', 'active');

          if (countError) {
            console.error(`Error counting members for studygroup ${studygroup.id}:`, countError);
            return { ...studygroup, member_count: 0 };
          }

          return { ...studygroup, member_count: count || 0 };
        } catch (err) {
          console.error(`Error processing studygroup ${studygroup.id}:`, err);
          return { ...studygroup, member_count: 0 };
        }
      })
    );

    res.status(200).json({
      studygroups: studygroupsWithMemberCount,
      days_ahead: daysAheadInt,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitInt)
      }
    });
  } catch (err) {
    console.error('Error fetching upcoming scheduled studygroups:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming scheduled studygroups' });
  }
});

module.exports = router;