import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
