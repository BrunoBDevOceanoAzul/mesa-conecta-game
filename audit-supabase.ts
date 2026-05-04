import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqjiizwtfavpvxytqzvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxamlpendsZmF2cHZ4eXRxenZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzkzMDM0NSwiZXhwIjoyMDMzNTA2MzQ1fQ.EcZDjWFR9HKXlR3X9yKS4c-zKXYU3pE3BibmBLquGLs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditDatabase() {
  try {
    // Get all profiles and check for duplicates
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, phone, is_public, created_at')
      .limit(100);

    if (profileError) throw profileError;

    console.log('\n📋 Sample Profiles (first 100):');
    console.log(`Total profiles: ${profiles?.length || 0}`);
    
    if (profiles && profiles.length > 0) {
      // Check for test/duplicate data
      const emailCounts: Record<string, number> = {};
      profiles.forEach((p: any) => {
        if (p.email) {
          emailCounts[p.email] = (emailCounts[p.email] || 0) + 1;
        }
      });

      const duplicateEmails = Object.entries(emailCounts)
        .filter(([_, count]) => count > 1)
        .map(([email]) => email);

      if (duplicateEmails.length > 0) {
        console.log(`\n⚠️  Duplicate emails found (${duplicateEmails.length}):`);
        duplicateEmails.forEach(email => console.log(`  - ${email}`));
      }

      // Check for test data
      const testProfiles = profiles.filter((p: any) => 
        p.email?.includes('test') || 
        p.email?.includes('demo') ||
        p.email?.includes('example')
      );

      if (testProfiles.length > 0) {
        console.log(`\n🧪 Test/Demo profiles found (${testProfiles.length}):`);
        testProfiles.forEach((p: any) => console.log(`  - ${p.email}`));
      }
    }

    // Check table sizes with raw SQL via Supabase
    const { data: tableSizes } = await supabase.rpc('get_table_sizes') as any;
    if (tableSizes) {
      console.log('\n📊 Table Sizes:');
      console.log(tableSizes);
    }

  } catch (error) {
    console.error('Audit error:', error);
  }
}

auditDatabase();
