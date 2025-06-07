const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assume you have a User mongoose model
const { sendResetPasswordEmail } = require('../utils/email');

// Change password controller
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id; // Assuming you have user ID from JWT

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        errors: {
          currentPassword: !currentPassword ? 'Current password is required' : null,
          newPassword: !newPassword ? 'New password is required' : null,
          confirmPassword: !confirmPassword ? 'Confirm password is required' : null
        }
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
        errors: {
          confirmPassword: 'Passwords do not match'
        }
      });
    }

    // Find user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log('New password hash:', hashedPassword);
      console.log('New password hash length:', hashedPassword.length);
      
      // Update user with new password
      await User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true, runValidators: true }
      );
      
      // Get updated user
      const updatedUser = await User.findById(userId).select('+password');
      console.log('Updated password hash:', updatedUser.password);
      console.log('Updated password hash length:', updatedUser.password.length);
    } catch (error) {
      console.error('Password hashing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while hashing password'
      });
    }

    // Generate new token
    const token = user.getSignedJwtToken();

    // Prepare response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while changing password'
    });
  }
};

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
        message: 'Email not found',
        errors: { email: 'Email not found' }
      });
    }

    // Verify password
    try {
      console.log('Attempting password verification for user:', user.email);
      console.log('Stored password hash length:', user.password.length);
      
      const isMatch = await user.matchPassword(password);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        return res.status(400).json({ 
          success: false,
          message: 'Incorrect password',
          errors: { password: 'Incorrect password' }
        });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while verifying password'
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
    const { email, password, fullName } = req.body;
    
    // Input validation
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email, password, and full name',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          fullName: !fullName ? 'Full name is required' : null
        }
      });
    }

    // Validate email format
    if (!email.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address',
        errors: { email: 'Please provide a valid email address' }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered',
        errors: { email: 'Email already registered' }
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      fullName
    });

    // Generate token
    const token = user.getSignedJwtToken();

    // Prepare response
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.status(201).json({ 
      success: true,
      token,
      data: userWithoutPassword
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).reduce((acc, val) => {
          acc[val.path] = val.message;
          return acc;
        }, {})
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
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
      { expiresIn: '1h' } // Changed to 1 hour for security
    );

    // Send reset email
    try {
      await sendResetPasswordEmail(email, resetToken);
      
      // Update user with reset token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      res.status(200).json({ 
        success: true,
        message: 'Reset password email sent'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email',
        error: process.env.NODE_ENV === 'development' ? emailError.message : 'Email service error'
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request'
    });
  }
};
