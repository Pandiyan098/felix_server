import { supabase } from '../../config/supabase';

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1); // use limit to avoid `.single()` error

  if (error || !data || data.length === 0) {
    throw new Error('User not found');
  }

  return data[0];
};
