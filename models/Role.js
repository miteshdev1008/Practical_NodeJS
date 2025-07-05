const mongoose=require('mongoose');

const roleSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
     accessModules: [{
        type: String,
        trim: true
    }],
      createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
})

roleSchema.index ({name:1,accessModules:1})

const Role=mongoose.model('Role',roleSchema)
module.exports=Role;