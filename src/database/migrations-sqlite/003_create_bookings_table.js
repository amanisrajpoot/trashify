exports.up = function(knex) {
  return knex.schema.createTable('bookings', function(table) {
    table.string('id').primary();
    table.string('customer_id').notNullable();
    table.string('collector_id');
    table.string('status').notNullable().checkIn(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']);
    table.text('pickup_address').notNullable();
    table.decimal('pickup_latitude', 10, 8);
    table.decimal('pickup_longitude', 11, 8);
    table.datetime('scheduled_pickup_time');
    table.datetime('actual_pickup_time');
    table.text('notes');
    table.decimal('total_weight', 8, 2);
    table.decimal('total_amount', 10, 2);
    table.text('materials'); // JSON stored as text
    table.text('images'); // JSON array stored as text
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('customer_id').references('id').inTable('users');
    table.foreign('collector_id').references('id').inTable('users');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
