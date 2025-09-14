exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.string('id').primary();
    table.string('booking_id').notNullable();
    table.string('customer_id').notNullable();
    table.string('collector_id');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('INR');
    table.string('status').notNullable().checkIn(['pending', 'completed', 'failed', 'refunded']);
    table.string('payment_method', 50);
    table.string('transaction_id', 255);
    table.text('payment_details'); // JSON stored as text
    table.datetime('paid_at');
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('booking_id').references('id').inTable('bookings');
    table.foreign('customer_id').references('id').inTable('users');
    table.foreign('collector_id').references('id').inTable('users');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
