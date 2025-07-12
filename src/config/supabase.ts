import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the profile table interface
export interface Profile {
  id?: string;
  username: string;
  email: string;
  password: string;
  public_key: string;
  secret_key: string;
  role: string;
  entity_belongs: string;
  entity_admin_name: string;
  created_at?: string;
  updated_at?: string;
} 