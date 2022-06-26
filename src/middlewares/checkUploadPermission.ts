import { User } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';
import supabase from '../lib/supabase';

const checkUploadPermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // @ts-ignore
  const user: User = req.user;

  if (!user) {
    return res.sendStatus(401);
  }

  const {
    data: { isVerified },
    error,
  } = await supabase
    .from('users')
    .select('isVerified')
    .eq('id', user.id)
    .single();

  if (error) {
    return res.sendStatus(401);
  }

  if (!isVerified) {
    return res.sendStatus(401);
  }

  next();
};

export default checkUploadPermission;
