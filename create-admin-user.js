import { AzureStorage } from './server/AzureStorage.js';

async function createAdminUser() {
  console.log('Creating admin user...');
  
  const storage = new AzureStorage();
  
  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByEmail('admin@beaware.com');
    if (existingUser) {
      console.log('Admin user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        beawareUsername: existingUser.beawareUsername,
        role: existingUser.role
      });
      
      // Update role if it's not admin
      if (existingUser.role !== 'admin') {
        console.log('Updating user role to admin...');
        const updatedUser = await storage.updateUser(existingUser.id, { role: 'admin' });
        console.log('User role updated:', updatedUser.role);
      }
      
      return existingUser;
    }
    
    // Create new admin user
    const userData = {
      email: 'admin@beaware.com',
      password: 'password123',
      displayName: 'Administrator',
      beawareUsername: 'admin_beaware',
      role: 'admin',
      authProvider: 'local'
    };
    
    const newUser = await storage.createUser(userData);
    console.log('Admin user created successfully:', {
      id: newUser.id,
      email: newUser.email,
      beawareUsername: newUser.beawareUsername,
      role: newUser.role
    });
    
    return newUser;
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

createAdminUser()
  .then(() => {
    console.log('Admin user setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });