import { OrderProcessor } from './OrderProcessor';
import { ProductManager } from './ProductManager';
import { ReportService } from './ReportService';

export * from './ProductManager';
export * from './OrderProcessor';
export * from './ReportService';

// Singleton instances for the application session
export const productManager = new ProductManager();
export const orderProcessor = new OrderProcessor();
export { ReportService };
