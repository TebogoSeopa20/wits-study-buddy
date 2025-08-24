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

// Create the Express application
const app = express();
app.use('/api', connectionsApi); 

// Define absolute paths for frontend directories
const frontendPath = path.join(__dirname, 'frontend');
const htmlPath = path.join(frontendPath, 'html');

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
function getDashboardUrlByRole(role) {
  const normalizedRole = role ? role.toLowerCase() : 'student';
  const baseUrl = process.env.BASE_URL;
  
  switch (normalizedRole) {
    case 'tutor':
      return `${baseUrl}/tutor-dash.html`;
    case 'student':
    default:
      return `${baseUrl}/student-dash.html`;
  }
}


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
    
    req.session.user = sessionData.user;
    req.session.access_token = sessionData.session.access_token;
    req.session.refresh_token = sessionData.session.refresh_token;
    
    const userRole = sessionData.user?.user_metadata?.role || 'student';
    const dashboardUrl = getDashboardUrlByRole(userRole);
    const redirectTo = req.session.redirectAfterLogin || dashboardUrl;
    delete req.session.redirectAfterLogin;
    
    console.log(`Redirecting to: ${redirectTo}`);
    return res.redirect(redirectTo);
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
      return res.sendFile(path.join(htmlPath, 'signup.html'));
    } catch (err) {
      return res.redirect('/login?error=invalid_token');
    }
  }
  
  if (!req.session.googleProfile) {
    return res.redirect('/login?error=missing_google_profile');
  }
  
  res.sendFile(path.join(htmlPath, 'signup.html'));
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

// Serve HTML files using absolute paths
app.get('/', (req, res) => {
  res.sendFile(path.join(htmlPath, 'landing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(htmlPath, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(htmlPath, 'signup.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});