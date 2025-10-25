#!/usr/bin/env node

/**
 * Test script to verify attendance filter fixes
 * Tests the API endpoints with different filter combinations
 */

const BASE_URL = 'http://localhost:3000';

async function testFilterEndpoint(eventId, testName, params) {
  const url = new URL(`/api/admin/events/${eventId}/attendance`, BASE_URL);
  
  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📡 URL: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}`);
      return false;
    }
    
    console.log(`✅ Success: ${data.rows.length} rows returned`);
    console.log(`📊 KPIs: Present=${data.kpis.present}, CheckedInOnly=${data.kpis.checkedInOnly}, Absent=${data.kpis.absent}`);
    
    // Verify status filtering worked correctly
    if (params.status) {
      const statuses = params.status.split(',');
      const actualStatuses = data.rows.map(row => row.status);
      const uniqueStatuses = [...new Set(actualStatuses)];
      
      console.log(`🔍 Expected statuses: ${statuses.join(', ')}`);
      console.log(`🔍 Actual statuses: ${uniqueStatuses.join(', ')}`);
      
      const allMatch = statuses.every(expected => uniqueStatuses.includes(expected));
      if (!allMatch) {
        console.log(`⚠️  Status filter may not be working correctly`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Attendance Filter Tests\n');
  
  // You'll need to replace this with an actual event ID from your database
  const eventId = 'test-event-id'; // Replace with real event ID
  
  const tests = [
    {
      name: 'No filters (baseline)',
      params: {}
    },
    {
      name: 'Filter by Present status',
      params: { status: 'present' }
    },
    {
      name: 'Filter by Checked-in-only status',
      params: { status: 'checked-in-only' }
    },
    {
      name: 'Filter by Absent status',
      params: { status: 'absent' }
    },
    {
      name: 'Filter by multiple statuses',
      params: { status: 'present,checked-in-only' }
    },
    {
      name: 'Filter by search query',
      params: { q: 'test' }
    },
    {
      name: 'Combined filters (status + search)',
      params: { status: 'present', q: 'test' }
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testFilterEndpoint(eventId, test.name, test.params);
    if (success) passed++;
  }
  
  console.log(`\n📈 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Attendance filters are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Check if we're running this script directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFilterEndpoint, runTests };
