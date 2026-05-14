/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oiqptmuohdnvdtvklbnr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Wwhi7vrH-c31MlVNgngUdQ_H8WI1c-r';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
