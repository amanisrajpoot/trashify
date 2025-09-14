exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.enum('type', ['booking', 'payment', 'system', 'promotion']).notNullable();
    table.enum('status', ['unread', 'read', 'archived']).defaultTo('unread');
    table.jsonb('data').nullable(); // additional data for the notification
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['status']);
    table.index(['type']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
