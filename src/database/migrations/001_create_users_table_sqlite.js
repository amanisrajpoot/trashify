exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.string('id').primary();
    table.string('phone', 15).notNullable().unique();
    table.string('email', 255);
    table.string('name', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('role').notNullable().checkIn(['customer', 'collector', 'admin']);
    table.string('status').defaultTo('active').checkIn(['active', 'inactive', 'suspended']);
    table.string('profile_image_url', 255);
    table.text('address'); // JSON stored as text in SQLite
    table.text('verification_documents'); // JSON stored as text in SQLite
    table.boolean('is_verified').defaultTo(false);
    table.datetime('last_login');
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
