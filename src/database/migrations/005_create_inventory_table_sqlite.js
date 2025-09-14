exports.up = function(knex) {
  return knex.schema.createTable('inventory', function(table) {
    table.string('id').primary();
    table.string('collector_id').notNullable();
    table.string('material_id').notNullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.string('unit', 20).defaultTo('kg');
    table.decimal('price_per_unit', 10, 2).notNullable();
    table.text('location');
    table.string('status').defaultTo('available').checkIn(['available', 'sold', 'damaged']);
    table.datetime('collected_at').defaultTo(knex.fn.now());
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('collector_id').references('id').inTable('users');
    table.foreign('material_id').references('id').inTable('materials');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('inventory');
};
