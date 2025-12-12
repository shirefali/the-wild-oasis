import { createClient } from "@supabase/supabase-js";
export const supabaseUrl = "https://zfimlqexnjdmbrimygyb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaW1scWV4bmpkbWJyaW15Z3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODIzMDUsImV4cCI6MjA3ODg1ODMwNX0.1PRo7k_OsHxDfQ_ctu5W4Pfj-7jcuAid0RG5J6mPmpc";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
