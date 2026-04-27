import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lawspalqovdkmnyqczfm.supabase.co';
const supabaseKey = 'sb_publishable_AOIQdxBPc8XXFmNSIYH5eA_SWXbFjiJ';

export const supabase = createClient(supabaseUrl, supabaseKey);
