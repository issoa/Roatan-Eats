import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lawspalqovdkmnyqczfm.supabase.co";
const supabaseAnonKey = "sb_publishable_AOIQdxBPc8XXFmNSIYH5eA_SWXbFjiJ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);