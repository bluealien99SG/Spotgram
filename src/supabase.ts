import { createClient } from "@supabase/supabase-js";

// Safe fallback credentials directly from our environment configuration to prevent initial crashes
const fallbackUrl = "https://uopebbeywagytdriclko.supabase.co";
const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGViYmV5d2FneXRkcmljbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Mjk0MDIsImV4cCI6MjA5NTAwNTQwMn0.fpbJSSi1j2ONgpbhR5QCFeyHZdl9Ft21Ue5zq27CfKk";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || fallbackKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase connection parameters are missing in the environment. Using build fallback.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

