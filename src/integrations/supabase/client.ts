
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://szufbafdhfwqclyixdpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWZiYWZkaGZ3cWNseWl4ZHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMjg4NzksImV4cCI6MjA1MDgwNDg3OX0.ry4ch2QlWkkgxmM-7ppgUdsAPNB25n8MuimkeqT864M";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
