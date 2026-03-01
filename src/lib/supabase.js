import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// ATENÇÃO: Chaves injetadas diretamente conforme a sua versão do App.jsx que estava funcionando
const SUPABASE_URL = 'https://jgztripjipoexgqjtobv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnenRyaXBqaXBvZXhncWp0b2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzIwMTUsImV4cCI6MjA4NzY0ODAxNX0._ddznhD5y1IV7oT5BCDMph3fbRasgv0CA5C678qIAvI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
