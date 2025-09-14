exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('type').notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.text('data'); // JSON stored as text
    table.boolean('is_read').defaultTo(false);
    table.datetime('read_at');
    table.datetime('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
