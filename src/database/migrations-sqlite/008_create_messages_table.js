exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.uuid('booking_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.uuid('receiver_id').notNullable();
    table.text('message').notNullable();
    table.enum('message_type', ['text', 'image', 'location', 'system']).defaultTo('text');
    table.string('attachment_url', 500); // for images, documents
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
    table.text('metadata'); // additional message data
    
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('receiver_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['booking_id']);
    table.index(['sender_id']);
    table.index(['receiver_id']);
    table.index(['created_at']);
    table.index(['is_read']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
