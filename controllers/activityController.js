const Activity = require('../models/Activity');

// Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .populate('file', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedActivities = activities.map(activity => ({
      type: activity.type,
      user: activity.userAgent,
      time: activity.createdAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      file: activity.file ? activity.file.name : null
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create activity log
exports.createActivity = async (userId, type, fileId, req) => {
  try {
    await Activity.create({
      user: userId,
      type,
      file: fileId,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}; 