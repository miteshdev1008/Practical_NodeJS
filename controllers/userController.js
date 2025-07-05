const { default: mongoose } = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, phoneNumber, role } = req.body;

    if (!firstName || !lastName || !email || !username || !password || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input types' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

   if (!mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({ error: 'Invalid Role ID format' });
    }

    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({ error: 'Role does not exist' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: `^${email}$`, $options: 'i' } },
        { username: { $regex: `^${username}$`, $options: 'i' } },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      role,
      active: true,
    });

    const savedUser = await user.save();

    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        username: savedUser.username,
        role: savedUser.role,
        active: savedUser.active,
        createdAt: savedUser.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, active } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const users = await User.find(query)
      .populate('role', 'name accessModules')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
   
    const user = await User.findById(id).populate('role', 'name accessModules');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
     const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, password, phoneNumber, role, active } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName && typeof firstName !== 'string') {
      return res.status(400).json({ error: 'firstName must be a string' });
    }
    if (lastName && typeof lastName !== 'string') {
      return res.status(400).json({ error: 'lastName must be a string' });
    }
    if (email && typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }
    if (username && typeof username !== 'string') {
      return res.status(400).json({ error: 'username must be a string' });
    }
    if (password && (typeof password !== 'string' || password.length < 6)) {
      return res.status(400).json({ error: 'Password must be a string with at least 6 characters' });
    }
    if (phoneNumber && typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: 'phoneNumber must be a string' });
    }
    if (role && !role.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid role ID format' });
    }
    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email: { $regex: `^${email}$`, $options: 'i' },
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        username: { $regex: `^${username}$`, $options: 'i' },
        _id: { $ne: id },
      });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Role does not exist' });
      }
    }

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (username) updates.username = username;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (role) updates.role = role;
    if (active !== undefined) updates.active = active;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('role', 'name accessModules');

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user or role ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};


exports.checkModuleAccess = async (req, res) => {
  try {
    const {module,userId}=req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    if (!module || typeof module !== 'string') {
      return res.status(400).json({ error: 'Module must be a non-empty string' });
    }

    const user = await User.findById(userId).populate('role', 'accessModules');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    const hasAccess = user.role && user.role.accessModules.includes(module);
    
   if (!hasAccess) {
      return res.status(403).json({
        error: 'User does not have access to this module',
        userId,
        module,
        hasAccess: false,
      });
    }

    res.json({
      message: 'User has access to the module',
      userId,
      module,
      hasAccess: true,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.bulkUpdateUsersSameData = async (req, res) => {
  try {
    const { updates, filter } = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    // Validate updates
    if (updates.firstName && typeof updates.firstName !== 'string') {
      return res.status(400).json({ error: 'firstName must be a string' });
    }
    if (updates.lastName && typeof updates.lastName !== 'string') {
      return res.status(400).json({ error: 'lastName must be a string' });
    }
    if (updates.email && typeof updates.email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }
    if (updates.username && typeof updates.username !== 'string') {
      return res.status(400).json({ error: 'username must be a string' });
    }
    if (updates.password && (typeof updates.password !== 'string' || updates.password.length < 6)) {
      return res.status(400).json({ error: 'Password must be a string with at least 6 characters' });
    }
    if (updates.phoneNumber && typeof updates.phoneNumber !== 'string') {
      return res.status(400).json({ error: 'phoneNumber must be a string' });
    }
    if (updates.role && !updates.role.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid role ID format' });
    }
    if (updates.active !== undefined && typeof updates.active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }

    if (updates.email || updates.username) {
      return res.status(400).json({ error: 'Email or username updates not allowed in bulk update to avoid unique constraint conflicts' });
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    if (updates.role) {
      const roleExists = await Role.findById(updates.role);
      if (!roleExists) {
        return res.status(400).json({ error: 'Role does not exist' });
      }
    }

    const updateResult = await User.updateMany(filter || {}, { $set: updates }, { runValidators: true });

    res.json({
      message: 'Users updated successfully',
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.bulkUpdateUsersDifferentData = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates must be a non-empty array' });
    }

    const bulkOps = await Promise.all(updates.map(async update => {
      const { userId, data } = update;

      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      if (data.firstName && typeof data.firstName !== 'string') {
        throw new Error(`firstName must be a string for user: ${userId}`);
      }
      if (data.lastName && typeof data.lastName !== 'string') {
        throw new Error(`lastName must be a string for user: ${userId}`);
      }
      if (data.email && typeof data.email !== 'string') {
        throw new Error(`email must be a string for user: ${userId}`);
      }
      if (data.username && typeof data.username !== 'string') {
        throw new Error(`username must be a string for user: ${userId}`);
      }
      if (data.password && (typeof data.password !== 'string' || data.password.length < 6)) {
        throw new Error(`Password must be at least 6 characters for user: ${userId}`);
      }
      if (data.phoneNumber && typeof data.phoneNumber !== 'string') {
        throw new Error(`phoneNumber must be a string for user: ${userId}`);
      }
      if (data.role && !data.role.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid role ID format for user: ${userId}`);
      }
      if (data.active !== undefined && typeof data.active !== 'boolean') {
        throw new Error(`active must be a boolean for user: ${userId}`);
      }

      if (data.email && data.email !== user.email) {
        const existingEmail = await User.findOne({
          email: { $regex: `^${data.email}$`, $options: 'i' },
          _id: { $ne: userId },
        });
        if (existingEmail) {
          throw new Error(`Email already exists for user: ${userId}`);
        }
      }

      if (data.username && data.username !== user.username) {
        const existingUsername = await User.findOne({
          username: { $regex: `^${data.username}$`, $options: 'i' },
          _id: { $ne: userId },
        });
        if (existingUsername) {
          throw new Error(`Username already exists for user: ${userId}`);
        }
      }

      if (data.role) {
        const roleExists = await Role.findById(data.role);
        if (!roleExists) {
          throw new Error(`Role does not exist for user: ${userId}`);
        }
      }

      const updateData = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      return {
        updateOne: {
          filter: { _id: userId },
          update: { $set: updateData },
        },
      };
    }));

    const updateResult = await User.bulkWrite(bulkOps, { runValidators: true });

    res.json({
      message: 'Users updated successfully',
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
