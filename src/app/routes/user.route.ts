import express from "express";

import {createUser, fundWallet, addTrustline, sendBD, getUsersByGroup, getAllUsers} from '../controllers/user.controller';
import { validateRequest, createAccountSchema } from '../validations/validation.schemas';

const router = express.Router();


router.post('/users/create', validateRequest(createAccountSchema, 'body'), createUser);
router.post('/users/fund-wallet', fundWallet);
router.use("/users/add-trustline", addTrustline)
router.post('/users/send-bd', sendBD);
router.get('/users/group', getUsersByGroup);
router.get('/users', getAllUsers);

export default router;