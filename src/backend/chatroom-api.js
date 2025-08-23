// chatroom-api.js (server-side)
const express = require('express');
const router = express.Router();
const { checkConnectionStatus } = require('./chatroom-api');
const { sendEmail } = require('./email-service');

// Middleware to verify if users can chat
router.post('/verify-chat-permission', async (req, res) => {
  try {
    const { currentUserId, targetUserId } = req.body;
    
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ 
        error: "Both user IDs are required" 
      });
    }
    
    // Check if target user exists in profiles
    const targetProfile = await getProfileById(targetUserId);
    if (!targetProfile) {
      return res.status(404).json({ 
        error: "The user you're trying to chat with doesn't exist",
        canChat: false
      });
    }
    
    // Check connection status
    const connectionStatus = await checkConnectionStatus(currentUserId, targetUserId);
    
    // Users can only chat if they're connected (status: 'accepted')
    if (connectionStatus.status === 'accepted') {
      return res.status(200).json({ 
        canChat: true,
        targetUser: targetProfile
      });
    } else {
      // Send notification emails if not connected
      const currentUserProfile = await getProfileById(currentUserId);
      
      // Email to current user
      await sendEmail(
        currentUserProfile.email,
        "Chat Request - Not Connected",
        `You tried to chat with ${targetProfile.name} but you're not connected yet. 
         Send them a connection request to start chatting.`
      );
      
      // Email to target user
      await sendEmail(
        targetProfile.email,
        "Someone Wants to Chat With You",
        `${currentUserProfile.name} tried to start a chat with you but you're not connected yet.
         Accept their connection request to start chatting.`
      );
      
      return res.status(403).json({ 
        canChat: false,
        message: "You need to be connected with this user to start chatting",
        connectionStatus: connectionStatus.status
      });
    }
  } catch (error) {
    console.error("Error verifying chat permission:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});