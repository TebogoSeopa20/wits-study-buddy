class UATReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }
  
  onTestStart(test) {
    // First check if test and test.title exist
    if (!test || !test.title) {
      return; // Skip if test object doesn't have expected structure
    }
    
    // Extract UAT components from the test name if they exist
    const testName = test.title;
    if (testName.includes('GIVEN') && testName.includes('WHEN') && testName.includes('THEN')) {
      console.log('\n' + '='.repeat(80));
      console.log('\x1b[1m\x1b[34mUser Acceptance Test:\x1b[0m', test.parent ? test.parent.title : 'Unknown Test Suite');
      
      // Parse and print UAT components
      const given = testName.match(/GIVEN (.*?)(?=WHEN|$)/s);
      const when = testName.match(/WHEN (.*?)(?=THEN|$)/s);
      const then = testName.match(/THEN (.*?)(?=$)/s);
      
      if (given) console.log('\x1b[36mGIVEN:\x1b[0m', given[1].trim());
      if (when) console.log('\x1b[33mWHEN:\x1b[0m', when[1].trim());
      if (then) console.log('\x1b[32mTHEN:\x1b[0m', then[1].trim());
      
      console.log('='.repeat(80));
    }
  }
  
  onTestResult(test, testResult) {
    // You can add additional formatting here if needed
  }
  
  onRunComplete(contexts, results) {
    // Summary of UAT results
    console.log('\n' + '='.repeat(80));
    console.log('\x1b[1m\x1b[34mUser Acceptance Test Summary:\x1b[0m');
    console.log(`\x1b[32mPassed: ${results.numPassedTests}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${results.numFailedTests}\x1b[0m`);
    console.log('='.repeat(80) + '\n');
  }
}

module.exports = UATReporter;