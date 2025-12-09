import { Product } from './types';

// Mock Data rico para demonstração de Inteligência e KPIs
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'MOCK-001',
    name: 'Amoxicilina 500mg - Genérico',
    lot: 'B2391',
    expiryDate: '15/10/2024',
    daysRemaining: 15,
    status: 'critical',
    quantity: 150,
    unitPrice: 22.50,
    location: { aisle: 'A04', shelf: 'P02' },
    averageDailySales: 2.5, // Vende pouco, estoque alto -> Excesso/Encalhe
    minStockLevel: 20,
    images: [],
    codeType: 'Datamatrix'
  },
  {
    id: 'MOCK-002',
    name: 'Dipirona Sódica 1g',
    lot: 'L9920',
    expiryDate: '20/12/2024',
    daysRemaining: 80,
    status: 'warning',
    quantity: 12, // Estoque baixo
    unitPrice: 8.90,
    location: { aisle: 'B01', shelf: 'P05' },
    averageDailySales: 15.0, // Vende muito -> Ruptura iminente
    minStockLevel: 50,
    images: [],
    codeType: 'EAN-13'
  },
  {
    id: 'MOCK-003',
    name: 'Vitamina C 1g Efervescente',
    lot: 'CV221',
    expiryDate: '10/06/2025',
    daysRemaining: 250,
    status: 'safe',
    quantity: 200,
    unitPrice: 15.00,
    location: { aisle: 'C10', shelf: 'P01' },
    averageDailySales: 8.0, // Venda saudável
    minStockLevel: 60,
    images: [],
    codeType: 'EAN-13'
  },
  {
    id: 'MOCK-004',
    name: 'Dorflex 36cp',
    lot: 'DFX99',
    expiryDate: '15/08/2025',
    daysRemaining: 300,
    status: 'safe',
    quantity: 45,
    unitPrice: 24.90,
    location: { aisle: 'A01', shelf: 'P03' },
    averageDailySales: 10.0,
    minStockLevel: 40, // Perto do mínimo -> Sugestão de compra inteligente
    images: [],
    codeType: 'EAN-13'
  }
];

export const STATUS_DEFINITIONS = {
  critical: {
    label: 'Críticos (D-30)',
    action: 'Retirar urgente',
    classes: 'bg-red-50 text-red-700 border-red-200 ring-red-500',
    badge: 'bg-red-100 text-red-800',
  },
  warning: {
    label: 'Atenção (D-90)',
    action: 'Acelerar Vendas',
    classes: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  safe: {
    label: 'Seguros',
    action: 'Manter Estoque',
    classes: 'bg-green-50 text-green-700 border-green-200 ring-green-500',
    badge: 'bg-green-100 text-green-800',
  },
};