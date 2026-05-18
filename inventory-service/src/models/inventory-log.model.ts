export type InventoryLog = {
  id?: string;
  productId: string;
  delta: number;
  reason?: string;
  createdAt?: string;
};
