// progress-api.js
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

// Helper function to get user ID from session
const getUserIdFromSession = (req) => {
  // Extract user from session storage (you'll need to send this from frontend)
  const userData = req.headers['x-user-data'];
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id;
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return null;
};

// Get all modules for current user
router.get('/modules', async (req, res) => {
  const userId = getUserIdFromSession(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data: modules, error } = await supabase
      .from('progress_modules')
      .select(`
        *,
        progress_topics(*),
        progress_milestones(*),
        progress_rewards(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the data to match the frontend structure
    const formattedModules = modules.map(module => ({
      id: module.id,
      name: module.name,
      color: module.color,
      topics: module.progress_topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        color: topic.color,
        completed: topic.completed,
        completed_at: topic.completed_at
      })),
      milestone: module.progress_milestones.length > 0 ? module.progress_milestones[0] : null,
      reward: module.progress_rewards.length > 0 ? module.progress_rewards[0] : null,
      createdAt: module.created_at,
      updatedAt: module.updated_at
    }));

    res.status(200).json({
      modules: formattedModules,
      count: formattedModules.length
    });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new module
router.post('/modules', async (req, res) => {
  const userId = getUserIdFromSession(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const {
    name,
    color = '#4A90E2',
    topics = [],
    milestone = null,
    reward = null
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Module name is required' });
  }

  try {
    // Start a transaction
    const { data: module, error: moduleError } = await supabase
      .from('progress_modules')
      .insert({
        user_id: userId,
        name: name.trim(),
        color: color
      })
      .select()
      .single();

    if (moduleError) throw moduleError;

    const moduleId = module.id;

    // Insert topics
    if (topics.length > 0) {
      const topicsData = topics.map((topic, index) => ({
        module_id: moduleId,
        name: topic.name.trim(),
        color: topic.color || generateTopicColor(color, index),
        completed: topic.completed || false
      }));

      const { error: topicsError } = await supabase
        .from('progress_topics')
        .insert(topicsData);

      if (topicsError) throw topicsError;
    }

    // Insert milestone if provided
    if (milestone && milestone.description) {
      const { error: milestoneError } = await supabase
        .from('progress_milestones')
        .insert({
          module_id: moduleId,
          description: milestone.description.trim(),
          start_date: milestone.start,
          end_date: milestone.end
        });

      if (milestoneError) throw milestoneError;
    }

    // Insert reward if provided
    if (reward && reward.description) {
      const { error: rewardError } = await supabase
        .from('progress_rewards')
        .insert({
          module_id: moduleId,
          description: reward.description.trim(),
          earned: false
        });

      if (rewardError) throw rewardError;
    }

    // Get the complete module data
    const { data: completeModule, error: fetchError } = await supabase
      .from('progress_modules')
      .select(`
        *,
        progress_topics(*),
        progress_milestones(*),
        progress_rewards(*)
      `)
      .eq('id', moduleId)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json({
      message: 'Module created successfully',
      module: formatModuleData(completeModule)
    });
  } catch (err) {
    console.error('Error creating module:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a module
router.put('/modules/:moduleId', async (req, res) => {
  const userId = getUserIdFromSession(req);
  const { moduleId } = req.params;
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const {
    name,
    color,
    topics = [],
    milestone = null,
    reward = null
  } = req.body;

  try {
    // Verify module ownership
    const { data: existingModule, error: verifyError } = await supabase
      .from('progress_modules')
      .select('id')
      .eq('id', moduleId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !existingModule) {
      return res.status(404).json({ error: 'Module not found or access denied' });
    }

    // Update module
    const { error: moduleError } = await supabase
      .from('progress_modules')
      .update({
        name: name?.trim(),
        color: color,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId);

    if (moduleError) throw moduleError;

    // Delete existing topics and recreate
    const { error: deleteTopicsError } = await supabase
      .from('progress_topics')
      .delete()
      .eq('module_id', moduleId);

    if (deleteTopicsError) throw deleteTopicsError;

    // Insert updated topics
    if (topics.length > 0) {
      const topicsData = topics.map((topic, index) => ({
        module_id: moduleId,
        name: topic.name.trim(),
        color: topic.color || generateTopicColor(color, index),
        completed: topic.completed || false,
        completed_at: topic.completed ? new Date().toISOString() : null
      }));

      const { error: topicsError } = await supabase
        .from('progress_topics')
        .insert(topicsData);

      if (topicsError) throw topicsError;
    }

    // Handle milestone
    const { error: deleteMilestoneError } = await supabase
      .from('progress_milestones')
      .delete()
      .eq('module_id', moduleId);

    if (deleteMilestoneError) throw deleteMilestoneError;

    if (milestone && milestone.description) {
      const { error: milestoneError } = await supabase
        .from('progress_milestones')
        .insert({
          module_id: moduleId,
          description: milestone.description.trim(),
          start_date: milestone.start,
          end_date: milestone.end
        });

      if (milestoneError) throw milestoneError;
    }

    // Handle reward
    const { error: deleteRewardError } = await supabase
      .from('progress_rewards')
      .delete()
      .eq('module_id', moduleId);

    if (deleteRewardError) throw deleteRewardError;

    if (reward && reward.description) {
      // Check if reward should be earned (all topics completed)
      const allCompleted = topics.every(topic => topic.completed);
      
      const { error: rewardError } = await supabase
        .from('progress_rewards')
        .insert({
          module_id: moduleId,
          description: reward.description.trim(),
          earned: allCompleted,
          earned_at: allCompleted ? new Date().toISOString() : null
        });

      if (rewardError) throw rewardError;
    }

    // Get updated module data
    const { data: updatedModule, error: fetchError } = await supabase
      .from('progress_modules')
      .select(`
        *,
        progress_topics(*),
        progress_milestones(*),
        progress_rewards(*)
      `)
      .eq('id', moduleId)
      .single();

    if (fetchError) throw fetchError;

    res.status(200).json({
      message: 'Module updated successfully',
      module: formatModuleData(updatedModule)
    });
  } catch (err) {
    console.error('Error updating module:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle topic completion
router.patch('/modules/:moduleId/topics/:topicId', async (req, res) => {
  const userId = getUserIdFromSession(req);
  const { moduleId, topicId } = req.params;
  const { completed } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed status is required' });
  }

  try {
    // Verify module ownership
    const { data: module, error: verifyError } = await supabase
      .from('progress_modules')
      .select('id')
      .eq('id', moduleId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !module) {
      return res.status(404).json({ error: 'Module not found or access denied' });
    }

    // Update topic completion
    const { data: topic, error: topicError } = await supabase
      .from('progress_topics')
      .update({
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (topicError) throw topicError;

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check if all topics are completed to earn reward
    const { data: allTopics, error: topicsError } = await supabase
      .from('progress_topics')
      .select('completed')
      .eq('module_id', moduleId);

    if (topicsError) throw topicsError;

    const allCompleted = allTopics.every(t => t.completed);
    
    if (allCompleted) {
      // Update reward status
      const { error: rewardError } = await supabase
        .from('progress_rewards')
        .update({
          earned: true,
          earned_at: new Date().toISOString()
        })
        .eq('module_id', moduleId);

      if (rewardError) throw rewardError;
    }

    res.status(200).json({
      message: `Topic marked as ${completed ? 'completed' : 'incomplete'}`,
      topic: topic
    });
  } catch (err) {
    console.error('Error updating topic:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a module
router.delete('/modules/:moduleId', async (req, res) => {
  const userId = getUserIdFromSession(req);
  const { moduleId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Verify module ownership
    const { data: module, error: verifyError } = await supabase
      .from('progress_modules')
      .select('id, name')
      .eq('id', moduleId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !module) {
      return res.status(404).json({ error: 'Module not found or access denied' });
    }

    // Delete module (cascade will delete topics, milestones, rewards)
    const { error: deleteError } = await supabase
      .from('progress_modules')
      .delete()
      .eq('id', moduleId);

    if (deleteError) throw deleteError;

    res.status(200).json({
      message: 'Module deleted successfully',
      moduleName: module.name
    });
  } catch (err) {
    console.error('Error deleting module:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get progress statistics
router.get('/stats', async (req, res) => {
  const userId = getUserIdFromSession(req);

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get all modules with topics
    const { data: modules, error } = await supabase
      .from('progress_modules')
      .select(`
        progress_topics(completed),
        progress_rewards(earned)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Calculate statistics
    let totalModules = modules.length;
    let totalTopics = 0;
    let completedTopics = 0;
    let earnedRewards = 0;

    modules.forEach(module => {
      totalTopics += module.progress_topics.length;
      completedTopics += module.progress_topics.filter(topic => topic.completed).length;
      earnedRewards += module.progress_rewards.filter(reward => reward.earned).length;
    });

    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    res.status(200).json({
      stats: {
        totalModules,
        totalTopics,
        completedTopics,
        earnedRewards,
        completionPercentage
      },
      analytics: {
        moduleCompletion: calculateModuleCompletion(modules),
        timeManagement: calculateTimeManagement(modules)
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search modules and topics
router.get('/search', async (req, res) => {
  const userId = getUserIdFromSession(req);
  const { q } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Search in modules
    const { data: modules, error: modulesError } = await supabase
      .from('progress_modules')
      .select(`
        *,
        progress_topics(*)
      `)
      .eq('user_id', userId)
      .ilike('name', `%${q}%`);

    if (modulesError) throw modulesError;

    // Search in topics
    const { data: topics, error: topicsError } = await supabase
      .from('progress_topics')
      .select(`
        *,
        progress_modules!inner(*)
      `)
      .ilike('name', `%${q}%`)
      .eq('progress_modules.user_id', userId);

    if (topicsError) throw topicsError;

    // Combine and format results
    const results = {
      modules: modules.map(module => formatModuleData(module)),
      topics: topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        completed: topic.completed,
        module: {
          id: topic.progress_modules.id,
          name: topic.progress_modules.name
        }
      }))
    };

    res.status(200).json({
      results: results,
      query: q,
      moduleCount: results.modules.length,
      topicCount: results.topics.length
    });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper functions
function formatModuleData(module) {
  return {
    id: module.id,
    name: module.name,
    color: module.color,
    topics: module.progress_topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      color: topic.color,
      completed: topic.completed,
      completed_at: topic.completed_at
    })),
    milestone: module.progress_milestones.length > 0 ? module.progress_milestones[0] : null,
    reward: module.progress_rewards.length > 0 ? module.progress_rewards[0] : null,
    createdAt: module.created_at,
    updatedAt: module.updated_at
  };
}

function generateTopicColor(moduleColor, index) {
  // Simple color variation based on index
  const baseColor = moduleColor.replace('#', '');
  const r = parseInt(baseColor.substr(0, 2), 16);
  const g = parseInt(baseColor.substr(2, 2), 16);
  const b = parseInt(baseColor.substr(4, 2), 16);
  
  const factor = (index % 5) * 20;
  const newR = Math.max(0, Math.min(255, r + factor));
  const newG = Math.max(0, Math.min(255, g + factor));
  const newB = Math.max(0, Math.min(255, b + factor));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function calculateModuleCompletion(modules) {
  return modules.map(module => {
    const total = module.progress_topics.length;
    const completed = module.progress_topics.filter(topic => topic.completed).length;
    return {
      moduleName: module.name,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      color: module.color
    };
  });
}

function calculateTimeManagement(modules) {
  // This would need milestone data for proper calculation
  // For now, return basic stats
  return {
    onTrack: modules.filter(module => {
      const completed = module.progress_topics.filter(topic => topic.completed).length;
      const total = module.progress_topics.length;
      return total > 0 && completed / total >= 0.5; // Simple heuristic
    }).length,
    total: modules.length
  };
}

module.exports = router;