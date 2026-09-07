import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xtumfjgqjbbbfxsfymtn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dW1mamdxamJiYmZ4c2Z5bXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDcxMDgsImV4cCI6MjEwMjgyMzEwOH0.YBgzjA9pvXcvblLAVThXlvHzS6QptB0tDbtkCwAPIY0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
