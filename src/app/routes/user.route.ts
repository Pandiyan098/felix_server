import express from "express";

import {createUser, fundWallet, addTrustline, sendBD, getUsersByGroup} from '../controllers/user.controller';

const router = express.Router();


router.post('/users/create', createUser);
router.post('/users/fund-wallet', fundWallet);
router.use("/users/add-trustline", addTrustline)
router.post('/users/send-bd', sendBD);
router.get('/users/group', getUsersByGroup);

export default router;