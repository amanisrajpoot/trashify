exports.seed = function(knex) {
  return knex('materials').del()
    .then(function () {
      return knex('materials').insert([
        {
          id: 'mat_001',
          name: 'Plastic Bottles',
          description: 'Clean plastic bottles (PET)',
          category: 'plastic',
          price_per_kg: 15.00,
          unit: 'kg',
          image_url: 'https://example.com/plastic-bottles.jpg',
          is_active: true
        },
        {
          id: 'mat_002',
          name: 'Newspaper',
          description: 'Old newspapers and magazines',
          category: 'paper',
          price_per_kg: 8.00,
          unit: 'kg',
          image_url: 'https://example.com/newspaper.jpg',
          is_active: true
        },
        {
          id: 'mat_003',
          name: 'Cardboard',
          description: 'Clean cardboard boxes',
          category: 'paper',
          price_per_kg: 6.00,
          unit: 'kg',
          image_url: 'https://example.com/cardboard.jpg',
          is_active: true
        },
        {
          id: 'mat_004',
          name: 'Aluminum Cans',
          description: 'Empty aluminum beverage cans',
          category: 'metal',
          price_per_kg: 45.00,
          unit: 'kg',
          image_url: 'https://example.com/aluminum-cans.jpg',
          is_active: true
        },
        {
          id: 'mat_005',
          name: 'Steel Scrap',
          description: 'Old steel items and scrap metal',
          category: 'metal',
          price_per_kg: 25.00,
          unit: 'kg',
          image_url: 'https://example.com/steel-scrap.jpg',
          is_active: true
        },
        {
          id: 'mat_006',
          name: 'Glass Bottles',
          description: 'Clean glass bottles and jars',
          category: 'glass',
          price_per_kg: 3.00,
          unit: 'kg',
          image_url: 'https://example.com/glass-bottles.jpg',
          is_active: true
        },
        {
          id: 'mat_007',
          name: 'Electronic Waste',
          description: 'Old electronic devices and components',
          category: 'ewaste',
          price_per_kg: 80.00,
          unit: 'kg',
          image_url: 'https://example.com/ewaste.jpg',
          is_active: true
        },
        {
          id: 'mat_008',
          name: 'Fabric Waste',
          description: 'Old clothes and fabric scraps',
          category: 'textile',
          price_per_kg: 5.00,
          unit: 'kg',
          image_url: 'https://example.com/fabric-waste.jpg',
          is_active: true
        }
      ]);
    });
};
