#!/usr/bin/env node

// Quick Azure schema compatibility test
// This script helps verify which schema version Azure is using

const testData = {
  title: "Test Video",
  description: "Test Description", 
  youtubeUrl: "https://youtube.com/watch?v=test",
  scamType: "phone",
  featured: false,
  viewCount: 0,
  duration: 120
};

console.log("🧪 Azure Schema Compatibility Test");
console.log("===================================");

console.log("\n📦 Test data being sent to API:");
console.log(JSON.stringify(testData, null, 2));

console.log("\n🔄 Field mapping for Azure compatibility:");
console.log("Frontend → Database mapping:");

const mappings = [
  { frontend: "youtubeUrl", snake_case: "video_url", camelCase: "videoUrl" },
  { frontend: "scamType", snake_case: "scam_type", camelCase: "scamType" },
  { frontend: "featured", snake_case: "is_featured", camelCase: "isFeatured" },
  { frontend: "viewCount", snake_case: "view_count", camelCase: "viewCount" },
  { frontend: "createdBy", snake_case: "created_by", camelCase: "createdBy" }
];

mappings.forEach(mapping => {
  console.log(`  ${mapping.frontend} → ${mapping.snake_case} (Replit) | ${mapping.camelCase} (Azure)`);
});

console.log("\n🎯 Expected validation data for compatibility:");
const compatibilityData = {
  // Both naming conventions for maximum compatibility
  title: testData.title,
  description: testData.description,
  
  // Snake_case (current Replit schema)
  video_url: testData.youtubeUrl,
  scam_type: testData.scamType,
  is_featured: testData.featured,
  view_count: testData.viewCount,
  duration: testData.duration,
  created_by: 1,
  
  // CamelCase (old Azure schema)
  videoUrl: testData.youtubeUrl,
  scamType: testData.scamType,
  isFeatured: testData.featured,
  viewCount: testData.viewCount,
  createdBy: 1
};

console.log(JSON.stringify(compatibilityData, null, 2));

console.log("\n🚀 Next steps:");
console.log("1. Deploy this updated code to Azure");
console.log("2. Try creating a video - it should now work with both schemas");
console.log("3. Check Azure logs for '✅ Schema validation successful' or '✅ Compatibility mode validation successful'");
console.log("4. Once working, you can rebuild Azure with the fixed azure-build.sh script");