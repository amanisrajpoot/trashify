exports.up = function(knex) {
  return knex.schema.createTable('booking_materials', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.uuid('booking_id').notNullable();
    table.uuid('material_id').notNullable();
    table.decimal('quantity', 8, 2).notNullable(); // in kg
    table.decimal('unit_price', 8, 2).notNullable(); // price per kg at time of booking
    table.decimal('total_price', 10, 2).notNullable(); // quantity * unit_price
    table.text('notes'); // special notes for this material
    table.boolean('is_verified').defaultTo(false); // verified by collector
    table.decimal('actual_quantity', 8, 2); // actual weight collected
    table.decimal('actual_price', 10, 2); // actual amount paid
    
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('material_id').references('id').inTable('materials').onDelete('CASCADE');
    
    // Indexes
    table.index(['booking_id']);
    table.index(['material_id']);
    
    // Unique constraint to prevent duplicate materials in same booking
    table.unique(['booking_id', 'material_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('booking_materials');
};
