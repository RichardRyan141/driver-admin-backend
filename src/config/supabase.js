const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ekpzqfttqtmmolmjiycs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FkSxct78Dg1rxX_chkdQJg_HsWRnZiZ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
