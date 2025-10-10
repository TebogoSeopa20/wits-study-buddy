require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const usersApi = require('./backend/users-api');
const connectionsApi = require('./backend/connections-api');
const studyGroupsApi = require('./backend/study-groups-api');
const notificationsApi = require('./backend/notifications-api');
const groupsApi = require('./backend/external-groups-api');
const chatApi = require('./backend/chat-api');
const remindersApi = require('./backend/reminders-api');
const activitiesApi = require('./backend/activities-api');
const progressApi = require('./backend/progress-api');
const messagesApi = require('./backend/chatting-api');

// Create the Express application
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Google OAuth Configuration
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PRODUCTION_REDIRECT_URL
  : 'http://localhost:3000/auth/google/callback';

  // Configure middleware FIRST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Then mount your API routes AFTER the middleware
app.use('/api', usersApi);
app.use('/api', connectionsApi);
app.use('/api', studyGroupsApi);
app.use('/api', notificationsApi);
app.use('/api', chatApi);
app.use('/api', activitiesApi);
app.use('/api', messagesApi);
app.use('/api/reminders', remindersApi);
app.use('/api/progress', progressApi);
app.use('/api/external', groupsApi);

// Serve all static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));
// Specifically serve HTML files from the html subdirectory
app.use(express.static(path.join(__dirname, 'frontend', 'html')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
}));

// Custom middleware for logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Custom middleware for serving CSS files with correct MIME type
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

// Helper function to get dashboard URL by role
// Helper function to get dashboard URL by role
function getDashboardUrlByRole(role) {
  const normalizedRole = role ? role.toLowerCase() : 'student';
  const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
    ? `https://${process.env.WEBSITE_HOSTNAME}`
    : 'http://localhost:3000');

  // In production, we need to include the /html path
  if (process.env.NODE_ENV === 'production') {
    switch (normalizedRole) {
      case 'tutor':
        return `${baseUrl}/html/tutor-dash.html`;
      case 'student':
      default:
        return `${baseUrl}/html/Student-dash.html`;
    }
  } else {
    // Local development
    switch (normalizedRole) {
      case 'tutor':
        return `${baseUrl}/tutor-dash.html`;
      case 'student':
      default:
        return `${baseUrl}/Student-dash.html`;
    }
  }
}

// AI Chat endpoint for study assistance
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use dynamic import for GoogleGenerativeAI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });

    const systemPrompt = `You are a professional Academic Tutor and Study Assistant for Wits Study Buddy app. 

Your role:
- Provide accurate, personalized academic assistance
- Help with math, science, programming, writing, and all academic subjects
- Explain complex concepts in simple terms
- Provide study strategies and learning tips
- Help with homework and research
- Be encouraging, professional, and easy to understand

Guidelines:
- Always prioritize educational value and accuracy
- Provide actionable, specific advice
- Explain concepts step by step
- Include examples when helpful
- Keep responses informative but concise
- Use a friendly but professional tone

Current context: ${context || "General academic assistance and study support"}

User question: ${message}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const aiMessage = response.text();

    res.json({
      message: aiMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    const fallbackResponses = {
      math: "I'd be happy to help with math problems! For algebra, remember to isolate the variable. For calculus, focus on understanding the fundamental concepts. Could you provide the specific problem you're working on?",
      science: "Science concepts can be complex but fascinating! Whether it's physics, chemistry, or biology, breaking down concepts into smaller parts helps understanding. What specific topic are you studying?",
      programming: "Programming requires practice and patience. Start with understanding the basics like variables, loops, and functions. Debugging is a normal part of the process. What language or concept are you working on?",
      study: "Effective studying involves active recall and spaced repetition. Try explaining concepts in your own words and take regular breaks using the Pomodoro technique (25 min study, 5 min break).",
      writing: "For academic writing, start with a clear thesis statement and outline. Make sure each paragraph supports your main argument with evidence. Proofread carefully for clarity and grammar.",
      default: "I'm here to help with your academic questions! Whether it's math, science, programming, or study strategies, I can provide explanations and guidance. What specific topic would you like help with?"
    };

    const userMessage = req.body.message?.toLowerCase() || '';
    let fallbackMessage = fallbackResponses.default;

    if (userMessage.includes('math') || userMessage.includes('calculate') || userMessage.includes('equation')) {
      fallbackMessage = fallbackResponses.math;
    } else if (userMessage.includes('science') || userMessage.includes('physics') || userMessage.includes('chemistry') || userMessage.includes('biology')) {
      fallbackMessage = fallbackResponses.science;
    } else if (userMessage.includes('programming') || userMessage.includes('code') || userMessage.includes('algorithm')) {
      fallbackMessage = fallbackResponses.programming;
    } else if (userMessage.includes('study') || userMessage.includes('learn') || userMessage.includes('memorize')) {
      fallbackMessage = fallbackResponses.study;
    } else if (userMessage.includes('writing') || userMessage.includes('essay') || userMessage.includes('thesis')) {
      fallbackMessage = fallbackResponses.writing;
    }

    res.json({
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
});

// URL scanning endpoint
app.post("/api/scan/url", async (req, res) => {
  try {
    let { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Auto-add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    console.log(`🔍 Scanning URL with Gemini AI: ${url}`);

    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });

    const prompt = `You are a cybersecurity expert analyzing URLs for security threats. 

URL to analyze: ${url}

Analyze this URL for security risks including phishing, malware, scams, and suspicious patterns.

IMPORTANT: Respond ONLY with valid JSON in this exact format. Do not include any other text, explanations, or markdown formatting:

{
  "safe": false,
  "threatLevel": "high",
  "threats": ["Suspicious domain pattern", "Potential phishing indicators"],
  "confidence": 85,
  "recommendations": ["Do not visit this URL", "Report as suspicious"],
  "category": "suspicious",
  "details": {
    "domainAnalysis": "Domain shows red flags",
    "contentRisks": "High risk of credential theft",
    "userAction": "avoid"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log("Gemini Raw Response:", analysisText);

    const analysis = parseGeminiResponse(analysisText, "url");

    res.json({
      type: "URL",
      target: url,
      timestamp: new Date().toISOString(),
      ...analysis,
    });
  } catch (error) {
    console.error("❌ Gemini URL Scan Error:", error);
    res.status(500).json({
      error: "Gemini AI service unavailable",
      message: error.message,
    });
  }
});

// Message scanning endpoint
app.post("/api/scan/message", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    console.log(`🔍 Scanning message with Gemini AI: ${content.substring(0, 100)}...`);

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });

    const prompt = `You are a cybersecurity expert analyzing messages for scams and threats.

Message to analyze: "${content}"

Analyze this message for security risks including phishing, scams, social engineering, and malicious intent.

IMPORTANT: Respond ONLY with valid JSON in this exact format. Do not include any other text, explanations, or markdown formatting:

{
  "safe": false,
  "threatLevel": "high", 
  "threats": ["Phishing attempt", "Credential harvesting"],
  "scamType": "Financial phishing scam",
  "confidence": 90,
  "recommendations": ["Do not click any links", "Delete this message", "Report as spam"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log("Gemini Raw Response:", analysisText);

    const analysis = parseGeminiResponse(analysisText, "message");

    res.json({
      type: "MESSAGE",
      content: content.substring(0, 500),
      timestamp: new Date().toISOString(),
      ...analysis,
    });
  } catch (error) {
    console.error("❌ Gemini Message Scan Error:", error);
    res.status(500).json({
      error: "Gemini AI service unavailable",
      message: error.message,
    });
  }
});

// Helper function to parse Gemini responses
function parseGeminiResponse(text, type = "url") {
  try {
    console.log("Raw Gemini Response:", text);

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, "");
    cleanText = cleanText.replace(/```\s*/g, "");
    cleanText = cleanText.replace(/^json\s*/g, "");

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanText);
    console.log("Parsed Gemini Response:", parsed);

    const result = {
      safe: typeof parsed.safe === "boolean" ? parsed.safe : false,
      threatLevel: parsed.threatLevel || "medium",
      threats: Array.isArray(parsed.threats)
        ? parsed.threats
        : ["Analysis incomplete"],
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 50,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ["Exercise caution"],
    };

    if (type === "url") {
      result.category = parsed.category || "suspicious";
      result.details = parsed.details || {
        domainAnalysis: "Unable to analyze domain",
        contentRisks: "Unknown risk level",
        userAction: "caution",
      };
    } else if (type === "message") {
      result.scamType = parsed.scamType || null;
    }

    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    console.error("Raw text was:", text);

    if (type === "url") {
      return {
        safe: false,
        threatLevel: "medium",
        threats: ["AI analysis failed - treating as potentially unsafe"],
        confidence: 30,
        recommendations: [
          "Exercise extreme caution",
          "Manual security review recommended",
          "Do not enter sensitive information",
        ],
        category: "suspicious",
        details: {
          domainAnalysis: "Unable to analyze due to parsing error",
          contentRisks: "Unknown - proceed with caution",
          userAction: "caution",
        },
      };
    } else {
      return {
        safe: false,
        threatLevel: "medium",
        threats: ["AI analysis failed - treating as potentially unsafe"],
        scamType: "Unknown - analysis incomplete",
        confidence: 30,
        recommendations: [
          "Exercise caution",
          "Manual review recommended",
          "Do not respond to suspicious messages",
        ],
      };
    }
  }
}

// Market and Points System Endpoints

// User points data storage (in production, use Supabase)
let userPoints = {
    'user123': {
        points: 1250,
        redeemedDiscounts: [],
        activeDiscounts: []
    }
};

// Local businesses data
const localBusinesses = [
    {
        id: 'coffee-corner',
        name: 'Coffee Corner',
        category: 'food',
        discount: '15% OFF',
        pointsCost: 500,
        description: 'Valid on all drinks and pastries. Expires in 30 days.',
        location: '123 Main St',
        distance: '0.5mi',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&fit=crop'
    },
    {
        id: 'book-nook',
        name: 'Book Nook',
        category: 'retail',
        discount: '20% OFF',
        pointsCost: 800,
        description: 'Valid on all books and merchandise. Expires in 45 days.',
        location: '456 Oak Ave',
        distance: '0.8mi',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop'
    },
    {
        id: 'fit-life',
        name: 'Fit Life Gym',
        category: 'services',
        discount: '1 Month FREE',
        pointsCost: 1500,
        description: 'Valid for new members. Includes all amenities.',
        location: '789 Fitness Rd',
        distance: '1.2mi',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop'
    },
    {
        id: 'pasta-paradise',
        name: 'Pasta Paradise',
        category: 'food',
        discount: '25% OFF',
        pointsCost: 1000,
        description: 'Valid for parties up to 4. Excludes alcohol.',
        location: '321 Italian Way',
        distance: '0.3mi',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop'
    },
    {
        id: 'cineplex',
        name: 'Cineplex Theater',
        category: 'entertainment',
        discount: '2 Tickets + Popcorn',
        pointsCost: 1200,
        description: 'Valid any day except holidays. Includes regular popcorn.',
        location: '555 Cinema Blvd',
        distance: '2.1mi',
        rating: 4.3,
        image: 'https://images.unsplash.com/photo-1489599809519-364a47ae3cde?w=300&h=200&fit=crop'
    },
    {
        id: 'style-studio',
        name: 'Style Studio',
        category: 'services',
        discount: '30% OFF',
        pointsCost: 600,
        description: 'Valid on haircuts and styling. Expires in 60 days.',
        location: '234 Beauty Ave',
        distance: '0.7mi',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop'
    }
];

// GET user points
app.get('/api/market/points', (req, res) => {
    const userId = req.query.userId || 'user123'; // In production, use authentication
    const user = userPoints[userId] || { points: 0, redeemedDiscounts: [], activeDiscounts: [] };
    
    res.json({
        points: user.points,
        redeemedCount: user.redeemedDiscounts.length,
        activeCount: user.activeDiscounts.length,
        discountValue: (user.points * 0.10).toFixed(2)
    });
});

// GET local businesses
app.get('/api/market/businesses', (req, res) => {
    const category = req.query.category;
    let businesses = localBusinesses;
    
    if (category && category !== 'all') {
        businesses = localBusinesses.filter(business => business.category === category);
    }
    
    res.json(businesses);
});

// POST redeem discount
app.post('/api/market/redeem', (req, res) => {
    const { userId, businessId, pointsCost } = req.body;
    const user = userPoints[userId || 'user123'];
    
    if (!user) {
        userPoints[userId || 'user123'] = {
            points: 0,
            redeemedDiscounts: [],
            activeDiscounts: []
        };
    }
    
    const currentUser = userPoints[userId || 'user123'];
    
    if (currentUser.points < pointsCost) {
        return res.status(400).json({ error: 'Insufficient points' });
    }
    
    const business = localBusinesses.find(b => b.id === businessId);
    if (!business) {
        return res.status(404).json({ error: 'Business not found' });
    }
    
    // Generate unique discount code
    const discountCode = `FIN${Math.floor(1000 + Math.random() * 9000)}${businessId.slice(0, 3).toUpperCase()}`;
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const discount = {
        id: Date.now().toString(),
        businessId,
        businessName: business.name,
        discount: business.discount,
        code: discountCode,
        pointsCost,
        redeemedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        status: 'active'
    };
    
    // Update user points and discounts
    currentUser.points -= pointsCost;
    currentUser.activeDiscounts.push(discount);
    currentUser.redeemedDiscounts.push(discount);
    
    res.json({
        success: true,
        newPoints: currentUser.points,
        discount: discount
    });
});

// GET user active discounts
app.get('/api/market/discounts', (req, res) => {
    const userId = req.query.userId || 'user123';
    const user = userPoints[userId];
    
    if (!user) {
        return res.json({ discounts: [] });
    }
    
    // Filter out expired discounts
    const now = new Date();
    user.activeDiscounts = user.activeDiscounts.filter(discount => 
        new Date(discount.expiresAt) > now
    );
    
    res.json({ discounts: user.activeDiscounts });
});

// POST add points from challenges
app.post('/api/market/add-points', (req, res) => {
    const { userId, points, challengeId } = req.body;
    const user = userPoints[userId || 'user123'];
    
    if (!user) {
        userPoints[userId || 'user123'] = {
            points: points,
            redeemedDiscounts: [],
            activeDiscounts: []
        };
    } else {
        user.points += points;
    }
    
    // Log the points addition for analytics
    console.log(`Added ${points} points to user ${userId} for challenge ${challengeId}`);
    
    res.json({ 
        success: true, 
        newPoints: userPoints[userId || 'user123'].points 
    });
});

// GET market analytics for businesses
app.get('/api/market/analytics', (req, res) => {
    // This would provide data to businesses about redemption rates, etc.
    const analytics = {
        totalRedemptions: Object.values(userPoints).reduce((total, user) => 
            total + user.redeemedDiscounts.length, 0
        ),
        totalPointsInCirculation: Object.values(userPoints).reduce((total, user) => 
            total + user.points, 0
        ),
        popularBusinesses: localBusinesses.map(business => ({
            ...business,
            redemptions: Object.values(userPoints).reduce((total, user) => 
                total + user.redeemedDiscounts.filter(d => d.businessId === business.id).length, 0
            )
        })).sort((a, b) => b.redemptions - a.redemptions)
    };
    
    res.json(analytics);
});

// Serve market.html
app.get("/market", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "html", "market.html"));
});

// Google Auth Endpoints
app.get('/auth/google', (req, res) => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUrl);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'email profile');
  authUrl.searchParams.append('prompt', 'select_account');
  
  if (req.query.redirect) {
    req.session.redirectAfterLogin = req.query.redirect;
  }
  
  res.redirect(authUrl.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/login?error=google_auth_failed');
  }
  
  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUrl,
      grant_type: 'authorization_code'
    });
    
    // Get user info with the access token
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });
    
    const { email, name, picture, sub: googleId } = userInfoResponse.data;
    
    // Validate Wits University student email format
    const emailRegex = /^\d+@students\.wits\.ac\.za$/i;
    if (!emailRegex.test(email)) {
      return res.redirect('/login?error=invalid email domain, use your school email&message=Please use your Wits student email (student number@students.wits.ac.za)');
    }
    
    // Check if user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error(`Error checking for existing users: ${userError.message}`);
      return res.redirect('/login?error=server_error');
    }
    
    // Find user by email
    const existingUser = userData?.users?.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    // If user doesn't exist, store Google data and redirect to signup
    if (!existingUser) {
      const googleProfile = {
        email,
        name,
        picture,
        googleId
      };
      
      const token = jwt.sign(googleProfile, process.env.SESSION_SECRET, { expiresIn: '15m' });
      req.session.googleProfile = googleProfile;
      
      return res.redirect(`/signupGoogle?token=${token}`);
    }
    
    // Existing user: proceed with login
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });
    
    if (signInError) {
      return res.redirect('/login?error=login_failed');
    }
    
    const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: authToken,
      type: 'magiclink'
    });
    
    if (sessionError) {
      return res.redirect('/login?error=session_creation_failed');
    }
    
    // Store user data in session
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    
    // Prepare user data for client-side storage
    const userForClient = {
      ...sessionData.user,
      session: sessionData.session
    };
    
    const userRole = sessionData.user?.user_metadata?.role || 'student';
    const dashboardUrl = getDashboardUrlByRole(userRole);
    const redirectTo = req.session.redirectAfterLogin || dashboardUrl;
    delete req.session.redirectAfterLogin;
    
    // Encode user data for URL parameter
    const encodedUserData = encodeURIComponent(JSON.stringify(userForClient));
    
    console.log(`Redirecting to: ${redirectTo}`);
    return res.redirect(`${redirectTo}?success=true&userData=${encodedUserData}`);
  } catch (error) {
    console.error(`Google auth error: ${error.message}`);
    return res.redirect('/login?error=google_auth_error');
  }
});

// Google Signup Endpoints
app.get('/signupGoogle', (req, res) => {
  if (req.query.token) {
    try {
      const googleProfile = jwt.verify(req.query.token, process.env.SESSION_SECRET);
      req.session.googleProfile = googleProfile;
      return res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html'));
    } catch (err) {
      return res.redirect('/login?error=invalid_token');
    }
  }
  
  if (!req.session.googleProfile) {
    return res.redirect('/login?error=missing_google_profile');
  }
  
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html'));
});

app.post('/api/signup-google', async (req, res) => {
  try {
    if (!req.session.googleProfile) {
      return res.status(400).json({ message: 'Google profile data not found. Please try logging in with Google again.' });
    }
    
    const googleProfile = req.session.googleProfile;
    const { 
      role,
      faculty,
      course,
      year_of_study,
      phone,
      terms_agreed
    } = req.body;
    
    // Basic validation
    const errors = {};
    
    if (!role) errors.role = 'Role is required';
    if (!faculty) errors.faculty = 'Faculty is required';
    if (!course) errors.course = 'Course is required';
    if (!year_of_study) errors.year_of_study = 'Year of study is required';
    if (!phone) errors.phone = 'Phone number is required';
    if (!terms_agreed) errors.terms_agreed = 'You must agree to the terms';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Extract student number from email
    const studentNumber = googleProfile.email.split('@')[0];
    
    // Create a random password
    const randomPassword = Math.random().toString(36).slice(-10);
    
    // Create user metadata
    const userMetadata = {
      name: googleProfile.name,
      email: googleProfile.email,
      googleId: googleProfile.googleId,
      picture: googleProfile.picture,
      role,
      authProvider: 'google',
      studentNumber,
      phone
    };
    
    // Create new user in Supabase
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: googleProfile.email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: userMetadata
    });
    
    if (createError) {
      console.error(`Error creating user from Google signup: ${createError.message}`);
      return res.status(400).json({ message: createError.message });
    }
    
    // Create profile in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        role,
        name: googleProfile.name,
        email: googleProfile.email,
        phone,
        faculty,
        course,
        year_of_study,
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error(`Error creating profile: ${profileError.message}`);
      return res.status(400).json({ message: profileError.message });
    }
    
    // Sign in the user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: googleProfile.email
    });
    
    if (signInError) {
      return res.status(400).json({ message: signInError.message });
    }
    
    const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: authToken,
      type: 'magiclink'
    });
    
    if (sessionError) {
      return res.status(400).json({ message: sessionError.message });
    }
    
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    delete req.session.googleProfile;
    
    const redirectUrl = getDashboardUrlByRole(role);
    
    return res.status(201).json({ 
      message: 'Account created successfully!', 
      user: newUser.user,
      redirectUrl
    });
  } catch (error) {
    console.error(`Google signup error: ${error.message}`);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Regular Signup Endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      confirmPassword, 
      phone,
      role,
      faculty,
      course,
      year_of_study,
      terms_agreed
    } = req.body;
    
    // Basic validation
    const errors = {};
    
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!role) errors.role = 'Role is required';
    if (!faculty) errors.faculty = 'Faculty is required';
    if (!course) errors.course = 'Course is required';
    if (!year_of_study) errors.year_of_study = 'Year of study is required';
    if (!phone) errors.phone = 'Phone number is required';
    if (!terms_agreed) errors.terms_agreed = 'You must agree to the terms';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if email already exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return res.status(500).json({ message: 'Error checking for existing users' });
    }
    
    const emailExists = userData?.users?.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (emailExists) {
      return res.status(409).json({ 
        message: 'This email is already registered. Please use a different email or login with your existing account.',
        errors: { email: 'Email already registered' }
      });
    }
    
    // Create user metadata
    const userMetadata = {
      name,
      email,
      role,
      phone
    };
    
    // Get the base URL for the redirect
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://' + req.get('host')
      : `${req.protocol}://${req.get('host')}`;
    
    // Create user in auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo: `${baseUrl}/login?verified=true`
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ 
          message: 'This email is already registered.',
          errors: { email: 'Email already registered' }
        });
      }
      return res.status(400).json({ message: error.message });
    }
    
    if (!data?.user) {
      return res.status(500).json({ message: 'No user data returned from signup process' });
    }
    
    // Create profile in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: data.user.id,
        role,
        name,
        email,
        phone,
        faculty,
        course,
        year_of_study,
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error(`Error creating profile: ${profileError.message}`);
      return res.status(400).json({ message: profileError.message });
    }
    
    return res.status(201).json({ 
      message: 'Account created successfully. Please check your email to verify your account.', 
      user: data.user,
      emailConfirmationRequired: true
    });
  } catch (error) {
    console.error(`Signup error: ${error.message}`);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return res.status(403).json({ 
          message: 'Please confirm your email address before logging in.',
          emailVerified: false
        });
      }
      return res.status(400).json({ message: error.message });
    }
    
    req.session.user = data.user;
    req.session.access_token = data.session.access_token;
    req.session.refresh_token = data.session.refresh_token;
    
    const userRole = data.user?.user_metadata?.role || 'student';
    const dashboardUrl = getDashboardUrlByRole(userRole);
    
    return res.status(200).json({ 
      message: 'Login successful', 
      user: data.user,
      session: data.session,
      redirectUrl: dashboardUrl
    });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Logout Endpoint
app.post('/api/logout', async (req, res) => {
  try {
    const accessToken = req.session.access_token;
    
    if (accessToken) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase logout error:", error);
        return res.status(400).json({ message: error.message });
      }
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'An error occurred during logout' });
  }
});

// Auth Status Endpoint
app.get('/api/auth/status', (req, res) => {
  if (req.session.user && req.session.access_token) {
    return res.status(200).json({ 
      authenticated: true, 
      user: req.session.user 
    });
  }
  return res.status(200).json({ authenticated: false });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'landing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});