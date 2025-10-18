require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Import routes
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

const app = express();

// ============================================
// ENVIRONMENT VARIABLES VALIDATION
// ============================================
console.log('🔧 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');

// Validate critical environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing Google OAuth environment variables');
}

// ============================================
// CRITICAL OPTIMIZATION: Singleton Gemini Client
// ============================================
let geminiClient = null;
let GoogleGenerativeAI = null;

const initializeGemini = async () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      if (!GoogleGenerativeAI) {
        const module = await import('@google/generative-ai');
        GoogleGenerativeAI = module.GoogleGenerativeAI;
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      geminiClient = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
      console.log('✅ Gemini client initialized');
    } catch (error) {
      console.error('❌ Gemini initialization failed:', error.message);
    }
  }
  return geminiClient;
};

// Initialize immediately
initializeGemini().catch(console.error);

// ============================================
// SUPABASE CLIENTS INITIALIZATION
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseAdmin, supabase;

try {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: { 
      autoRefreshToken: true, 
      persistSession: true, 
      detectSessionInUrl: false 
    }
  });

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { 
      autoRefreshToken: true, 
      persistSession: true, 
      detectSessionInUrl: false 
    }
  });
  console.log('✅ Supabase clients initialized successfully');
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error.message);
  // Create fallback clients without auth features
  supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================
// GOOGLE OAUTH CONFIGURATION
// ============================================
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PRODUCTION_REDIRECT_URL
  : 'http://localhost:3000/auth/google/callback';

console.log('🔐 OAuth Configuration:');
console.log('Redirect URL:', redirectUrl);
console.log('Client ID:', clientId ? 'Set' : 'Missing');

// ============================================
// OPTIMIZED MIDDLEWARE
// ============================================
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 86400000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS middleware for production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.header('Access-Control-Allow-Origin', process.env.BASE_URL);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Mount API routes
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

// ============================================
// STATIC FILE SERVING - PRODUCTION OPTIMIZED
// ============================================
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Running in PRODUCTION mode');
  // In production, serve all static files from frontend directory
  app.use(express.static(path.join(__dirname, 'frontend'), { 
    maxAge: '1d',
    index: false 
  }));
} else {
  console.log('💻 Running in DEVELOPMENT mode');
  // In development, use the /html subdirectory structure
  app.use(express.static(path.join(__dirname, 'frontend'), { maxAge: '1d' }));
  app.use(express.static(path.join(__dirname, 'frontend', 'html'), { maxAge: '1d' }));
}

// CSS MIME type fix
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) res.type('text/css');
  next();
});

// ============================================
// PRODUCTION HTML ROUTES - Serve from root
// ============================================
if (process.env.NODE_ENV === 'production') {
  // Serve main dashboard files
  app.get('/Student-dash.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'html', 'Student-dash.html'));
  });
  
  app.get('/tutor-dash.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'html', 'tutor-dash.html'));
  });

  // Serve all student pages
  const studentPages = [
    'student-participants', 'student-groups', 'student-chatroom', 
    'student-progress', 'student-calendar', 'student-weather', 
    'student-map', 'student-notifications', 'student-profile'
  ];

  studentPages.forEach(page => {
    app.get(`/${page}.html`, (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend', 'html', `${page}.html`));
    });
  });

  // Serve tutor pages
  const tutorPages = [
    'tutor-participants', 'tutor-groups', 'tutor-chatroom',
    'tutor-progress', 'tutor-calendar', 'tutor-sessions'
  ];

  tutorPages.forEach(page => {
    app.get(`/${page}.html`, (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend', 'html', `${page}.html`));
    });
  });
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    baseUrl: process.env.BASE_URL,
    supabase: process.env.SUPABASE_URL ? 'Configured' : 'Missing'
  });
});

// ============================================
// AI CHAT ENDPOINT
// ============================================
app.post("/api/chat", async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  try {
    const model = await initializeGemini();
    
    if (!model) {
      return res.status(503).json({ error: "AI service temporarily unavailable" });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const prompt = `You are a professional Academic Tutor for Wits Study Buddy.

Role: Provide accurate academic assistance in math, science, programming, writing, and all subjects.

Guidelines:
- Explain concepts clearly and concisely
- Provide step-by-step solutions
- Be encouraging and professional
- Keep responses focused and actionable

Context: ${context || "General academic support"}
Question: ${message}`;

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error("AI Error:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      const fallback = getFallbackMessage(message);
      res.write(`data: ${JSON.stringify({ chunk: fallback, fallback: true })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
});

// ============================================
// SECURITY SCANNING ENDPOINTS
// ============================================
app.post("/api/scan/url", async (req, res) => {
  let { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL required" });

  if (!url.startsWith('http')) url = 'https://' + url;

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const model = await initializeGemini();
    
    if (!model) {
      return res.status(503).json({ error: "AI service unavailable" });
    }

    const prompt = `Analyze this URL for security threats: ${url}

Respond with ONLY valid JSON:
{
  "safe": false,
  "threatLevel": "high",
  "threats": ["threat1", "threat2"],
  "confidence": 85,
  "recommendations": ["action1", "action2"],
  "category": "suspicious",
  "details": {
    "domainAnalysis": "analysis",
    "contentRisks": "risks",
    "userAction": "avoid"
  }
}`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const analysis = parseJSON(text, "url");

    res.json({
      type: "URL",
      target: url,
      timestamp: new Date().toISOString(),
      ...analysis
    });
  } catch (error) {
    console.error("URL Scan Error:", error);
    res.status(500).json({ error: "Scan failed", message: error.message });
  }
});

app.post("/api/scan/message", async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: "Content required" });

  try {
    const model = await initializeGemini();
    
    if (!model) {
      return res.status(503).json({ error: "AI service unavailable" });
    }

    const prompt = `Analyze this message for scams: "${content}"

Respond with ONLY valid JSON:
{
  "safe": false,
  "threatLevel": "high",
  "threats": ["threat1"],
  "scamType": "phishing",
  "confidence": 90,
  "recommendations": ["action1"]
}`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const analysis = parseJSON(text, "message");

    res.json({
      type: "MESSAGE",
      content: content.substring(0, 500),
      timestamp: new Date().toISOString(),
      ...analysis
    });
  } catch (error) {
    console.error("Message Scan Error:", error);
    res.status(500).json({ error: "Scan failed" });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function parseJSON(text, type) {
  try {
    let clean = text.trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^json\s*/g, "");

    const match = clean.match(/\{[\s\S]*\}/);
    if (match) clean = match[0];

    const parsed = JSON.parse(clean);

    return {
      safe: parsed.safe ?? false,
      threatLevel: parsed.threatLevel || "medium",
      threats: Array.isArray(parsed.threats) ? parsed.threats : ["Analysis incomplete"],
      confidence: parsed.confidence ?? 50,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ["Exercise caution"],
      ...(type === "url" ? {
        category: parsed.category || "suspicious",
        details: parsed.details || {
          domainAnalysis: "Unable to analyze",
          contentRisks: "Unknown",
          userAction: "caution"
        }
      } : {
        scamType: parsed.scamType || null
      })
    };
  } catch (error) {
    console.error("Parse error:", error);
    return {
      safe: false,
      threatLevel: "medium",
      threats: ["Analysis failed"],
      confidence: 30,
      recommendations: ["Exercise caution"],
      ...(type === "url" ? {
        category: "suspicious",
        details: {
          domainAnalysis: "Parse error",
          contentRisks: "Unknown",
          userAction: "caution"
        }
      } : {
        scamType: "Unknown"
      })
    };
  }
}

function getFallbackMessage(msg) {
  const m = msg.toLowerCase();
  if (m.includes('math')) return "I can help with math! What problem are you working on?";
  if (m.includes('science')) return "Science questions? I'm here to help explain concepts!";
  if (m.includes('code') || m.includes('programming')) return "Programming help available! What are you building?";
  if (m.includes('study')) return "Study tips: Use active recall and spaced repetition!";
  if (m.includes('writing')) return "Writing help: Start with a clear thesis and outline!";
  return "I'm here to help with your academic questions!";
}

// ============================================
// MARKET ENDPOINTS
// ============================================
let userPoints = { 'user123': { points: 1250, redeemedDiscounts: [], activeDiscounts: [] } };

const localBusinesses = [
  {
    id: 'coffee-corner', name: 'Coffee Corner', category: 'food', discount: '15% OFF',
    pointsCost: 500, description: 'Valid on all drinks', location: '123 Main St',
    distance: '0.5mi', rating: 4.7, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&fit=crop'
  }
];

app.get('/api/market/points', (req, res) => {
  const userId = req.query.userId || 'user123';
  const user = userPoints[userId] || { points: 0, redeemedDiscounts: [], activeDiscounts: [] };
  res.json({
    points: user.points,
    redeemedCount: user.redeemedDiscounts.length,
    activeCount: user.activeDiscounts.length,
    discountValue: (user.points * 0.10).toFixed(2)
  });
});

app.get('/api/market/businesses', (req, res) => {
  const category = req.query.category;
  res.json(category && category !== 'all' 
    ? localBusinesses.filter(b => b.category === category)
    : localBusinesses
  );
});

app.post('/api/market/redeem', (req, res) => {
  const { userId, businessId, pointsCost } = req.body;
  
  if (!userPoints[userId || 'user123']) {
    userPoints[userId || 'user123'] = { points: 0, redeemedDiscounts: [], activeDiscounts: [] };
  }
  
  const user = userPoints[userId || 'user123'];
  
  if (user.points < pointsCost) {
    return res.status(400).json({ error: 'Insufficient points' });
  }
  
  const business = localBusinesses.find(b => b.id === businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  
  const code = `FIN${Math.floor(1000 + Math.random() * 9000)}${businessId.slice(0, 3).toUpperCase()}`;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  
  const discount = {
    id: Date.now().toString(),
    businessId,
    businessName: business.name,
    discount: business.discount,
    code,
    pointsCost,
    redeemedAt: new Date().toISOString(),
    expiresAt: expiry.toISOString(),
    status: 'active'
  };
  
  user.points -= pointsCost;
  user.activeDiscounts.push(discount);
  user.redeemedDiscounts.push(discount);
  
  res.json({ success: true, newPoints: user.points, discount });
});

app.get('/api/market/discounts', (req, res) => {
  const userId = req.query.userId || 'user123';
  const user = userPoints[userId];
  
  if (!user) return res.json({ discounts: [] });
  
  const now = new Date();
  user.activeDiscounts = user.activeDiscounts.filter(d => new Date(d.expiresAt) > now);
  
  res.json({ discounts: user.activeDiscounts });
});

app.post('/api/market/add-points', (req, res) => {
  const { userId, points } = req.body;
  
  if (!userPoints[userId || 'user123']) {
    userPoints[userId || 'user123'] = { points, redeemedDiscounts: [], activeDiscounts: [] };
  } else {
    userPoints[userId || 'user123'].points += points;
  }
  
  res.json({ success: true, newPoints: userPoints[userId || 'user123'].points });
});

app.get('/api/market/analytics', (req, res) => {
  res.json({
    totalRedemptions: Object.values(userPoints).reduce((t, u) => t + u.redeemedDiscounts.length, 0),
    totalPointsInCirculation: Object.values(userPoints).reduce((t, u) => t + u.points, 0),
    popularBusinesses: localBusinesses.map(b => ({
      ...b,
      redemptions: Object.values(userPoints).reduce((t, u) => 
        t + u.redeemedDiscounts.filter(d => d.businessId === b.id).length, 0
      )
    })).sort((a, b) => b.redemptions - a.redemptions)
  });
});

// ============================================
// FIXED DASHBOARD URL FUNCTION
// ============================================
function getDashboardUrl(role) {
  const r = (role || 'student').toLowerCase();
  
  // Use the BASE_URL from environment variables
  const base = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
    ? `https://${process.env.WEBSITE_HOSTNAME}` : 'http://localhost:3000');
  
  console.log(`📊 Dashboard URL for ${r}: ${base}`);
  
  // In production, serve from root, not /html subdirectory
  if (process.env.NODE_ENV === 'production') {
    return r === 'tutor' ? `${base}/tutor-dash.html` : `${base}/Student-dash.html`;
  }
  // In development, use the /html path structure
  return r === 'tutor' ? `${base}/html/tutor-dash.html` : `${base}/html/Student-dash.html`;
}

// ============================================
// AUTH ENDPOINTS (OPTIMIZED)
// ============================================
app.get('/auth/google', (req, res) => {
  if (!clientId) {
    return res.redirect('/login?error=oauth_not_configured');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUrl);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'email profile');
  url.searchParams.append('prompt', 'select_account');
  
  if (req.query.redirect) {
    req.session.redirectAfterLogin = req.query.redirect;
  }
  
  console.log('🔐 Initiating Google OAuth:', url.toString());
  res.redirect(url.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  if (!req.query.code) {
    console.error('❌ Google OAuth callback missing code');
    return res.redirect('/login?error=google_auth_failed');
  }
  
  try {
    console.log('🔄 Processing Google OAuth callback...');
    
    const tokenResp = await axios.post('https://oauth2.googleapis.com/token', {
      code: req.query.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUrl,
      grant_type: 'authorization_code'
    });
    
    const userResp = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResp.data.access_token}` }
    });
    
    const { email, name, picture, sub: googleId } = userResp.data;
    console.log(`👤 Google user: ${email} - ${name}`);
    
    if (!/^\d+@students\.wits\.ac\.za$/i.test(email)) {
      console.error('❌ Invalid email domain:', email);
      return res.redirect('/login?error=invalid_email');
    }
    
    // Check if user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Supabase user list error:', userError);
      throw userError;
    }
    
    const existing = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!existing) {
      console.log('🆕 New user, redirecting to signup');
      const profile = { email, name, picture, googleId };
      const token = jwt.sign(profile, process.env.SESSION_SECRET, { expiresIn: '15m' });
      req.session.googleProfile = profile;
      return res.redirect(`/signupGoogle?token=${token}`);
    }
    
    console.log('✅ Existing user, generating login link');
    const { data: signInData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    
    if (linkError) {
      console.error('❌ Supabase link generation error:', linkError);
      throw linkError;
    }
    
    const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: authToken,
      type: 'magiclink'
    });
    
    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      throw sessionError;
    }
    
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    
    const role = sessionData.user?.user_metadata?.role || 'student';
    let redirectTo = req.session.redirectAfterLogin || getDashboardUrl(role);
    
    // Ensure correct URL format in production
    if (process.env.NODE_ENV === 'production') {
      redirectTo = redirectTo.replace('/html/', '/');
    }
    
    delete req.session.redirectAfterLogin;
    
    const userData2 = encodeURIComponent(JSON.stringify({ 
      ...sessionData.user, 
      session: sessionData.session 
    }));
    
    console.log(`🔄 Redirecting to: ${redirectTo}`);
    res.redirect(`${redirectTo}?success=true&userData=${userData2}`);
    
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

app.get('/signupGoogle', (req, res) => {
  if (req.query.token) {
    try {
      req.session.googleProfile = jwt.verify(req.query.token, process.env.SESSION_SECRET);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return res.redirect('/login?error=invalid_token');
    }
  }
  
  if (!req.session.googleProfile) {
    return res.redirect('/login?error=missing_profile');
  }
  
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html'));
});

app.post('/api/signup-google', async (req, res) => {
  if (!req.session.googleProfile) {
    return res.status(400).json({ message: 'Google profile not found' });
  }
  
  const profile = req.session.googleProfile;
  const { role, faculty, course, year_of_study, phone, terms_agreed } = req.body;
  
  if (!role || !faculty || !course || !year_of_study || !phone || !terms_agreed) {
    return res.status(400).json({ message: 'All fields required' });
  }
  
  try {
    const studentNumber = profile.email.split('@')[0];
    const randomPass = Math.random().toString(36).slice(-10);
    
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      password: randomPass,
      email_confirm: true,
      user_metadata: {
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        picture: profile.picture,
        role,
        authProvider: 'google',
        studentNumber,
        phone
      }
    });
    
    if (error) {
      console.error('❌ User creation error:', error);
      return res.status(400).json({ message: error.message });
    }
    
    await supabaseAdmin.from('profiles').insert({
      user_id: newUser.user.id,
      role, 
      name: profile.name, 
      email: profile.email, 
      phone,
      faculty, 
      course, 
      year_of_study,
      terms_agreed: true,
      terms_agreed_at: new Date().toISOString()
    });
    
    const { data: signInData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email
    });
    
    if (linkError) {
      console.error('❌ Link generation error:', linkError);
      throw linkError;
    }
    
    const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: authToken,
      type: 'magiclink'
    });
    
    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      throw sessionError;
    }
    
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    delete req.session.googleProfile;
    
    res.status(201).json({ 
      message: 'Account created', 
      user: newUser.user,
      redirectUrl: getDashboardUrl(role)
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Account creation failed' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { name, email, password, confirmPassword, phone, role, faculty, course, year_of_study, terms_agreed } = req.body;
  
  if (!name || !email || !password || password.length < 8 || password !== confirmPassword || 
      !role || !faculty || !course || !year_of_study || !phone || !terms_agreed) {
    return res.status(400).json({ message: 'Validation failed' });
  }
  
  try {
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ User list error:', listError);
      throw listError;
    }
    
    if (userData?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://' + req.get('host')
      : `${req.protocol}://${req.get('host')}`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, email, role, phone },
        emailRedirectTo: `${baseUrl}/login?verified=true`
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error);
      return res.status(400).json({ message: error.message });
    }
    
    if (!data?.user) {
      return res.status(500).json({ message: 'No user data' });
    }
    
    await supabaseAdmin.from('profiles').insert({
      user_id: data.user.id,
      role, name, email, phone, faculty, course, year_of_study,
      terms_agreed: true,
      terms_agreed_at: new Date().toISOString()
    });
    
    res.status(201).json({ 
      message: 'Account created. Check email to verify.', 
      user: data.user,
      emailConfirmationRequired: true
    });
    
  } catch (error) {
    console.error('❌ Signup process error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return res.status(403).json({ message: 'Please confirm your email', emailVerified: false });
      }
      console.error('❌ Login error:', error);
      return res.status(400).json({ message: error.message });
    }
    
    req.session.user = data.user;
    req.session.access_token = data.session.access_token;
    req.session.refresh_token = data.session.refresh_token;
    
    res.json({ 
      message: 'Login successful', 
      user: data.user,
      session: data.session,
      redirectUrl: getDashboardUrl(data.user?.user_metadata?.role)
    });
    
  } catch (error) {
    console.error('❌ Login process error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    if (req.session.access_token) {
      await supabase.auth.signOut();
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Session destruction error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out' });
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json(req.session.user && req.session.access_token 
    ? { authenticated: true, user: req.session.user }
    : { authenticated: false }
  );
});

// ============================================
// HTML ROUTES
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'landing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html'));
});

app.get('/market', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'market.html'));
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
  console.log(`🔐 OAuth Redirect: ${redirectUrl}`);
});