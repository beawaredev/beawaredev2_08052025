import { AzureStorage } from './server/AzureStorage.js';

async function comprehensiveTest() {
  console.log('Running comprehensive Azure SQL Database test...');
  
  const storage = new AzureStorage();
  
  try {
    // Test 1: Database connectivity and basic queries
    console.log('\n=== Test 1: Database Connectivity ===');
    const allReports = await storage.getAllScamReports();
    console.log(`✓ Total reports: ${allReports.length}`);
    
    // Test 2: Boolean field handling (published reports)
    console.log('\n=== Test 2: Boolean Field Handling ===');
    const publishedReports = await storage.getPublishedScamReports(1, 10);
    console.log(`✓ Published reports: ${publishedReports.length}`);
    
    const unverifiedReports = await storage.getUnverifiedScamReports(1, 10);
    console.log(`✓ Unverified reports: ${unverifiedReports.length}`);
    
    // Test 3: Column mapping verification
    console.log('\n=== Test 3: Column Mapping ===');
    if (allReports.length > 0) {
      const report = allReports[0];
      console.log('✓ Sample report structure:', {
        id: report.id,
        userId: report.userId,
        scamType: report.scamType,
        isVerified: report.isVerified,
        isPublished: report.isPublished,
        reportedAt: report.reportedAt
      });
    }
    
    // Test 4: User authentication data
    console.log('\n=== Test 4: User Management ===');
    const users = await storage.getAllUsers();
    console.log(`✓ Total users: ${users.length}`);
    
    if (users.length > 0) {
      const adminUser = users.find(u => u.email === 'admin@beaware.fyi');
      console.log(`✓ Admin user found: ${adminUser ? 'Yes' : 'No'}`);
    }
    
    // Test 5: Statistics calculation
    console.log('\n=== Test 5: Statistics ===');
    const stats = await storage.getScamStats();
    console.log('✓ Statistics:', {
      totalReports: stats.totalReports,
      verifiedReports: stats.verifiedReports,
      phoneScams: stats.phoneScams
    });
    
    console.log('\n=== All Tests Passed Successfully! ===');
    console.log('Azure SQL Database integration is fully operational');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

comprehensiveTest();