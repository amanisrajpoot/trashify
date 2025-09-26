exports.up = function(knex) {
  return knex.schema.createTable('booking_status_history', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.uuid('booking_id').notNullable();
    table.enum('status', ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).notNullable();
    table.enum('previous_status', ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']);
    table.text('notes'); // reason for status change
    table.uuid('changed_by'); // user who made the change
    table.string('changed_by_role', 50); // customer, collector, admin, system
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.text('metadata'); // additional data about the change
    
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('changed_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['booking_id']);
    table.index(['status']);
    table.index(['changed_at']);
    table.index(['changed_by']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('booking_status_history');
};
