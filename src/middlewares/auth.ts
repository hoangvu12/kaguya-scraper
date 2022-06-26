import { NextFunction, Request, Response } from 'express';
import supabase from '../lib/supabase';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  const { user } = await supabase.auth.api.getUser(token);

  if (!user) return res.sendStatus(401);

  // @ts-ignore
  req.user = user;

  next();
};

export default auth;
