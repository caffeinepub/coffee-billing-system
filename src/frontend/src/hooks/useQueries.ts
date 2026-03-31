import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MenuItem, OrderType, Type, UserRole } from "../backend.d";
import { useActor } from "./useActor";

export type MenuEntry = [bigint, MenuItem];

export function useMenu() {
  const { actor, isFetching } = useActor();
  return useQuery<MenuEntry[]>({
    queryKey: ["menu"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMenuEntries();
      return result as MenuEntry[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<OrderType[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useSalesReport(startTime: bigint, endTime: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sales", startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSalesReport(startTime, endTime);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: MenuItem) => {
      if (!actor) throw new Error("No actor");
      return actor.addMenuItem(item);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: MenuItem }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateMenuItem(id, item);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteMenuItem(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      tableNumber,
    }: { name: string; tableNumber: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.createOrder(name, tableNumber);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddItemToOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      quantity,
    }: { orderId: bigint; itemId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.addItemToOrder(orderId, itemId, quantity);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useApplyDiscount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      discount,
    }: { orderId: bigint; discount: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.applyDiscount(orderId, discount);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: Type }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useGetBillSummary(orderId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["bill", orderId?.toString()],
    queryFn: async () => {
      if (!actor || orderId === null) return null;
      return actor.getBillSummary(orderId);
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

export function useInitMenu() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.initializeMenuIfEmpty();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, role }: { user: any; role: UserRole }) => {
      if (!actor) throw new Error("No actor");
      return actor.assignCallerUserRole(user, role);
    },
  });
}
