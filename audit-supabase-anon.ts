import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqjiizwtfavpvxytqzvv.supabase.co';
const supabaseAnonKey = 'sb_publishable_Su1aBS5317eyJB5xnpjuPg_TwxkswXr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditDatabase() {
  try {
    console.log('=== SUPABASE DATABASE AUDIT ===\n');
    
    // Test connection
    const { data: health, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (healthError && healthError.code !== 'PGRST116') {
      throw healthError;
    }

    console.log('✅ Connected to Supabase');

    // Get profiles count
    const { count: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n👥 Total Profiles: ${profileCount}`);
    }

    // Sample profiles with sensitive columns
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, city, is_public, created_at')
      .limit(20);

    if (profileError) {
      console.log('❌ Could not fetch profiles:', profileError.message);
      return;
    }

    console.log(`\n📋 Sample Profiles (${profiles?.length || 0}):`);
    if (profiles && profiles.length > 0) {
      // Check for sensitive patterns
      const emails = profiles.filter(p => p.email).map(p => p.email);
      const testEmails = emails.filter(e => 
        e.includes('test') || e.includes('demo') || e.includes('example') || e.includes('dummy')
      );

      if (testEmails.length > 0) {
        console.log(`\n🧪 Test/Demo emails found (${testEmails.length}):`);
        testEmails.forEach(e => console.log(`  - ${e}`));
      }

      console.log('\n📊 Sample data:');
      profiles.slice(0, 5).forEach(p => {
        console.log(`  ${p.email || 'N/A'} | ${p.first_name || ''} ${p.last_name || ''} | ${p.city || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Audit error:', error);
  }
}

auditDatabase();
