import { Request, Response } from 'express';
import { basicEmailLogin } from '../services/auth.service';
import { getKeycloakToken } from '../middleware/auth.middleware';

export const emailLoginHandler = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await basicEmailLogin(email);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
};

export const getTokenHandler = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({
      error: 'Missing credentials',
      message: 'Username and password are required'
    });
    return;
  }
  
  try {
    const tokenData = await getKeycloakToken(username, password);
    
    res.status(200).json({
      success: true,
      message: 'Token retrieved successfully',
      data: {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope
      }
    });
  } catch (error: any) {
    console.error('Token retrieval error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password'
    });
  }
};
