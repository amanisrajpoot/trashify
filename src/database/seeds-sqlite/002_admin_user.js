const bcrypt = require('bcryptjs');

exports.seed = function(knex) {
  return knex('users').del()
    .then(async function () {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const customerPassword = await bcrypt.hash('customer123', 10);
      const collectorPassword = await bcrypt.hash('collector123', 10);
      
      return knex('users').insert([
        {
          id: 'admin_001',
          phone: '9999999999',
          email: 'admin@trashify.com',
          name: 'Admin User',
          password_hash: hashedPassword,
          role: 'admin',
          status: 'active',
          is_verified: true,
          address: JSON.stringify({
            street: 'Admin Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          })
        },
        {
          id: 'customer_001',
          phone: '9876543210',
          email: 'customer@example.com',
          name: 'Test Customer',
          password_hash: customerPassword,
          role: 'customer',
          status: 'active',
          is_verified: true,
          address: JSON.stringify({
            street: 'Customer Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          })
        },
        {
          id: 'collector_001',
          phone: '9876543211',
          email: 'collector@example.com',
          name: 'Test Collector',
          password_hash: collectorPassword,
          role: 'collector',
          status: 'active',
          is_verified: true,
          address: JSON.stringify({
            street: 'Collector Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          })
        }
      ]);
    });
};
