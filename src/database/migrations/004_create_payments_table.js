exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('customer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('collector_id').references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.enum('type', ['payout', 'refund', 'bonus']).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.string('razorpay_payment_id').nullable();
    table.string('razorpay_order_id').nullable();
    table.string('razorpay_signature').nullable();
    table.jsonb('payment_details').nullable();
    table.text('failure_reason').nullable();
    table.timestamp('processed_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['booking_id']);
    table.index(['customer_id']);
    table.index(['collector_id']);
    table.index(['status']);
    table.index(['type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
