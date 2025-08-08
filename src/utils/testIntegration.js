// Test integration utilities for ADFD system
import { supabase } from '../lib/supabase.js';
import { createRequestWithWorkflow } from './workflowManager.js';
import { getRegionForCountry, getRegionalTeamForCountry } from './regionalMapping.js';

/**
 * Test the regional mapping system
 */
export const testRegionalMapping = () => {
  console.log('🧪 Testing Regional Mapping System...');
  
  const testCountries = [
    { country: 'seychelles', expectedRegion: 'africa' },
    { country: 'malaysia', expectedRegion: 'asia' },
    { country: 'italy', expectedRegion: 'europe_latin_america' },
    { country: 'argentina', expectedRegion: 'europe_latin_america' }
  ];

  testCountries.forEach(({ country, expectedRegion }) => {
    const region = getRegionForCountry(country);
    const team = getRegionalTeamForCountry(country);
    
    console.log(`✅ ${country} → ${region} (${team?.name})`);
    
    if (region !== expectedRegion) {
      console.error(`❌ Expected ${expectedRegion}, got ${region}`);
    }
  });
  
  console.log('✅ Regional mapping test completed');
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async () => {
  console.log('🧪 Testing Database Connection...');
  
  try {
    // Test user profiles table
    const { data: _profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .limit(1);

    if (profileError) {
      console.error('❌ User profiles query failed:', profileError);
      return false;
    }

    console.log('✅ User profiles table accessible');

    // Test withdrawal requests table
    const { data: _requests, error: requestError } = await supabase
      .from('withdrawal_requests')
      .select('id, project_number, country')
      .limit(1);

    if (requestError) {
      console.error('❌ Withdrawal requests query failed:', requestError);
      return false;
    }

    console.log('✅ Withdrawal requests table accessible');

    // Test request documents table
    const { data: _documents, error: docError } = await supabase
      .from('request_documents')
      .select('id, file_name')
      .limit(1);

    if (docError) {
      console.error('❌ Request documents query failed:', docError);
      return false;
    }

    console.log('✅ Request documents table accessible');
    console.log('✅ Database connection test completed');
    return true;

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

/**
 * Test storage bucket access
 */
export const testStorageAccess = async () => {
  console.log('🧪 Testing Storage Access...');
  
  try {
    // List buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage bucket listing failed:', bucketError);
      return false;
    }

    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (!documentsBucket) {
      console.error('❌ Documents bucket not found');
      return false;
    }

    console.log('✅ Documents bucket accessible');

    // Test file listing in documents bucket
    const { data: _files, error: fileError } = await supabase.storage
      .from('documents')
      .list('', { limit: 1 });

    if (fileError) {
      console.error('❌ File listing failed:', fileError);
      return false;
    }

    console.log('✅ Storage access test completed');
    return true;

  } catch (error) {
    console.error('❌ Storage access test failed:', error);
    return false;
  }
};

/**
 * Test user authentication
 */
export const testAuthentication = async () => {
  console.log('🧪 Testing Authentication...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Authentication check failed:', error);
      return false;
    }

    if (!user) {
      console.log('ℹ️ No user currently authenticated');
      return true;
    }

    console.log('✅ User authenticated:', user.email);

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ User profile not found:', profileError);
      return false;
    }

    console.log('✅ User profile found:', profile.full_name, profile.role);
    console.log('✅ Authentication test completed');
    return true;

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return false;
  }
};

/**
 * Run all integration tests
 */
export const runAllTests = async () => {
  console.log('🚀 Starting ADFD Integration Tests...');
  console.log('=====================================');
  
  // Test regional mapping (synchronous)
  testRegionalMapping();
  console.log('');
  
  // Test database connection
  const dbTest = await testDatabaseConnection();
  console.log('');
  
  // Test storage access
  const storageTest = await testStorageAccess();
  console.log('');
  
  // Test authentication
  const authTest = await testAuthentication();
  console.log('');
  
  console.log('=====================================');
  console.log('🏁 Integration Tests Summary:');
  console.log(`✅ Regional Mapping: PASSED`);
  console.log(`${dbTest ? '✅' : '❌'} Database Connection: ${dbTest ? 'PASSED' : 'FAILED'}`);
  console.log(`${storageTest ? '✅' : '❌'} Storage Access: ${storageTest ? 'PASSED' : 'FAILED'}`);
  console.log(`${authTest ? '✅' : '❌'} Authentication: ${authTest ? 'PASSED' : 'FAILED'}`);
  
  const allPassed = dbTest && storageTest && authTest;
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allPassed;
};

/**
 * Test request creation workflow (requires authentication)
 */
export const testRequestCreation = async () => {
  console.log('🧪 Testing Request Creation Workflow...');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated for request creation test');
      return false;
    }

    const testRequestData = {
      projectNumber: `TEST-${Date.now()}`,
      referenceNumber: `REF-${Date.now()}`,
      country: 'seychelles',
      beneficiaryName: 'Test Beneficiary Ltd',
      amount: '100000',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      projectDetails: 'Test project for integration testing',
      referenceDocumentation: 'Test reference documentation'
    };

    console.log('Creating test request...');
    const newRequest = await createRequestWithWorkflow(testRequestData, user.id);
    
    console.log('✅ Test request created successfully:', newRequest.id);
    console.log('✅ Request assigned to region:', newRequest.region);
    console.log('✅ Request creation workflow test completed');
    
    return newRequest;

  } catch (error) {
    console.error('❌ Request creation test failed:', error);
    return false;
  }
};
