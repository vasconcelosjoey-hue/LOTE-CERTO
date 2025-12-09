export type ProductStatus = 'critical' | 'warning' | 'safe';

export interface Location {
  aisle: string; // Corredor
  shelf: string; // Prateleira
  spot?: string; // Vão/Posição
}

export interface Product {
  id: string;
  name: string;
  lot: string;
  expiryDate: string; // DD/MM/YYYY
  manufactureDate?: string;
  
  // Novos campos de Gestão e Auditoria
  quantity: number; // Estoque atual do lote
  unitPrice: number; // Preço de custo/venda para cálculo de perda
  location: Location; // Endereçamento físico
  
  // Novos campos de Inteligência de Compras
  averageDailySales?: number; // Venda média diária (Giro)
  minStockLevel?: number; // Ponto de pedido (Estoque mínimo)
  
  daysRemaining: number;
  status: ProductStatus;
  
  images: string[];
  codeType?: string;
}

export interface SmartAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  relatedProductId?: string;
}

export type FilterType = ProductStatus | 'all';

export interface StatusConfig {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  description: string;
}