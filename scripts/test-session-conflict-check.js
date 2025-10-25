#!/usr/bin/env node

/**
 * Test script to verify session conflict checking behavior
 * This script tests the conflict checking API endpoint to ensure it works correctly
 */

const testConflictCheck = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Session Conflict Check API...\n');
  
  // Test data - create a session that should conflict with existing ones
  const testSessionData = {
    name: 'Test Session for Conflict Check',
    description: 'This is a test session to verify conflict checking',
    eventId: 'cm12345678901234567890123', // Replace with actual event ID
    timeInStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    timeInEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    timeOutStart: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours from now
    timeOutEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    hasTimeout: true,
    organizerIds: [],
    maxCapacity: 100,
    allowWalkIns: true,
    requireRegistration: false,
  };
  
  try {
    console.log('📤 Sending conflict check request...');
    console.log('Session data:', JSON.stringify(testSessionData, null, 2));
    
    const response = await fetch(`${baseUrl}/api/admin/sessions?checkConflicts=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication headers
        // 'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(testSessionData),
    });
    
    const result = await response.json();
    
    console.log('\n📥 Response received:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 409) {
      console.log('\n✅ Conflict detection working correctly!');
      console.log('Conflicting sessions:', result.conflictingSessions);
    } else if (response.status === 200) {
      console.log('\n✅ No conflicts found - session can be created');
    } else if (response.status === 401) {
      console.log('\n⚠️  Authentication required - this is expected in production');
      console.log('To test with authentication, add proper headers');
    } else {
      console.log('\n❌ Unexpected response status:', response.status);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing conflict check:', error.message);
  }
};

const testValidationErrors = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('\n🧪 Testing Validation Errors...\n');
  
  // Test with invalid data
  const invalidSessionData = {
    name: '', // Empty name should fail validation
    description: 'Test description',
    eventId: 'invalid-id', // Invalid event ID
    timeInStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Past time
    timeInEnd: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Past time
    hasTimeout: false,
    organizerIds: [],
  };
  
  try {
    console.log('📤 Sending invalid session data...');
    
    const response = await fetch(`${baseUrl}/api/admin/sessions?checkConflicts=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidSessionData),
    });
    
    const result = await response.json();
    
    console.log('\n📥 Response received:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 400) {
      console.log('\n✅ Validation errors working correctly!');
      console.log('Validation details:', result.details);
    } else {
      console.log('\n❌ Expected validation error but got status:', response.status);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing validation:', error.message);
  }
};

const testTimeWindowValidation = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('\n🧪 Testing Time Window Validation...\n');
  
  // Test with overlapping time windows
  const overlappingSessionData = {
    name: 'Overlapping Session Test',
    description: 'Testing overlapping time windows',
    eventId: 'cm12345678901234567890123',
    timeInStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    timeInEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    timeOutStart: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours from now (overlaps with time-in)
    timeOutEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours from now
    hasTimeout: true,
    organizerIds: [],
  };
  
  try {
    console.log('📤 Sending overlapping time window data...');
    
    const response = await fetch(`${baseUrl}/api/admin/sessions?checkConflicts=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(overlappingSessionData),
    });
    
    const result = await response.json();
    
    console.log('\n📥 Response received:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 400) {
      console.log('\n✅ Time window validation working correctly!');
      console.log('Validation details:', result.details);
    } else {
      console.log('\n❌ Expected time window validation error but got status:', response.status);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing time window validation:', error.message);
  }
};

const main = async () => {
  console.log('🚀 Starting Session Conflict Check Tests\n');
  
  await testConflictCheck();
  await testValidationErrors();
  await testTimeWindowValidation();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Make sure your development server is running');
  console.log('- Replace the eventId with a real event ID from your database');
  console.log('- Add proper authentication headers for production testing');
  console.log('- Check the browser console for real-time conflict checking logs');
  console.log('\n🔧 Manual Testing Steps:');
  console.log('1. Open the admin dashboard in your browser');
  console.log('2. Create a new event');
  console.log('3. Create a session with specific time windows');
  console.log('4. Try to create another session with overlapping times');
  console.log('5. Verify that conflicts are detected and displayed');
  console.log('6. Change the time windows and verify conflicts are cleared');
};

// Run the tests
main().catch(console.error);