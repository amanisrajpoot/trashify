exports.up = function(knex) {
  return knex.schema.createTable('collector_locations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('collector_id').references('id').inTable('users').onDelete('CASCADE');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.string('address').notNullable();
    table.enum('status', ['available', 'busy', 'offline']).defaultTo('offline');
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Indexes
    table.index(['collector_id']);
    table.index(['status']);
    table.index(['last_updated']);
    // Spatial index for location-based queries
    table.index(['latitude', 'longitude']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('collector_locations');
};
