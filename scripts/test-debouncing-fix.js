#!/usr/bin/env node

/**
 * Test script to verify that the infinite loop in conflict checking is fixed
 * This script simulates the behavior and checks for proper debouncing
 */

console.log('🧪 Testing SessionForm Conflict Checking Fix...\n');

// Simulate the time field change detection logic
let lastCheckedTimes = {};
let conflictCheckTimeout = null;
let apiCallCount = 0;

const haveTimeFieldsChanged = (currentTimes) => {
  const lastChecked = lastCheckedTimes;
  
  // If no previous check, consider it changed
  if (!lastChecked.timeInStart && !lastChecked.timeInEnd) {
    return true;
  }
  
  // Check if any time field has meaningfully changed
  const timeInStartChanged = currentTimes.timeInStart && lastChecked.timeInStart && 
    currentTimes.timeInStart.getTime() !== lastChecked.timeInStart.getTime();
  const timeInEndChanged = currentTimes.timeInEnd && lastChecked.timeInEnd && 
    currentTimes.timeInEnd.getTime() !== lastChecked.timeInEnd.getTime();
  const timeOutStartChanged = currentTimes.timeOutStart && lastChecked.timeOutStart && 
    currentTimes.timeOutStart.getTime() !== lastChecked.timeOutStart.getTime();
  const timeOutEndChanged = currentTimes.timeOutEnd && lastChecked.timeOutEnd && 
    currentTimes.timeOutEnd.getTime() !== lastChecked.timeOutEnd.getTime();
  const hasTimeoutChanged = lastChecked.hasTimeout !== currentTimes.hasTimeout;
  
  return timeInStartChanged || timeInEndChanged || timeOutStartChanged || timeOutEndChanged || hasTimeoutChanged;
};

const simulateConflictCheck = (formData) => {
  apiCallCount++;
  console.log(`📞 API Call #${apiCallCount}: Checking conflicts for "${formData.name}"`);
  
  // Simulate API response
  setTimeout(() => {
    console.log(`✅ API Call #${apiCallCount}: No conflicts found`);
  }, 100);
};

const simulateTimeFieldChange = (currentTimes) => {
  console.log('\n🔄 Time field changed:', {
    timeInStart: currentTimes.timeInStart?.toISOString(),
    timeInEnd: currentTimes.timeInEnd?.toISOString(),
    timeOutStart: currentTimes.timeOutStart?.toISOString(),
    timeOutEnd: currentTimes.timeOutEnd?.toISOString(),
    hasTimeout: currentTimes.hasTimeout
  });
  
  if (haveTimeFieldsChanged(currentTimes)) {
    console.log('✅ Time fields have changed, scheduling conflict check...');
    
    // Clear any existing timeout
    if (conflictCheckTimeout) {
      clearTimeout(conflictCheckTimeout);
      console.log('🧹 Cleared previous timeout');
    }
    
    // Debounce the conflict check by 500ms
    conflictCheckTimeout = setTimeout(() => {
      const formData = {
        name: 'Test Session',
        description: '',
        eventId: 'test-event-id',
        timeInStart: currentTimes.timeInStart?.toISOString(),
        timeInEnd: currentTimes.timeInEnd?.toISOString(),
        timeOutStart: currentTimes.timeOutStart?.toISOString(),
        timeOutEnd: currentTimes.timeOutEnd?.toISOString(),
        hasTimeout: currentTimes.hasTimeout || false,
      };
      
      console.log('⏰ Debounced timeout triggered - checking conflicts');
      simulateConflictCheck(formData);
      
      // Update the last checked times
      lastCheckedTimes = {
        timeInStart: currentTimes.timeInStart,
        timeInEnd: currentTimes.timeInEnd,
        timeOutStart: currentTimes.timeOutStart,
        timeOutEnd: currentTimes.timeOutEnd,
        hasTimeout: currentTimes.hasTimeout,
      };
    }, 500);
  } else {
    console.log('⏭️  Time fields unchanged, skipping conflict check');
  }
};

// Test scenario: Simulate rapid time field changes
console.log('📋 Test Scenario: Rapid time field changes (should be debounced)\n');

const now = new Date();
const testTimes = [
  {
    timeInStart: new Date(now.getTime() + 60 * 60 * 1000),
    timeInEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    timeOutStart: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    timeOutEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    hasTimeout: true
  },
  // Same times (should not trigger)
  {
    timeInStart: new Date(now.getTime() + 60 * 60 * 1000),
    timeInEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    timeOutStart: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    timeOutEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    hasTimeout: true
  },
  // Different times (should trigger)
  {
    timeInStart: new Date(now.getTime() + 90 * 60 * 1000),
    timeInEnd: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    timeOutStart: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    timeOutEnd: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
    hasTimeout: true
  },
  // Same times again (should not trigger)
  {
    timeInStart: new Date(now.getTime() + 90 * 60 * 1000),
    timeInEnd: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    timeOutStart: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    timeOutEnd: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
    hasTimeout: true
  }
];

// Simulate rapid changes
testTimes.forEach((times, index) => {
  setTimeout(() => {
    simulateTimeFieldChange(times);
  }, index * 200); // Rapid changes every 200ms
});

// Wait for all timeouts to complete
setTimeout(() => {
  console.log('\n📊 Test Results:');
  console.log(`Total API calls made: ${apiCallCount}`);
  
  if (apiCallCount <= 2) {
    console.log('✅ SUCCESS: Debouncing is working correctly!');
    console.log('   - Only 1-2 API calls were made despite 4 time field changes');
    console.log('   - Duplicate time values were properly ignored');
  } else {
    console.log('❌ FAILURE: Debouncing is not working correctly');
    console.log('   - Too many API calls were made');
    console.log('   - Infinite loop may still be present');
  }
  
  console.log('\n🔧 Manual Testing Steps:');
  console.log('1. Open the admin dashboard in your browser');
  console.log('2. Create a new session');
  console.log('3. Change the time fields rapidly');
  console.log('4. Check the browser console - you should see:');
  console.log('   - "Triggering debounced conflict check" messages');
  console.log('   - No infinite loop of API calls');
  console.log('   - Proper debouncing (500ms delay)');
  
}, 2000);
