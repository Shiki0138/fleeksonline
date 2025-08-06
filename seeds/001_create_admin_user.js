const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash the default admin password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash('Admin123!@#', saltRounds);
  
  // Insert seed entries
  await knex('users').insert([
    {
      id: uuidv4(),
      email: 'admin@fleeks.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      email: 'user@fleeks.com',
      password: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      email: 'moderator@fleeks.com',
      password: hashedPassword,
      first_name: 'Moderator',
      last_name: 'User',
      role: 'moderator',
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  
  console.log('✅ Admin user created with email: admin@fleeks.com and password: Admin123!@#');
  console.log('✅ Test user created with email: user@fleeks.com and password: Admin123!@#');
  console.log('✅ Moderator user created with email: moderator@fleeks.com and password: Admin123!@#');
  console.log('⚠️  Please change these default passwords in production!');
};