exports.up = function(knex) {
  return knex.schema.createTable('reviews', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.uuid('booking_id').notNullable();
    table.uuid('reviewer_id').notNullable(); // who wrote the review
    table.uuid('reviewee_id').notNullable(); // who is being reviewed
    table.enum('reviewer_role', ['customer', 'collector']).notNullable();
    table.integer('rating').notNullable(); // 1-5 stars
    table.text('comment');
    table.enum('review_type', ['service', 'punctuality', 'communication', 'overall']).defaultTo('overall');
    table.boolean('is_verified').defaultTo(false); // verified review
    table.boolean('is_public').defaultTo(true);
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
    table.text('metadata'); // additional review data
    
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('reviewer_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('reviewee_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['booking_id']);
    table.index(['reviewer_id']);
    table.index(['reviewee_id']);
    table.index(['rating']);
    table.index(['review_type']);
    table.index(['is_public']);
    
    // Unique constraint to prevent duplicate reviews for same booking
    table.unique(['booking_id', 'reviewer_id', 'review_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reviews');
};
