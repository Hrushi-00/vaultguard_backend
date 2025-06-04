const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assume you have a User mongoose model
const { sendResetPasswordEmail } = require('../utils/email');

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials',
        errors: { email: 'Email not found' }
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials',
        errors: { password: 'Incorrect password' }
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    // Prepare response
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.status(200).json({ 
      success: true,
      token,
      user: { 
        id: userWithoutPassword._id,
        email: userWithoutPassword.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred during login'
    });
  }
};

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    // Input validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          confirmPassword: !confirmPassword ? 'Confirm password is required' : null
        }
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match',
        errors: { confirmPassword: 'Passwords do not match' }
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists',
        errors: { email: 'Email already registered' }
      });
    }

    // Create new user
    const user = new User({ email, password });
    await user.save();

    // Prepare response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred during signup'
    });
  }
};

// Forgot password controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email',
        errors: { email: 'Email is required' }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists with this email, a reset link will be sent'
      });
    }

    // Create reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await sendResetPasswordEmail(email, resetToken);

    res.status(200).json({ 
      success: true,
      message: 'Reset password email sent'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while sending reset email'
    });
  }
};
