import { createClient } from '@supabase/supabase-js';

// LifeOS dedicated Supabase project (eu-central-1)
const SUPABASE_URL = 'https://gfkzvkwlbulwtoykugzw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kGmN-OfdXn1ihQVxfOhdRw_WybHqvh8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
