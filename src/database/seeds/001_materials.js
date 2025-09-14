exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('materials').del();
  
  // Inserts seed entries
  await knex('materials').insert([
    // Paper Category
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Newspaper',
      category: 'paper',
      description: 'Clean newspapers without staples or clips',
      price_per_kg: 12.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'dry',
        preparation: 'Remove staples and clips',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Cardboard',
      category: 'paper',
      description: 'Clean cardboard boxes and packaging',
      price_per_kg: 8.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'dry',
        preparation: 'Flatten boxes, remove tape',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Office Paper',
      category: 'paper',
      description: 'White and colored office paper',
      price_per_kg: 15.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove staples and clips',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Books & Magazines',
      category: 'paper',
      description: 'Old books, magazines, and catalogs',
      price_per_kg: 10.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'dry',
        preparation: 'Remove covers if damaged',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },

    // Plastic Category
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'PET Bottles',
      category: 'plastic',
      description: 'Clear plastic bottles (water, soft drinks)',
      price_per_kg: 25.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove caps and labels, rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'HDPE Containers',
      category: 'plastic',
      description: 'Milk jugs, detergent bottles, shampoo bottles',
      price_per_kg: 20.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove caps and labels, rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Plastic Bags',
      category: 'plastic',
      description: 'Shopping bags, grocery bags',
      price_per_kg: 8.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Clean and dry',
        storage: 'Bundle together'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Plastic Containers',
      category: 'plastic',
      description: 'Food containers, storage boxes',
      price_per_kg: 15.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove labels, clean thoroughly',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },

    // Metal Category
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'Aluminum Cans',
      category: 'metal',
      description: 'Soft drink cans, beer cans',
      price_per_kg: 80.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Empty and rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Steel Cans',
      category: 'metal',
      description: 'Food cans, paint cans',
      price_per_kg: 35.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Empty and rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Copper Wire',
      category: 'metal',
      description: 'Electrical wire, cables',
      price_per_kg: 450.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove insulation',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'Iron Scrap',
      category: 'metal',
      description: 'Iron pipes, rods, sheets',
      price_per_kg: 25.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove paint and rust',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },

    // Glass Category
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: 'Glass Bottles',
      category: 'glass',
      description: 'Wine bottles, beer bottles, jars',
      price_per_kg: 5.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove caps and labels, rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      name: 'Glass Jars',
      category: 'glass',
      description: 'Food jars, cosmetic jars',
      price_per_kg: 4.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'clean',
        preparation: 'Remove caps and labels, rinse',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },

    // E-waste Category
    {
      id: '550e8400-e29b-41d4-a716-446655440015',
      name: 'Mobile Phones',
      category: 'e-waste',
      description: 'Old mobile phones and smartphones',
      price_per_kg: 200.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'working or non-working',
        preparation: 'Remove SIM card and memory card',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440016',
      name: 'Laptops',
      category: 'e-waste',
      description: 'Old laptops and notebooks',
      price_per_kg: 150.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'working or non-working',
        preparation: 'Remove hard drive and battery',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440017',
      name: 'Computer Parts',
      category: 'e-waste',
      description: 'CPU, motherboard, RAM, graphics cards',
      price_per_kg: 100.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'working or non-working',
        preparation: 'Clean and dry',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440018',
      name: 'Televisions',
      category: 'e-waste',
      description: 'Old CRT and LED televisions',
      price_per_kg: 50.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'working or non-working',
        preparation: 'Remove cables and accessories',
        storage: 'Keep dry and clean'
      }),
      is_active: true
    },

    // Organic Category
    {
      id: '550e8400-e29b-41d4-a716-446655440019',
      name: 'Food Waste',
      category: 'organic',
      description: 'Vegetable peels, fruit scraps, leftover food',
      price_per_kg: 2.00,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'fresh',
        preparation: 'Separate from non-organic waste',
        storage: 'Keep in compostable bags'
      }),
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'Garden Waste',
      category: 'organic',
      description: 'Leaves, grass clippings, plant trimmings',
      price_per_kg: 1.50,
      unit: 'kg',
      requirements: JSON.stringify({
        condition: 'fresh',
        preparation: 'Remove plastic and metal',
        storage: 'Keep dry'
      }),
      is_active: true
    }
  ]);
};
