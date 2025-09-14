exports.up = function(knex) {
  return knex.schema.createTable('collector_locations', function(table) {
    table.string('id').primary();
    table.string('collector_id').notNullable();
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.string('address', 500);
    table.boolean('is_available').defaultTo(true);
    table.datetime('last_updated').defaultTo(knex.fn.now());
    table.datetime('created_at').defaultTo(knex.fn.now());
    
    table.foreign('collector_id').references('id').inTable('users');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('collector_locations');
};
