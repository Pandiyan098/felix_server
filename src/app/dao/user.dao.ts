import { supabase } from '../../config/supabase';

export const getUsersByGroup = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('entity_belongs_to', groupId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching users by group:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};
