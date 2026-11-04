/**
 * ReportService for ADSA Inventory System.
 * Generates analytics for the Dashboard, computes inventory valuation,
 * categorized aggregates, and alert summaries.
 */

import { Product } from '../types';
import { ProductManager } from './ProductManager';

export interface CategorySummary {
  category: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
}

export interface DashboardReport {
  totalProducts: number;
  totalUnits: number;
  totalStockValue: number;
  lowStockCount: number;
  criticalStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalHistoricalUnitsSold: number;
  totalHistoricalRevenue: number;
  categories: CategorySummary[];
}

export class ReportService {
  public static generateDashboardReport(productManager: ProductManager): DashboardReport {
    const products: Product[] = productManager.getAllProducts();
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let criticalStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let totalHistoricalUnitsSold = 0;
    let totalHistoricalRevenue = 0;

    // Track categories without using built-in Map/Set
    const categoryNames: string[] = [];
    const categoryCounts: number[] = [];
    const categoryQuantities: number[] = [];
    const categoryValues: number[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const val = p.price * p.quantity;
      totalUnits += p.quantity;
      totalStockValue += val;
      totalHistoricalUnitsSold += p.totalUnitsSold || 0;
      totalHistoricalRevenue += p.revenue || 0;

      if (p.quantity <= p.reorderLevel) {
        lowStockCount++;
        if (p.quantity === 0 || p.quantity <= p.reorderLevel / 2) {
          criticalStockCount++;
        }
      }

      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        if (exp < now) {
          expiredCount++;
        } else if (exp <= thirtyDaysAhead) {
          expiringSoonCount++;
        }
      }

      // Aggregate into category list
      const cat = p.category || 'General';
      let foundIdx = -1;
      for (let j = 0; j < categoryNames.length; j++) {
        if (categoryNames[j] === cat) {
          foundIdx = j;
          break;
        }
      }

      if (foundIdx === -1) {
        categoryNames.push(cat);
        categoryCounts.push(1);
        categoryQuantities.push(p.quantity);
        categoryValues.push(val);
      } else {
        categoryCounts[foundIdx] += 1;
        categoryQuantities[foundIdx] += p.quantity;
        categoryValues[foundIdx] += val;
      }
    }

    const categories: CategorySummary[] = [];
    for (let i = 0; i < categoryNames.length; i++) {
      const pct = totalStockValue > 0 ? (categoryValues[i] / totalStockValue) * 100 : 0;
      categories.push({
        category: categoryNames[i],
        itemCount: categoryCounts[i],
        totalQuantity: categoryQuantities[i],
        totalValue: Number(categoryValues[i].toFixed(2)),
        percentage: Number(pct.toFixed(1)),
      });
    }

    return {
      totalProducts: products.length,
      totalUnits,
      totalStockValue: Number(totalStockValue.toFixed(2)),
      lowStockCount,
      criticalStockCount,
      expiringSoonCount,
      expiredCount,
      totalHistoricalUnitsSold,
      totalHistoricalRevenue,
      categories,
    };
  }
}
