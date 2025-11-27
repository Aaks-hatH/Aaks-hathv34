import { createClient } from '@supabase/supabase-js'

// ⚠️ REPLACE THESE WITH YOUR KEYS FROM SUPABASE WEBSITE ⚠️
const SUPABASE_URL = "https://gdlvzfyvgmeyvlcgggix.supabase.co"
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbHZ6Znl2Z21leXZsY2dnZ2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjM1MjgsImV4cCI6MjA3OTczOTUyOH0.pLo8ziauVfdqRo3Vb-DR15lD904ybvD4zT-kDnZfi6o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const base44 = {
  entities: {
    GuestbookMessage: {
      list: async () => {
        const { data, error } = await supabase
          .from('guestbook')
          .select('*')
          .order('created_date', { ascending: false })
          .limit(50);
        return data || [];
      },
      create: async (payload) => {
        const { data, error } = await supabase
          .from('guestbook')
          .insert([{
            name: payload.name,
            message: payload.message
          }])
          .select();
        if (error) throw error;
        return data[0];
      }
    }
  }
};