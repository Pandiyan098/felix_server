import { Request, Response } from 'express';
import { basicEmailLogin } from '../services/auth.service';

export const emailLoginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await basicEmailLogin(email, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
};
