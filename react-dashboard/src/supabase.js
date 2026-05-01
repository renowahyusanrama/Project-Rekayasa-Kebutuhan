import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://cbzypguhnqxyswafzvie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNienlwZ3VobnF4eXN3YWZ6dmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzM0NjEsImV4cCI6MjA5MzIwOTQ2MX0.AupV6k3j3IbjwppBX6hiZ32xuEHRpS5vhqqa8clyQuQ"
)