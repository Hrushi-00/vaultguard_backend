const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      user: {
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        is2FAEnabled: user.is2FAEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        is2FAEnabled: user.is2FAEnabled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password' });
  }
};

// Get 2FA setup QR code
exports.get2FASetup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `VaultGuard:${user.email}`,
      issuer: 'VaultGuard'
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate 2FA setup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enable 2FA
exports.enable2FA = async (req, res) => {
  try {
    const { code, secret } = req.body;

    if (!code || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Verification code and secret are required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 30 seconds clock skew
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA for user
    user.is2FAEnabled = true;
    user.twoFASecret = secret;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is2FAEnabled = false;
    user.twoFASecret = undefined;
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
