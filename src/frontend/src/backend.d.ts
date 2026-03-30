import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MenuItem {
    name: string;
    description: string;
    available: boolean;
    category: Type__1;
    price: bigint;
}
export interface SalesReport {
    averageOrderValue: bigint;
    dailyRevenue: bigint;
    orderCount: bigint;
    topSellingItems: Array<[bigint, bigint]>;
}
export interface ItemQuantity {
    itemId: bigint;
    quantity: bigint;
}
export interface BillSummary {
    total: bigint;
    orderId: bigint;
    discount: bigint;
    items: Array<ItemQuantity>;
    subtotal: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface OrderType {
    customerName: string;
    status: Type;
    total: bigint;
    tableNumber: bigint;
    orderId: bigint;
    timestamp: bigint;
    discount: bigint;
    items: Array<ItemQuantity>;
}
export enum Type {
    cancelled = "cancelled",
    pending = "pending",
    paid = "paid",
    processing = "processing"
}
export enum Type__1 {
    coldBrew = "coldBrew",
    latte = "latte",
    pastries = "pastries",
    espresso = "espresso"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addItemToOrder(orderId: bigint, itemId: bigint, quantity: bigint): Promise<void>;
    addMenuItem(item: MenuItem): Promise<bigint>;
    applyDiscount(orderId: bigint, discountPercent: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrder(name: string, tableNumber: bigint): Promise<bigint>;
    deleteMenuItem(id: bigint): Promise<void>;
    getAllOrders(): Promise<Array<OrderType>>;
    getBillSummary(orderId: bigint): Promise<BillSummary | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMenu(): Promise<Array<MenuItem>>;
    getMenuEntries(): Promise<Array<[bigint, MenuItem]>>;
    getMenuItem(id: bigint): Promise<MenuItem | null>;
    getOrder(orderId: bigint): Promise<OrderType | null>;
    getSalesReport(startTime: bigint, endTime: bigint): Promise<SalesReport>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeMenuIfEmpty(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMenuItem(id: bigint, item: MenuItem): Promise<void>;
    updateOrderStatus(orderId: bigint, status: Type): Promise<void>;
}
