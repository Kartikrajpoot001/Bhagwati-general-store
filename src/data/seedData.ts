/**
 * Seed data for Bhagwati General Store: Inventory and Stock Management.
 * 24 products across 5 categories with 13-week historical sales figures (91 days total).
 * 
 * Target Verification Metrics:
 * - Products: 24
 * - Categories: 5
 * - Total Units Sold: 24,185
 * - Total Revenue: ₹8,63,755
 * - ABC Analysis: A = 8 products, B = 9 products, C = 7 products
 */

export interface Product {
  sku: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  receiveQty: number;
  everyDays: number;
  reorderLevel: number;
  quantity: number; // Opening quantity = receiveQty
  weeklySales: number[];
  totalUnitsSold: number;
  avgDailySales: number;
  revenue: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawProductSeed {
  sku: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  receiveQty: number;
  everyDays: number;
  reorderLevel: number;
  weeklySales: number[];
}

export const RAW_SEED_PRODUCTS: RawProductSeed[] = [
  {
    sku: 'B01',
    category: 'Bakery',
    brand: 'Britannia',
    name: 'Pineapple Cake 55g',
    price: 25,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 40,
    weeklySales: [73, 8, 72, 11, 32, 30, 25, 80, 14, 73, 71, 14, 10],
  },
  {
    sku: 'B02',
    category: 'Bakery',
    brand: 'Britannia',
    name: 'Fruity Fun Cake 55g',
    price: 20,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 34,
    weeklySales: [10, 10, 68, 6, 38, 31, 59, 71, 7, 18, 77, 40, 6],
  },
  {
    sku: 'B03',
    category: 'Bakery',
    brand: 'Britannia',
    name: 'Orange Bites Cake 55g',
    price: 25,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 37,
    weeklySales: [25, 17, 73, 43, 38, 17, 15, 46, 23, 25, 80, 14, 55],
  },
  {
    sku: 'B04',
    category: 'Bakery',
    brand: 'Britannia',
    name: 'Choco Chill Cake 55g',
    price: 30,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 45,
    weeklySales: [27, 15, 71, 79, 43, 38, 47, 83, 30, 23, 81, 10, 31],
  },
  {
    sku: 'B05',
    category: 'Bakery',
    brand: 'Sunfeast',
    name: 'Caker Trinity Cake',
    price: 60,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 50,
    weeklySales: [67, 4, 4, 145, 20, 46, 43, 75, 5, 77, 45, 15, 97],
  },
  {
    sku: 'B06',
    category: 'Bakery',
    brand: 'Parle',
    name: 'Happy Happy Cakes',
    price: 10,
    receiveQty: 100,
    everyDays: 7,
    reorderLevel: 33,
    weeklySales: [19, 7, 14, 56, 59, 19, 23, 89, 9, 37, 30, 45, 15],
  },
  {
    sku: 'M01',
    category: 'Milk',
    brand: 'Amul',
    name: 'Amul Milk 1/2 Litre',
    price: 26,
    receiveQty: 50,
    everyDays: 1,
    reorderLevel: 44,
    weeklySales: [258, 283, 304, 284, 350, 350, 320, 311, 320, 274, 317, 276, 290],
  },
  {
    sku: 'M02',
    category: 'Milk',
    brand: 'Mother Dairy',
    name: 'Mother Dairy Milk 1/2 Litre',
    price: 28,
    receiveQty: 50,
    everyDays: 1,
    reorderLevel: 40,
    weeklySales: [214, 294, 253, 227, 350, 350, 334, 306, 293, 217, 281, 234, 280],
  },
  {
    sku: 'M03',
    category: 'Milk',
    brand: 'Milk Food',
    name: 'Milk Food Milk 1/2 Litre',
    price: 33,
    receiveQty: 50,
    everyDays: 1,
    reorderLevel: 41,
    weeklySales: [260, 288, 226, 232, 350, 350, 306, 296, 313, 287, 325, 198, 272],
  },
  {
    sku: 'M04',
    category: 'Milk',
    brand: 'Doody',
    name: 'Doody Milk 1/2 Litre',
    price: 30,
    receiveQty: 50,
    everyDays: 1,
    reorderLevel: 44,
    weeklySales: [280, 292, 249, 299, 350, 350, 350, 334, 330, 278, 328, 225, 339],
  },
  {
    sku: 'M05',
    category: 'Milk',
    brand: 'Cow',
    name: 'Cow Milk 1/2 Litre',
    price: 32,
    receiveQty: 50,
    everyDays: 1,
    reorderLevel: 48,
    weeklySales: [345, 345, 329, 306, 350, 350, 350, 320, 345, 350, 350, 278, 316],
  },
  {
    sku: 'R01',
    category: 'Rice',
    brand: 'Johri',
    name: 'Johri Rice 1 kg',
    price: 40,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 10,
    weeklySales: [15, 10, 12, 13, 2, 0, 5, 12, 11, 11, 10, 14, 9],
  },
  {
    sku: 'R02',
    category: 'Rice',
    brand: 'Satake',
    name: 'Satake Rice 1 kg',
    price: 55,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 13,
    weeklySales: [16, 16, 11, 16, 5, 6, 7, 11, 14, 16, 15, 15, 13],
  },
  {
    sku: 'R03',
    category: 'Rice',
    brand: 'Green India',
    name: 'Green India Rice 1 kg',
    price: 30,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 13,
    weeklySales: [23, 20, 17, 8, 3, 0, 4, 12, 15, 19, 21, 17, 7],
  },
  {
    sku: 'R04',
    category: 'Rice',
    brand: 'Basmati',
    name: 'Basmati Rice 1 kg',
    price: 70,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 13,
    weeklySales: [17, 13, 13, 19, 2, 1, 9, 25, 17, 9, 10, 12, 15],
  },
  {
    sku: 'R05',
    category: 'Rice',
    brand: 'Gia International',
    name: 'Gia International Rice 1 kg',
    price: 100,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 16,
    weeklySales: [31, 13, 13, 17, 5, 1, 8, 15, 30, 13, 17, 16, 20],
  },
  {
    sku: 'P01',
    category: 'Pulses',
    brand: 'Vedaka',
    name: 'Chana Daal 1 kg',
    price: 70,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 12,
    weeklySales: [10, 11, 18, 14, 5, 0, 4, 11, 14, 10, 14, 20, 16],
  },
  {
    sku: 'P02',
    category: 'Pulses',
    brand: 'Amazon Brand',
    name: 'Chole 1 kg',
    price: 120,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 12,
    weeklySales: [12, 13, 18, 17, 7, 0, 4, 12, 11, 8, 13, 15, 17],
  },
  {
    sku: 'P03',
    category: 'Pulses',
    brand: 'Dhiman Agro',
    name: 'Moong Daal 1 kg',
    price: 65,
    receiveQty: 20,
    everyDays: 7,
    reorderLevel: 11,
    weeklySales: [10, 11, 18, 7, 4, 0, 4, 12, 12, 12, 19, 18, 13],
  },
  {
    sku: 'C01',
    category: 'Cosmetics',
    brand: 'Kosmetics Lane',
    name: 'Moisturizer',
    price: 282,
    receiveQty: 10,
    everyDays: 10,
    reorderLevel: 6,
    weeklySales: [7, 3, 3, 5, 4, 1, 4, 1, 2, 7, 3, 5, 4],
  },
  {
    sku: 'C02',
    category: 'Cosmetics',
    brand: 'Jas Raney and Company',
    name: 'Matte Waterproof Lipstick',
    price: 499,
    receiveQty: 5,
    everyDays: 10,
    reorderLevel: 4,
    weeklySales: [6, 0, 1, 1, 4, 6, 0, 1, 4, 2, 2, 5, 4],
  },
  {
    sku: 'C03',
    category: 'Cosmetics',
    brand: 'Vcos Cosmetics',
    name: 'Skin Tint for Women',
    price: 319,
    receiveQty: 5,
    everyDays: 10,
    reorderLevel: 2,
    weeklySales: [2, 0, 1, 0, 0, 0, 0, 2, 0, 2, 3, 3, 2],
  },
  {
    sku: 'C04',
    category: 'Cosmetics',
    brand: 'Dove',
    name: 'Pack of 4, Bath Soap',
    price: 231,
    receiveQty: 25,
    everyDays: 10,
    reorderLevel: 12,
    weeklySales: [14, 6, 4, 6, 3, 4, 8, 5, 20, 8, 11, 6, 8],
  },
  {
    sku: 'C05',
    category: 'Cosmetics',
    brand: 'Pantene',
    name: 'Shampoo 1 litre',
    price: 661,
    receiveQty: 10,
    everyDays: 10,
    reorderLevel: 7,
    weeklySales: [6, 2, 1, 3, 2, 7, 4, 0, 7, 6, 3, 10, 6],
  },
];

export function buildInitialProducts(): Product[] {
  const result: Product[] = [];
  for (let i = 0; i < RAW_SEED_PRODUCTS.length; i++) {
    const raw = RAW_SEED_PRODUCTS[i];
    let totalUnitsSold = 0;
    for (let w = 0; w < raw.weeklySales.length; w++) {
      totalUnitsSold += raw.weeklySales[w];
    }
    const avgDailySales = Number((totalUnitsSold / 91).toFixed(4));
    const revenue = totalUnitsSold * raw.price;

    result.push({
      sku: raw.sku,
      category: raw.category,
      brand: raw.brand,
      name: raw.name,
      price: raw.price,
      receiveQty: raw.receiveQty,
      everyDays: raw.everyDays,
      reorderLevel: raw.reorderLevel,
      quantity: raw.receiveQty, // Opening quantity = receiveQty
      weeklySales: [...raw.weeklySales],
      totalUnitsSold,
      avgDailySales,
      revenue,
      createdAt: '2022-09-01T08:00:00.000Z',
      updatedAt: '2022-11-30T20:00:00.000Z',
    });
  }
  return result;
}

export const INITIAL_PRODUCTS = buildInitialProducts();
