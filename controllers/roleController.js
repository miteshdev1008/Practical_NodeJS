const { default: mongoose } = require('mongoose');
const Role=require('../models/Role');
const User = require('../models/User');

exports.createRole=async(req,res)=>{
        try {
            
        const { name, accessModules } = req.body;


        if (name && typeof name !== 'string') {
        return res.status(400).json({ error: 'Name must be a string' });
        }

        if (accessModules && !Array.isArray(accessModules)) {
        return res.status(400).json({ error: 'accessModules must be an array' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }
       
        const uniqueModules = accessModules ? [...new Set(accessModules)] : [];
        
        const role = new Role({
            name,
            accessModules: uniqueModules
        });

        await role.save();
        res.status(201).json({ message: 'Role created successfully', role });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        res.status(500).json({ error: error.message });
    }

}

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID format' });
    }

    const usersWithRole = await User.countDocuments({ role: id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role as it is assigned to users' 
      });
    }

    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid role ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

exports.getAllRoles=async(req,res)=>{
    try{
       const { search, page = 1, limit = 10, active } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
       
        
        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (active !== undefined) {
            query.active = active === 'true';
        }

        const roles = await Role.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await Role.countDocuments(query);

        res.json({
            roles,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getRoleById=async(req,res)=>{
    try {
          const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Role ID format' });
    }
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accessModules, active } = req.body;

    if(!name||!accessModules||!active||!id){
        return res.status(400).json({ error: 'Please fill in all fields' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Role ID format' });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    if (accessModules && !Array.isArray(accessModules)) {
      return res.status(400).json({ error: 'accessModules must be an array' });
    }
    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }

    if (name && name !== role.name) {
      const existingRole = await Role.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id }, 
      });
      if (existingRole) {
        return res.status(400).json({ error: 'Role name already exists' });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (accessModules) updates.accessModules = [...new Set(accessModules)]; // Remove duplicates
    if (active !== undefined) updates.active = active;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Role updated successfully',
      role: updatedRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid role ID' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};