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
// CRITICAL OPTIMIZATION: Singleton Gemini Client
// ============================================
let geminiClient = null;
let GoogleGenerativeAI = null;

const initializeGemini = async () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
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
  }
  return geminiClient;
};

// Initialize immediately
initializeGemini().catch(console.error);

// Supabase clients (singleton)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

// Google OAuth
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PRODUCTION_REDIRECT_URL
  : 'http://localhost:3000/auth/google/callback';

// ============================================
// OPTIMIZED MIDDLEWARE
// ============================================
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 86400000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
}));

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

// Static files with caching
app.use(express.static(path.join(__dirname, 'frontend'), { maxAge: '1d' }));
app.use(express.static(path.join(__dirname, 'frontend', 'html'), { maxAge: '1d' }));

// Minimal logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// CSS MIME type
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) res.type('text/css');
  next();
});

// ============================================
// 🚀 ULTRA-FAST AI CHAT WITH STREAMING
// ============================================
app.post("/api/chat", async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  // Set SSE headers immediately
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  try {
    const model = await initializeGemini();

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
// 🚀 ULTRA-FAST URL SCANNING
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

// ============================================
// 🚀 ULTRA-FAST MESSAGE SCANNING
// ============================================
app.post("/api/scan/message", async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: "Content required" });

  try {
    const model = await initializeGemini();

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
// MARKET ENDPOINTS (Unchanged)
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
// AUTH ENDPOINTS (Optimized)
// ============================================
function getDashboardUrl(role) {
  const r = (role || 'student').toLowerCase();
  const base = process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
    ? `https://${process.env.WEBSITE_HOSTNAME}` : 'http://localhost:3000');
  
  if (process.env.NODE_ENV === 'production') {
    return r === 'tutor' ? `${base}/html/tutor-dash.html` : `${base}/html/Student-dash.html`;
  }
  return r === 'tutor' ? `${base}/tutor-dash.html` : `${base}/Student-dash.html`;
}

app.get('/auth/google', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUrl);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'email profile');
  url.searchParams.append('prompt', 'select_account');
  
  if (req.query.redirect) req.session.redirectAfterLogin = req.query.redirect;
  
  res.redirect(url.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  if (!req.query.code) return res.redirect('/login?error=google_auth_failed');
  
  try {
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
    
    if (!/^\d+@students\.wits\.ac\.za$/i.test(email)) {
      return res.redirect('/login?error=invalid_email');
    }
    
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!existing) {
      const profile = { email, name, picture, googleId };
      const token = jwt.sign(profile, process.env.SESSION_SECRET, { expiresIn: '15m' });
      req.session.googleProfile = profile;
      return res.redirect(`/signupGoogle?token=${token}`);
    }
    
    const { data: signInData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    
    const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
    const { data: sessionData } = await supabase.auth.verifyOtp({
      token_hash: authToken,
      type: 'magiclink'
    });
    
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    
    const role = sessionData.user?.user_metadata?.role || 'student';
    const redirectTo = req.session.redirectAfterLogin || getDashboardUrl(role);
    delete req.session.redirectAfterLogin;
    
    const userData2 = encodeURIComponent(JSON.stringify({ ...sessionData.user, session: sessionData.session }));
    res.redirect(`${redirectTo}?success=true&userData=${userData2}`);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

app.get('/signupGoogle', (req, res) => {
  if (req.query.token) {
    try {
      req.session.googleProfile = jwt.verify(req.query.token, process.env.SESSION_SECRET);
    } catch {
      return res.redirect('/login?error=invalid_token');
    }
  }
  
  if (!req.session.googleProfile) return res.redirect('/login?error=missing_profile');
  
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
  
  if (error) return res.status(400).json({ message: error.message });
  
  await supabaseAdmin.from('profiles').insert({
    user_id: newUser.user.id,
    role, name: profile.name, email: profile.email, phone,
    faculty, course, year_of_study,
    terms_agreed: true,
    terms_agreed_at: new Date().toISOString()
  });
  
  const { data: signInData } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email
  });
  
  const authToken = new URL(signInData.properties.action_link).searchParams.get('token');
  const { data: sessionData } = await supabase.auth.verifyOtp({
    token_hash: authToken,
    type: 'magiclink'
  });
  
  req.session.user = sessionData.user;
  req.session.access_token = sessionData.session.access_token;
  req.session.refresh_token = sessionData.session.refresh_token;
  delete req.session.googleProfile;
  
  res.status(201).json({ 
    message: 'Account created', 
    user: newUser.user,
    redirectUrl: getDashboardUrl(role)
  });
});

app.post('/api/signup', async (req, res) => {
  const { name, email, password, confirmPassword, phone, role, faculty, course, year_of_study, terms_agreed } = req.body;
  
  if (!name || !email || !password || password.length < 8 || password !== confirmPassword || 
      !role || !faculty || !course || !year_of_study || !phone || !terms_agreed) {
    return res.status(400).json({ message: 'Validation failed' });
  }
  
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
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
  
  if (error) return res.status(400).json({ message: error.message });
  if (!data?.user) return res.status(500).json({ message: 'No user data' });
  
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
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return res.status(403).json({ message: 'Please confirm your email', emailVerified: false });
    }
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
});

app.post('/api/logout', async (req, res) => {
  if (req.session.access_token) {
    await supabase.auth.signOut();
  }
  
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
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
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'html', 'landing.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'html', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'html', 'signup.html')));
app.get('/market', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'html', 'market.html')));

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT} - ULTRA OPTIMIZED`);
});
