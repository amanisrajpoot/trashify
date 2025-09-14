const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash password for admin user
  const saltRounds = 12;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  
  // Inserts seed entries
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      phone: '9999999999',
      email: 'admin@trashify.com',
      name: 'Trashify Admin',
      password_hash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      is_verified: true,
      address: JSON.stringify({
        street: 'Admin Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Near Gateway of India'
      }),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      phone: '9876543210',
      email: 'customer@trashify.com',
      name: 'Test Customer',
      password_hash: await bcrypt.hash('customer123', saltRounds),
      role: 'customer',
      status: 'active',
      is_verified: true,
      address: JSON.stringify({
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Near Test Landmark'
      }),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      phone: '9876543211',
      email: 'collector@trashify.com',
      name: 'Test Collector',
      password_hash: await bcrypt.hash('collector123', saltRounds),
      role: 'collector',
      status: 'active',
      is_verified: true,
      address: JSON.stringify({
        street: '456 Collector Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        landmark: 'Near Collector Landmark'
      }),
      verification_documents: JSON.stringify({
        aadhar: 'aadhar_document_url',
        pan: 'pan_document_url',
        address_proof: 'address_proof_url'
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
