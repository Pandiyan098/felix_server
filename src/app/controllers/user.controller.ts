import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserWithKeypair(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const fundWallet = async (req: Request, res: Response) => {
  try {
    const result = await userService.fundWallet(req.body.publicKey);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const addTrustline = async (req: Request, res: Response) => {
  try {
    const result = await userService.addTrustline(req.body.secretKey);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const sendBD = async (req: Request, res: Response) => {
  try {
    const result = await userService.sendBlueDollarToUser(req.body.publicKey, req.body.assetCode);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUsersByGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const result = await userService.getUsersByGroup(groupId as string);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
