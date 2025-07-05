const roleRouter=require('express').Router();
const roleController=require('../controllers/roleController')
roleRouter.post('/create', roleController.createRole);
roleRouter.get('/list', roleController.getAllRoles);
roleRouter.delete('/delete-role/:id', roleController.deleteRole);
roleRouter.get('/get-role/:id', roleController.getRoleById);
roleRouter.put('/update-role/:id', roleController.updateRole);
module.exports=roleRouter