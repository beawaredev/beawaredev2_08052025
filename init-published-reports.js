const { AzureStorage } = require('./server/AzureStorage.ts');

async function publishInitialReports() {
  const storage = new AzureStorage();
  
  try {
    console.log('Publishing first 20 scam reports for public visibility...');
    
    // Get first 20 reports
    const allReports = await storage.getAllScamReports();
    const reportsToPublish = allReports.slice(0, 20);
    
    // Publish each report
    for (const report of reportsToPublish) {
      await storage.publishScamReport(report.id, 25); // Using admin user ID 25
      console.log(`Published report ${report.id}: ${report.scamType}`);
    }
    
    console.log(`Successfully published ${reportsToPublish.length} reports`);
  } catch (error) {
    console.error('Error publishing reports:', error);
  }
}

// Run the function
publishInitialReports();