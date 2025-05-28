// import express from 'express';
// import authenticate from '../../middlewares/authMiddleware.js';
// import { checkAdminStatus, getAdminPermissions, getAllAdmins, getRoles, inviteAdmin, removeAdmin, updateAdminRoles, deleteAdmin, registerInvitedAdmin,  } from '../../controllers/admin/admin.controller.js';
// import { adminAuth } from '../../middlewares/adminAuth.js';


// const adminManagementrouter = express.Router();

// adminManagementrouter.post('/', registerInvitedAdmin);

// adminManagementrouter.use(authenticate);
// adminManagementrouter.use(adminAuth);

// adminManagementrouter.post('/invite', inviteAdmin);

// adminManagementrouter.get('/', getAllAdmins);

// adminManagementrouter.get('/roles', getRoles);

// // adminManagementrouter.post('/', registerInvitedAdmin)

// adminManagementrouter.post('/', registerInvitedAdmin);

// adminManagementrouter.put('/:userId/roles', updateAdminRoles);

// adminManagementrouter.get('/status', checkAdminStatus);

// adminManagementrouter.get('/permissions', getAdminPermissions);

// adminManagementrouter.delete('/:id', deleteAdmin);

// export default adminManagementrouter;


import express from 'express';
import authenticate from '../../middlewares/authMiddleware.js';
import { 
    registerInvitedAdmin, 
    checkAdminStatus, 
    getAdminPermissions, 
    getAllAdmins, 
    getRoles, 
    inviteAdmin, 
    removeAdmin, 
    updateAdminRoles,
    deleteAdmin 
} from '../../controllers/admin/admin.controller.js';
import{ getAllTransactions,
    getTransactionDetails,
    retryFailedPayment,
    processRefund} from  '../../controllers/admin/adminpaymanage.controller.js'
import { adminAuth } from '../../middlewares/adminAuth.js';

const adminManagementRouter = express.Router();

// Public route - no authentication required
adminManagementRouter.post('/register', registerInvitedAdmin);

// Apply authentication to all following routes
adminManagementRouter.use(authenticate);

// Routes that require both authentication AND admin privileges
adminManagementRouter.use(adminAuth);
adminManagementRouter.post('/invite', inviteAdmin);
adminManagementRouter.get('/', getAllAdmins);
adminManagementRouter.get('/roles', getRoles);
adminManagementRouter.put('/:userId/roles', updateAdminRoles);

// Routes that only require authentication (not necessarily admin)
adminManagementRouter.get('/status', checkAdminStatus);
adminManagementRouter.get('/permissions', getAdminPermissions);

adminManagementRouter.delete('/:id', deleteAdmin);

adminManagementRouter.get("/transactions", getAllTransactions);
adminManagementRouter.get("/transactions/:id", getTransactionDetails);
adminManagementRouter.post("/transactions/:transactionId/retry", retryFailedPayment);
adminManagementRouter.post("/transactions/:transactionId/refund", processRefund);

export default adminManagementRouter;