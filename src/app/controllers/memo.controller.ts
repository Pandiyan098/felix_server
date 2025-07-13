import { Request, Response } from 'express';
import { createMemo, payForMemo } from '../services/memo.service';

export const createMemoHandler = async (req: Request, res: Response) => {
  try {
    const { creatorKey, memo, bdAmount, assetId, description, rating } = req.body;
    
    // Validate required fields
    if (!creatorKey || !memo || !bdAmount || !assetId) {
      return res.status(400).json({ 
        error: 'Missing required fields: creatorKey, memo, bdAmount, assetId' 
      });
    }

    const result = await createMemo(creatorKey, memo, bdAmount, assetId,description, rating );
    res.status(201).json(result);
  } catch (err) {
    console.error('Create memo error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const payForMemoHandler = async (req: Request, res: Response) => {
  try {
    console.log('Pay for memo request received:', {
      buyerSecret: req.body.buyerSecret ? '***' : 'missing',
      memoId: req.body.memoId
    });
    
    const { buyerSecret, memoId } = req.body;
    
    // Validate required fields
    if (!buyerSecret || !memoId) {
      return res.status(400).json({ 
        error: 'Missing required fields: buyerSecret, memoId' 
      });
    }

    // Validate memoId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(memoId)) {
      return res.status(400).json({ 
        error: 'Invalid memoId format. Must be a valid UUID.' 
      });
    }

    // Validate buyerSecret format (should start with 'S')
    if (!buyerSecret.startsWith('S')) {
      return res.status(400).json({ 
        error: 'Invalid buyerSecret format. Must be a valid Stellar secret key starting with S.' 
      });
    }

    console.log('Calling payForMemo service...');
    const result = await payForMemo(buyerSecret, memoId);
    console.log('Pay for memo successful:', result);
    res.json(result);
  } catch (err) {
    console.error('Pay for memo error:', err);
    
    // Return appropriate HTTP status based on error type
    if (err instanceof Error) {
      if (err.message.includes('Memo not found')) {
        return res.status(404).json({ error: err.message });
      } else if (err.message.includes('Invalid') || err.message.includes('Missing')) {
        return res.status(400).json({ error: err.message });
      } else if (err.message.includes('Insufficient') || err.message.includes('trustline')) {
        return res.status(400).json({ error: err.message });
      } else {
        return res.status(500).json({ error: err.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};
