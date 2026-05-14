import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  OrderCancelKind,
  OrderStatus,
  Prisma,
  PrismaClient,
  UserRole
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3333);

const orderInclude = {
  restaurant: true,
  orderItems: { include: { menuItem: true } }
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

type LegacyItemsJson = {
  frontend?: Record<string, unknown>;
  cancelDetail?: { variant?: string; declineReason?: string };
};

const FE = {
  PENDING_RESTAURANT: "pending_restaurant",
  DECLINED: "declined",
  CANCELLED_BY_CUSTOMER: "cancelled_by_customer",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "ready_for_pickup",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered"
} as const;

function num(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0;
  return Number(d);
}

function extrasFromCust(c: Prisma.JsonValue | null | undefined): string | undefined {
  if (!c || typeof c !== "object") return undefined;
  const note = (c as { note?: string }).note;
  return typeof note === "string" && note.trim() ? note.trim() : undefined;
}

function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

function dbToFrontendStatus(order: {
  status: OrderStatus;
  cancelKind: OrderCancelKind;
  items: Prisma.JsonValue | null;
}): string {
  const legacy = (order.items || {}) as LegacyItemsJson;
  const legacyVariant = legacy.cancelDetail?.variant;
  if (order.status === OrderStatus.CANCELLED) {
    if (
      order.cancelKind === OrderCancelKind.RESTAURANT_DECLINED ||
      legacyVariant === "declined"
    ) {
      return FE.DECLINED;
    }
    if (
      order.cancelKind === OrderCancelKind.CUSTOMER_CANCELLED ||
      legacyVariant === "cancelled_by_customer"
    ) {
      return FE.CANCELLED_BY_CUSTOMER;
    }
    return FE.DECLINED;
  }
  switch (order.status) {
    case OrderStatus.PENDING:
    case OrderStatus.AWAITING_RESTAURANT:
    case OrderStatus.ACCEPTED:
      return FE.PENDING_RESTAURANT;
    case OrderStatus.PREPARING:
      return FE.PREPARING;
    case OrderStatus.READY_FOR_PICKUP:
      return FE.READY_FOR_PICKUP;
    case OrderStatus.OUT_FOR_DELIVERY:
      return FE.PICKED_UP;
    case OrderStatus.DELIVERED:
      return FE.DELIVERED;
    default:
      return FE.PENDING_RESTAURANT;
  }
}

function frontendToDb(
  status: string
): { status: OrderStatus; cancelApply?: OrderCancelKind } {
  switch (status) {
    case FE.PENDING_RESTAURANT:
    case "placed":
      return { status: OrderStatus.AWAITING_RESTAURANT };
    case FE.PREPARING:
      return { status: OrderStatus.PREPARING };
    case FE.READY_FOR_PICKUP:
      return { status: OrderStatus.READY_FOR_PICKUP };
    case FE.PICKED_UP:
      return { status: OrderStatus.OUT_FOR_DELIVERY };
    case FE.DELIVERED:
      return { status: OrderStatus.DELIVERED };
    case FE.DECLINED:
      return { status: OrderStatus.CANCELLED, cancelApply: OrderCancelKind.RESTAURANT_DECLINED };
    case FE.CANCELLED_BY_CUSTOMER:
      return {
        status: OrderStatus.CANCELLED,
        cancelApply: OrderCancelKind.CUSTOMER_CANCELLED
      };
    default:
      return { status: OrderStatus.PREPARING };
  }
}

function linesFromOrder(order: OrderRow): unknown[] {
  if (order.orderItems.length > 0) {
    const rid = order.restaurant.slug;
    return order.orderItems.map((oi) => {
      const q = Math.max(1, oi.quantity);
      const unit = num(oi.price) / q;
      const ex = extrasFromCust(oi.customisations);
      return {
        restaurantId: rid,
        itemId: oi.menuItem.slug || oi.menuItem.id,
        name: oi.menuItem.name,
        unitPrice: unit,
        quantity: q,
        ...(ex ? { extrasNote: ex } : {})
      };
    });
  }
  const j = ((order.items || {}) as LegacyItemsJson).frontend || {};
  return Array.isArray(j.lines) ? j.lines : [];
}

function orderToApiRecord(order: OrderRow) {
  const j = ((order.items || {}) as LegacyItemsJson).frontend || {};
  const status = dbToFrontendStatus(order);
  const createdAt = order.createdAt.getTime();
  const statusUpdatedAt = order.updatedAt.getTime();

  const declineReason = firstStr(
    order.declineReason,
    j.declineReason,
    (order.items as LegacyItemsJson | null)?.cancelDetail?.declineReason
  );

  return {
    id: order.id,
    createdAt,
    statusUpdatedAt,
    restaurantId: order.restaurant.slug,
    restaurantName: firstStr(order.restaurantNameSnap, j.restaurantName as string, order.restaurant.name),
    lines: linesFromOrder(order),
    addressLine: firstStr(order.deliveryAddressLine, j.addressLine as string),
    flatOrBlock: firstStr(order.deliveryFlatBlock, j.flatOrBlock as string),
    phone: firstStr(order.deliveryPhone, j.phone as string),
    instructions: firstStr(order.deliveryInstructions, j.instructions as string),
    subtotal: num(order.subtotal),
    deliveryFee: num(order.deliveryFee),
    tax: num(order.taxAmount) || (typeof j.tax === "number" ? j.tax : 0),
    total: num(order.total),
    status,
    etaMinutes:
      typeof order.etaMinutes === "number"
        ? order.etaMinutes
        : typeof j.etaMinutes === "number"
          ? j.etaMinutes
          : 35,
    declineReason: declineReason || undefined,
    voucherCode: firstStr(order.voucherCode, j.voucherCode as string) || undefined,
    discountAmount: num(order.discount) || (typeof j.discountAmount === "number" ? j.discountAmount : 0),
    scheduledFor:
      order.scheduledFor?.toISOString() ||
      (typeof j.scheduledFor === "string" ? j.scheduledFor : undefined),
    loyaltyPointsRedeemed:
      typeof order.loyaltyPointsRedeemed === "number"
        ? order.loyaltyPointsRedeemed
        : typeof j.loyaltyPointsRedeemed === "number"
          ? j.loyaltyPointsRedeemed
          : undefined,
    loyaltyDiscountPkr:
      order.loyaltyDiscountPkr != null
        ? num(order.loyaltyDiscountPkr)
        : typeof j.loyaltyDiscountPkr === "number"
          ? j.loyaltyDiscountPkr
          : undefined,
    groupOrderId: firstStr(order.groupOrderId, j.groupOrderId as string) || undefined
  };
}

async function ensureUser(clientUid: string, email: string | null | undefined, displayName: string) {
  const uid = String(clientUid || "").trim();
  if (!uid) throw new Error("Missing client uid");

  const byUid = await prisma.user.findFirst({ where: { clientUid: uid } });
  if (byUid) return byUid;

  const em = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
  if (em) {
    const byEmail = await prisma.user.findUnique({ where: { email: em } });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { clientUid: uid }
      });
    }
  }

  const syntheticEmail =
    em || `${uid.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 48) || "guest"}@guest.swiftbite.demo`;
  const hash = await bcrypt.hash("guest-no-login", 8);

  return prisma.user.create({
    data: {
      clientUid: uid,
      email: syntheticEmail,
      name: displayName || "SwiftBite customer",
      passwordHash: hash,
      role: UserRole.CUSTOMER
    }
  });
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/orders/me", async (req, res) => {
  const clientUid = String(req.header("x-swiftbite-client-uid") || "").trim();
  if (!clientUid) {
    res.status(400).json({ error: "Missing X-SwiftBite-Client-Uid" });
    return;
  }
  const user = await prisma.user.findFirst({ where: { clientUid } });
  if (!user) {
    res.json({ orders: [] });
    return;
  }
  const rows = await prisma.order.findMany({
    where: { customerId: user.id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 80
  });
  res.json({ orders: rows.map(orderToApiRecord) });
});

app.get("/api/orders/by-restaurant/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) {
    res.status(400).json({ error: "Missing slug" });
    return;
  }
  const rest = await prisma.restaurant.findUnique({ where: { slug } });
  if (!rest) {
    res.json({ orders: [] });
    return;
  }
  const rows = await prisma.order.findMany({
    where: { restaurantId: rest.id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 120
  });
  res.json({ orders: rows.map(orderToApiRecord) });
});

app.get("/api/orders/delivery-demo", async (_req, res) => {
  const rows = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY] }
    },
    include: orderInclude,
    orderBy: { createdAt: "asc" },
    take: 120
  });
  res.json({ orders: rows.map(orderToApiRecord) });
});

app.get("/api/orders/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const row = await prisma.order.findUnique({
    where: { id },
    include: orderInclude
  });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ order: orderToApiRecord(row) });
});

app.post("/api/orders", async (req, res) => {
  try {
    const clientUid = String(req.header("x-swiftbite-client-uid") || "").trim();
    const email = req.header("x-swiftbite-email") || undefined;
    const body = req.body || {};

    if (!clientUid) {
      res.status(400).json({ error: "Missing X-SwiftBite-Client-Uid" });
      return;
    }

    const restaurantSlug = String(body.restaurantId || "").trim();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!restaurantSlug || !lines.length) {
      res.status(400).json({ error: "Invalid order payload" });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { slug: restaurantSlug } });
    if (!restaurant) {
      res.status(400).json({ error: `Unknown restaurant: ${restaurantSlug}` });
      return;
    }

    const customer = await ensureUser(
      clientUid,
      email,
      String(body.customerName || "SwiftBite customer")
    );

    const orderItemsData: {
      menuItemId: string;
      quantity: number;
      price: number;
      customisations?: object;
    }[] = [];

    for (const line of lines) {
      const itemSlug = String(line.itemId || "").trim();
      const menuItem = await prisma.menuItem.findFirst({
        where: { restaurantId: restaurant.id, slug: itemSlug }
      });
      if (!menuItem) {
        res.status(400).json({ error: `Unknown menu item: ${itemSlug}` });
        return;
      }
      const qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
      const unit = Number(line.unitPrice) || num(menuItem.price);
      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity: qty,
        price: unit * qty,
        customisations: line.extrasNote ? { note: String(line.extrasNote) } : undefined
      });
    }

    const subtotal = Number(body.subtotal) || 0;
    const deliveryFee = Number(body.deliveryFee) || 0;
    const discount = Number(body.discountAmount) || 0;
    const total = Number(body.total) || 0;
    const taxAmount = Number(body.tax) || 0;
    const etaM = Number(body.etaMinutes) || restaurant.prepTime;

    const scheduledFor =
      body.scheduledFor && String(body.scheduledFor)
        ? new Date(String(body.scheduledFor))
        : null;

    const loyaltyPkr =
      typeof body.loyaltyDiscountPkr === "number" && body.loyaltyDiscountPkr > 0
        ? body.loyaltyDiscountPkr
        : null;
    const loyaltyPts =
      typeof body.loyaltyPointsRedeemed === "number" && body.loyaltyPointsRedeemed > 0
        ? Math.floor(body.loyaltyPointsRedeemed)
        : null;

    const created = await prisma.order.create({
      data: {
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: OrderStatus.AWAITING_RESTAURANT,
        cancelKind: OrderCancelKind.NONE,
        declineReason: null,
        restaurantNameSnap: String(body.restaurantName || restaurant.name),
        deliveryAddressLine: String(body.addressLine || ""),
        deliveryFlatBlock: String(body.flatOrBlock || ""),
        deliveryPhone: String(body.phone || ""),
        deliveryInstructions: String(body.instructions || ""),
        etaMinutes: etaM,
        taxAmount,
        voucherCode: body.voucherCode ? String(body.voucherCode) : null,
        groupOrderId: body.groupOrderId ? String(body.groupOrderId) : null,
        loyaltyPointsRedeemed: loyaltyPts,
        loyaltyDiscountPkr: loyaltyPkr,
        subtotal,
        deliveryFee,
        discount,
        total,
        scheduledFor: scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor : null,
        orderItems: {
          create: orderItemsData
        }
      },
      include: orderInclude
    });

    res.status(201).json({ order: orderToApiRecord(created) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const status = String((req.body || {}).status || "").trim();
    const declineReason =
      typeof (req.body || {}).declineReason === "string"
        ? String((req.body || {}).declineReason).trim()
        : "";

    if (!id || !status) {
      res.status(400).json({ error: "Missing id or status" });
      return;
    }

    const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const conv = frontendToDb(status);
    const isCancelled = conv.status === OrderStatus.CANCELLED;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: conv.status,
        ...(isCancelled && conv.cancelApply
          ? {
              cancelKind: conv.cancelApply,
              ...(declineReason ? { declineReason } : {})
            }
          : {
              cancelKind: OrderCancelKind.NONE,
              declineReason: null
            })
      },
      include: orderInclude
    });

    res.json({ order: orderToApiRecord(updated) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`SwiftBite API http://127.0.0.1:${PORT}`);
});
