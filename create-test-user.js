import { AzureStorage } from './server/AzureStorage.js';

async function createTestUser() {
  console.log('Creating test user with BeAware username...');
  
  const storage = new AzureStorage();
  
  try {
    // Check if test user already exists
    const existingUser = await storage.getUserByEmail('testuser@beaware.fyi');
    if (existingUser) {
      console.log('Test user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        beawareUsername: existingUser.beawareUsername,
        role: existingUser.role
      });
      return existingUser;
    }
    
    // Create new test user
    const userData = {
      email: 'testuser@beaware.fyi',
      password: 'password123',
      displayName: 'Test User',
      beawareUsername: 'testuser123',
      role: 'user',
      authProvider: 'local'
    };
    
    const newUser = await storage.createUser(userData);
    console.log('Test user created successfully:', {
      id: newUser.id,
      email: newUser.email,
      beawareUsername: newUser.beawareUsername,
      role: newUser.role
    });
    
    return newUser;
    
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

createTestUser()
  .then(() => {
    console.log('Test user setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create test user:', error);
    process.exit(1);
  });