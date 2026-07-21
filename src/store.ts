/* ============================================================
   COMPLETE PLANT MANAGEMENT STORE
   All modules share this centralized state
============================================================ */

import { useEffect, useState } from "react";
import type { MixClass } from "./mixData";

const LS = (k: string) => `asphalt_${k}_v3`;

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(LS(key)); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function save(key: string, val: unknown) { try { localStorage.setItem(LS(key), JSON.stringify(val)); } catch {} }

function usePersisted<T>(key: string, fallback: T) {
  const [val, setVal] = useState<T>(() => load(key, fallback));
  useEffect(() => save(key, val), [key, val]);
  return [val, setVal] as const;
}

/* ==================== TYPES ==================== */

// Production
export interface ProdEntry {
  id: string; time: string; mixClass: MixClass;
  tons: number; bitumenPct: number; temperature: number; event: string;
  aggUsed: Record<string, number>;
}

// Fleet
export interface Truck {
  id: string; number: string; driver: string; phone: string; destination: string;
  tons: number; mixClass: MixClass; customerId: string;
  status: "loading" | "loaded" | "dispatched" | "delivered";
  createdAt: string; loadedAt?: string; dispatchedAt?: string; deliveredAt?: string;
}

// Inventory (Raw Materials)
export interface InvItem {
  id: string; key: string; name: string; category: "aggregate" | "bitumen" | "fuel" | "additive" | "filler";
  stock: number; capacity: number; unit: string; pricePerUnit: number; minStock: number;
  consumedToday: number; lastRefill?: string; supplier?: string;
}

// Spare Parts
export interface SparePart {
  id: string; code: string; name: string; category: string;
  stock: number; minStock: number; unit: string; price: number;
  location: string; supplier: string; lastPurchase?: string;
}

// Repair Requests
export interface RepairRequest {
  id: string; title: string; equipment: string; priority: "urgent" | "high" | "medium" | "low";
  description: string; requestedBy: string; status: "pending" | "approved" | "in-progress" | "completed" | "rejected";
  createdAt: string; approvedAt?: string; completedAt?: string; assignedTo?: string;
  parts: { partId: string; qty: number }[]; notes?: string;
}

// Work Orders
export interface WorkOrder {
  id: string; title: string; type: "preventive" | "corrective" | "emergency";
  equipment: string; assignedTo: string; status: "scheduled" | "in-progress" | "completed" | "cancelled";
  scheduledDate: string; completedDate?: string; hours: number;
  description: string; parts: { partId: string; qty: number }[];
  createdAt: string;
}

// Customers
export interface Customer {
  id: string; name: string; company: string; phone: string; email: string;
  address: string; city: string; notes: string; createdAt: string;
  totalOrders: number; totalTons: number; creditLimit: number;
}

// Orders
export interface Order {
  id: string; orderNo: string; customerId: string; mixClass: MixClass;
  tons: number; pricePerTon: number; totalAmount: number;
  status: "pending" | "confirmed" | "in-production" | "dispatched" | "delivered" | "cancelled";
  deliveryDate: string; deliveryAddress: string; notes: string;
  truckId?: string; createdAt: string;
}

// Maintenance Tasks
export interface MaintTask {
  id: string; name: string; equipment: string; type: string;
  dueDate: string; priority: "High" | "Medium" | "Low"; done: boolean;
  completedAt?: string; createdAt: string; assignedTo?: string;
}

// R&D Projects
export interface RDProject {
  id: string; name: string; description: string; type: string;
  team: string; startDate: string; target: string;
  status: "Active" | "Completed" | "On Hold"; createdAt: string;
}

// Certifications
export interface Certification {
  id: string; name: string; type: string; status: "Approved" | "Pending" | "Expired";
  fileName: string; fileSize: number; fileType: string; fileData: string;
  date: string;
}

// Settings
export interface PlantSettings {
  plantName: string; plantLogo?: string; country: string; currency: string;
  address: string; phone: string; email: string;
  workingHours: { start: string; end: string };
}

// Cost Prices
export interface CostPrices {
  bitumenPerTon: number; coarseAggPerTon: number; fineAggPerTon: number;
  sandPerTon: number; fillerPerTon: number; dieselPricePerL: number;
  electricityPerKWh: number; laborPerTon: number;
}

/* ==================== DEFAULT DATA ==================== */

const DEFAULT_INV: InvItem[] = [
  { id: "1", key: "a4", name: "Coarse Agg 1.5-1\"", category: "aggregate", stock: 180, capacity: 250, unit: "tons", pricePerUnit: 320, minStock: 50, consumedToday: 0, supplier: "Quarry A" },
  { id: "2", key: "a3", name: "Coarse Agg 3/4-3/8\"", category: "aggregate", stock: 210, capacity: 250, unit: "tons", pricePerUnit: 320, minStock: 50, consumedToday: 0, supplier: "Quarry A" },
  { id: "3", key: "a2", name: "Chippings 3/8-#4", category: "aggregate", stock: 150, capacity: 250, unit: "tons", pricePerUnit: 280, minStock: 40, consumedToday: 0, supplier: "Quarry B" },
  { id: "4", key: "a1", name: "Crusher Sand", category: "aggregate", stock: 95, capacity: 200, unit: "tons", pricePerUnit: 280, minStock: 30, consumedToday: 0, supplier: "Quarry B" },
  { id: "5", key: "ns", name: "Natural Sand", category: "aggregate", stock: 60, capacity: 150, unit: "tons", pricePerUnit: 150, minStock: 20, consumedToday: 0, supplier: "Sand Pit" },
  { id: "6", key: "fl", name: "Mineral Filler", category: "filler", stock: 28, capacity: 80, unit: "tons", pricePerUnit: 450, minStock: 15, consumedToday: 0, supplier: "Limestone Co" },
  { id: "7", key: "bit", name: "Bitumen 60/70", category: "bitumen", stock: 42, capacity: 100, unit: "tons", pricePerUnit: 14500, minStock: 20, consumedToday: 0, supplier: "Suez Oil" },
  { id: "8", key: "fuel", name: "Diesel Fuel", category: "fuel", stock: 15, capacity: 50, unit: "tons", pricePerUnit: 35000, minStock: 5, consumedToday: 0, supplier: "Fuel Station" },
];

const DEFAULT_SPARES: SparePart[] = [
  { id: "1", code: "BRG-001", name: "Bearing SKF 6205", category: "Bearings", stock: 8, minStock: 3, unit: "pcs", price: 450, location: "Shelf A1", supplier: "SKF Egypt" },
  { id: "2", code: "BRG-002", name: "Bearing SKF 6308", category: "Bearings", stock: 5, minStock: 2, unit: "pcs", price: 850, location: "Shelf A1", supplier: "SKF Egypt" },
  { id: "3", code: "BLT-001", name: "V-Belt A68", category: "Belts", stock: 12, minStock: 4, unit: "pcs", price: 180, location: "Shelf B2", supplier: "Gates" },
  { id: "4", code: "BLT-002", name: "V-Belt B85", category: "Belts", stock: 8, minStock: 3, unit: "pcs", price: 220, location: "Shelf B2", supplier: "Gates" },
  { id: "5", code: "FLT-001", name: "Oil Filter", category: "Filters", stock: 15, minStock: 5, unit: "pcs", price: 120, location: "Shelf C1", supplier: "Baldwin" },
  { id: "6", code: "FLT-002", name: "Air Filter", category: "Filters", stock: 6, minStock: 2, unit: "pcs", price: 350, location: "Shelf C1", supplier: "Baldwin" },
  { id: "7", code: "OIL-001", name: "Hydraulic Oil 68", category: "Oils", stock: 200, minStock: 50, unit: "liters", price: 45, location: "Tank 1", supplier: "Shell" },
  { id: "8", code: "OIL-002", name: "Gear Oil 90", category: "Oils", stock: 150, minStock: 30, unit: "liters", price: 55, location: "Tank 2", supplier: "Shell" },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "1", name: "Mohamed Ahmed", company: "Al-Shams Construction", phone: "01223456789", email: "info@alshams.com", address: "Industrial Zone, 6th of October", city: "Giza", notes: "VIP Customer", createdAt: "2024-01-15", totalOrders: 45, totalTons: 12500, creditLimit: 500000 },
  { id: "2", name: "Ali Hassan", company: "Delta Roads Co", phone: "01098765432", email: "ali@delta.com", address: "Nasr City, Cairo", city: "Cairo", notes: "", createdAt: "2024-02-20", totalOrders: 28, totalTons: 8200, creditLimit: 300000 },
];

/* ==================== HOOKS ==================== */

export const useProduction = () => usePersisted<ProdEntry[]>("prod", []);
export const useTrucks = () => usePersisted<Truck[]>("trucks", []);
export const useInventory = () => usePersisted<InvItem[]>("inv", DEFAULT_INV);
export const useSpareParts = () => usePersisted<SparePart[]>("spares", DEFAULT_SPARES);
export const useRepairRequests = () => usePersisted<RepairRequest[]>("repairs", []);
export const useWorkOrders = () => usePersisted<WorkOrder[]>("workorders", []);
export const useCustomers = () => usePersisted<Customer[]>("customers", DEFAULT_CUSTOMERS);
export const useOrders = () => usePersisted<Order[]>("orders", []);
export const useMaintenance = () => usePersisted<MaintTask[]>("maint", []);
export const useRD = () => usePersisted<RDProject[]>("rd", []);
export const useCerts = () => usePersisted<Certification[]>("certs", []);
export const useSettings = () => usePersisted<PlantSettings>("settings", {
  plantName: "Allyan Asphalt Plant", country: "EG", currency: "EGP",
  address: "Industrial Zone, 6th of October, Giza", phone: "02-38274655", email: "info@allyanasphalt.com",
  workingHours: { start: "07:00", end: "18:00" },
});
export const useCosts = () => usePersisted<CostPrices>("costs", {
  bitumenPerTon: 14500, coarseAggPerTon: 320, fineAggPerTon: 280,
  sandPerTon: 150, fillerPerTon: 450, dieselPricePerL: 35, electricityPerKWh: 2.5, laborPerTon: 45,
});

/* ==================== HELPERS ==================== */

export const STORAGE_KEYS = {
  prod: LS("prod"), trucks: LS("trucks"), inv: LS("inv"), spares: LS("spares"),
  repairs: LS("repairs"), workorders: LS("workorders"), customers: LS("customers"),
  orders: LS("orders"), maint: LS("maint"), rd: LS("rd"), certs: LS("certs"),
  settings: LS("settings"), costs: LS("costs"),
};

// Get today's production stats
export function getTodayStats(log: ProdEntry[]) {
  const today = new Date().toDateString();
  const todayEntries = log.filter(e => new Date(e.time).toDateString() === today);
  return {
    batches: todayEntries.length,
    tons: todayEntries.reduce((s, e) => s + e.tons, 0),
    byHour: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      tons: todayEntries.filter(e => new Date(e.time).getHours() === h).reduce((s, e) => s + e.tons, 0),
      count: todayEntries.filter(e => new Date(e.time).getHours() === h).length,
    })),
  };
}

// Get fleet stats
export function getFleetStats(trucks: Truck[]) {
  const delivered = trucks.filter(t => t.status === "delivered");
  const active = trucks.filter(t => t.status !== "delivered");
  return {
    total: trucks.length,
    active: active.length,
    delivered: delivered.length,
    totalTons: delivered.reduce((s, t) => s + t.tons, 0),
  };
}

// Get inventory alerts
export function getInventoryAlerts(inv: InvItem[]) {
  return inv.filter(i => i.stock < i.minStock).map(i => ({
    ...i,
    severity: i.stock < i.minStock * 0.5 ? "critical" : "low" as const,
  }));
}

// Get spare parts alerts
export function getSpareAlerts(parts: SparePart[]) {
  return parts.filter(p => p.stock < p.minStock).map(p => ({
    ...p,
    severity: p.stock < p.minStock * 0.5 ? "critical" : "low" as const,
  }));
}

// Generate order number
export function generateOrderNo() {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

// Export all data
export function exportAllData(data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plant-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Clear all data
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k as string));
}
