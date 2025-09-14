exports.up = function(knex) {
  return knex.schema.createTable('inventory', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('material_id').references('id').inTable('materials').onDelete('CASCADE');
    table.uuid('collector_id').references('id').inTable('users').onDelete('CASCADE');
    table.decimal('weight', 10, 2).notNullable();
    table.decimal('price_per_kg', 10, 2).notNullable();
    table.decimal('total_value', 10, 2).notNullable();
    table.enum('condition', ['excellent', 'good', 'fair', 'poor']).defaultTo('good');
    table.text('notes').nullable();
    table.jsonb('images').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['booking_id']);
    table.index(['material_id']);
    table.index(['collector_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('inventory');
};
