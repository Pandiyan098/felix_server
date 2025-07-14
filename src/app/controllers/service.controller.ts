import { Request, Response } from 'express';
import * as ServiceService from '../services/service.service';

export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const data = await ServiceService.createServiceRequest(req.body);
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const proposeService = async (req: Request, res: Response) => {
  try {
    const data = await ServiceService.proposeService(req.body);
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const acceptProposal = async (req: Request, res: Response) => {
  try {
    const data = await ServiceService.acceptProposal(req.body);
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const payForService = async (req: Request, res: Response) => {
  try {
    const data = await ServiceService.payForService(req.body);
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};


export const getAllService = async (req: Request, res: Response) => {
  try {
    const data = await ServiceService.getAllService();
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};