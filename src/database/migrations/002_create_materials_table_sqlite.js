exports.up = function(knex) {
  return knex.schema.createTable('materials', function(table) {
    table.string('id').primary();
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('category', 50).notNullable();
    table.decimal('price_per_kg', 10, 2).notNullable();
    table.string('unit', 20).defaultTo('kg');
    table.text('image_url');
    table.boolean('is_active').defaultTo(true);
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('materials');
};
