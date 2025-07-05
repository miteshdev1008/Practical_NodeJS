const userRouter=require('express').Router();
const userController=require('../controllers/userController')
userRouter.post('/signup', userController.signup);
userRouter.get('/list', userController.listUsers);
userRouter.get('/access-cehcking', userController.checkModuleAccess);
userRouter.delete('/delete-user/:id', userController.deleteUser);
userRouter.get('/get-user/:id', userController.getUserById);
userRouter.put('/update-user/:id', userController.updateUser);
userRouter.put('/bulk-update-same', userController.bulkUpdateUsersSameData);
userRouter.put('/bulk-update-different', userController.bulkUpdateUsersDifferentData);
module.exports=userRouter