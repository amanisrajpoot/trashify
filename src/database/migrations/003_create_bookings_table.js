exports.up = function(knex) {
  return knex.schema.createTable('bookings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('customer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('collector_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('status', ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
    table.jsonb('pickup_address').notNullable();
    table.jsonb('materials').notNullable(); // array of material objects with type, estimated_weight
    table.decimal('estimated_value', 10, 2).nullable();
    table.decimal('actual_value', 10, 2).nullable();
    table.timestamp('scheduled_at').notNullable();
    table.timestamp('picked_up_at').nullable();
    table.text('special_instructions').nullable();
    table.jsonb('images').nullable(); // before/after pickup images
    table.decimal('rating', 2, 1).nullable(); // 1.0 to 5.0
    table.text('review').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['customer_id']);
    table.index(['collector_id']);
    table.index(['status']);
    table.index(['scheduled_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
