import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  Prisma,
  UserRole,
  RestaurantVerificationStatus,
  RestaurantApplicationStatus,
  DeliveryMode
} from "@prisma/client";

type JwtUser = { sub: string; email: string; role: UserRole };

export function registerPlatformRoutes(
  app: Express,
  prisma: PrismaClient,
  opts: { jwtSecret: string }
) {
  const { jwtSecret } = opts;

  function signToken(user: { id: string; email: string; role: UserRole }) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, jwtSecret, {
      expiresIn: "7d"
    });
  }

  function parseBearer(req: Request): JwtUser | null {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) return null;
    try {
      return jwt.verify(h.slice(7), jwtSecret) as JwtUser;
    } catch {
      return null;
    }
  }

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    const p = parseBearer(req);
    if (!p) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as Request & { auth: JwtUser }).auth = p;
    next();
  }

  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const p = parseBearer(req);
    if (!p || p.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    (req as Request & { auth: JwtUser; adminUserId: string }).adminUserId = p.sub;
    next();
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, phone } = req.body || {};
      if (!email || !password || !name) {
        res.status(400).json({ error: "email, password, name required" });
        return;
      }
      const r = (role as UserRole) || UserRole.CUSTOMER;
      if (!Object.values(UserRole).includes(r)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }
      const lower = String(email).toLowerCase().trim();
      const taken = await prisma.user.findUnique({ where: { email: lower } });
      if (taken) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const hash = await bcrypt.hash(String(password), 10);
      const riderApproved = r !== UserRole.RIDER ? true : false;
      const user = await prisma.user.create({
        data: {
          email: lower,
          passwordHash: hash,
          name: String(name).trim(),
          role: r,
          phone: phone ? String(phone).trim() : null,
          riderApproved
        }
      });
      const token = signToken(user);
      res.status(201).json({
        token,
        user: publicUser(user)
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ error: "email and password required" });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { email: String(email).toLowerCase().trim() }
      });
      if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      if (user.suspended) {
        res.status(403).json({ error: "Account suspended" });
        return;
      }
      const token = signToken(user);
      res.json({ token, user: publicUser(user) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const { auth } = req as Request & { auth: JwtUser };
    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  });

  app.get("/api/restaurants", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      const cuisine = String(req.query.cuisine || "").trim();
      const openOnly = req.query.openOnly === "1" || req.query.openOnly === "true";

      const where: Prisma.RestaurantWhereInput = {
        verificationStatus: RestaurantVerificationStatus.APPROVED,
        owner: { suspended: false }
      };
      if (openOnly) where.isOpen = true;
      if (cuisine) where.cuisineTypes = { has: cuisine };
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ];
      }

      const rows = await prisma.restaurant.findMany({
        where,
        take: 80,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { orders: true, menuItems: true } }
        }
      });

      const restaurants = rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.description,
        cuisineTypes: r.cuisineTypes,
        isOpen: r.isOpen,
        minOrder: Number(r.minOrder),
        prepTime: r.prepTime,
        rating: 4.5 + (r.slug.length % 5) * 0.1,
        deliveryFee: 35 + (r.prepTime % 25),
        deliveryTimeMins: r.prepTime + 12,
        menuItemCount: r._count.menuItems
      }));

      res.json({ restaurants });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/restaurant-applications", requireAuth, async (req, res) => {
    try {
      const { auth } = req as Request & { auth: JwtUser };
      const body = req.body || {};
      const name = String(body.name || "").trim();
      const proposedSlug = String(body.proposedSlug || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 64);
      if (!name || !proposedSlug) {
        res.status(400).json({ error: "name and proposedSlug required" });
        return;
      }
      const slugTaken = await prisma.restaurant.findUnique({ where: { slug: proposedSlug } });
      if (slugTaken) {
        res.status(409).json({ error: "That URL slug is already taken" });
        return;
      }
      const appRow = await prisma.restaurantApplication.create({
        data: {
          applicantId: auth.sub,
          name,
          description: body.description ? String(body.description) : null,
          proposedSlug,
          cuisineTypes: Array.isArray(body.cuisineTypes)
            ? body.cuisineTypes.map((x: unknown) => String(x)).filter(Boolean).slice(0, 12)
            : [],
          phone: body.phone ? String(body.phone) : null,
          message: body.message ? String(body.message) : null
        }
      });
      res.status(201).json({ application: appRow });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const [users, restaurants, orders, pendingApps, pendingRiders] = await Promise.all([
        prisma.user.count(),
        prisma.restaurant.count({ where: { verificationStatus: RestaurantVerificationStatus.APPROVED } }),
        prisma.order.count(),
        prisma.restaurantApplication.count({ where: { status: RestaurantApplicationStatus.PENDING } }),
        prisma.user.count({ where: { role: UserRole.RIDER, riderApproved: false } })
      ]);
      const gmv = await prisma.order.aggregate({ _sum: { total: true } });
      res.json({
        users,
        restaurants,
        orders,
        pendingRestaurantApplications: pendingApps,
        pendingRiderApprovals: pendingRiders,
        gmvApprox: Number(gmv._sum.total || 0)
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/restaurant-applications", requireAdmin, async (_req, res) => {
    const rows = await prisma.restaurantApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        applicant: { select: { id: true, email: true, name: true, role: true } }
      }
    });
    res.json({ applications: rows });
  });

  app.post("/api/admin/restaurant-applications/:id/approve", requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const adminUserId = (req as Request & { adminUserId: string }).adminUserId;

      await prisma.$transaction(async (tx) => {
        const appRow = await tx.restaurantApplication.findUnique({ where: { id } });
        if (!appRow || appRow.status !== RestaurantApplicationStatus.PENDING) {
          throw Object.assign(new Error("invalid_application"), { status: 400 });
        }
        const slug = appRow.proposedSlug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
        const clash = await tx.restaurant.findUnique({ where: { slug } });
        if (clash) {
          throw Object.assign(new Error("slug_taken"), { status: 409 });
        }
        const restaurant = await tx.restaurant.create({
          data: {
            slug: slug || `rest-${Date.now()}`,
            ownerId: appRow.applicantId,
            name: appRow.name,
            description: appRow.description,
            cuisineTypes: appRow.cuisineTypes.length ? appRow.cuisineTypes : ["General"],
            isOpen: false,
            deliveryMode: DeliveryMode.DELIVERY,
            minOrder: 0,
            prepTime: 30,
            commissionRate: 0.12,
            verificationStatus: RestaurantVerificationStatus.APPROVED
          }
        });
        await tx.user.update({
          where: { id: appRow.applicantId },
          data: { role: UserRole.RESTAURANT_OWNER }
        });
        await tx.restaurantApplication.update({
          where: { id },
          data: {
            status: RestaurantApplicationStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedById: adminUserId,
            restaurantId: restaurant.id
          }
        });
      });
      res.json({ ok: true });
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 400) return res.status(400).json({ error: "Invalid application" });
      if (err.status === 409) return res.status(409).json({ error: "Slug conflict" });
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/restaurant-applications/:id/reject", requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      const adminUserId = (req as Request & { adminUserId: string }).adminUserId;
      const note = String((req.body || {}).adminNote || "").trim();

      const appRow = await prisma.restaurantApplication.findUnique({ where: { id } });
      if (!appRow || appRow.status !== RestaurantApplicationStatus.PENDING) {
        res.status(400).json({ error: "Invalid application" });
        return;
      }

      await prisma.restaurantApplication.update({
        where: { id },
        data: {
          status: RestaurantApplicationStatus.REJECTED,
          adminNote: note || null,
          reviewedAt: new Date(),
          reviewedById: adminUserId
        }
      });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const role = req.query.role as UserRole | undefined;
    const rows = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        suspended: true,
        riderApproved: true
      }
    });
    res.json({ users: rows });
  });

  app.patch("/api/admin/users/:id/suspend", requireAdmin, async (req, res) => {
    const id = String(req.params.id || "").trim();
    const suspended = Boolean((req.body || {}).suspended);
    await prisma.user.update({ where: { id }, data: { suspended } });
    res.json({ ok: true });
  });

  app.post("/api/admin/riders/:id/approve", requireAdmin, async (req, res) => {
    const id = String(req.params.id || "").trim();
    await prisma.user.update({
      where: { id, role: UserRole.RIDER },
      data: { riderApproved: true }
    });
    res.json({ ok: true });
  });

  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const rows = await prisma.order.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        restaurant: { select: { slug: true, name: true } },
        customer: { select: { email: true, name: true } },
        rider: { select: { email: true, name: true } }
      }
    });
    res.json({
      orders: rows.map((o) => ({
        id: o.id,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        restaurant: o.restaurant,
        customer: o.customer,
        rider: o.rider
      }))
    });
  });

  app.get("/api/admin/restaurants", requireAdmin, async (_req, res) => {
    const rows = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      take: 200,
      include: {
        owner: { select: { email: true, name: true, id: true } }
      }
    });
    res.json({ restaurants: rows });
  });

  app.patch("/api/admin/restaurants/:id/verification", requireAdmin, async (req, res) => {
    const id = String(req.params.id || "").trim();
    const st = String((req.body || {}).status || "").trim() as RestaurantVerificationStatus;
    if (!Object.values(RestaurantVerificationStatus).includes(st)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    await prisma.restaurant.update({ where: { id }, data: { verificationStatus: st } });
    res.json({ ok: true });
  });
}

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  riderApproved: boolean;
  suspended: boolean;
  phone: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    riderApproved: user.riderApproved,
    suspended: user.suspended,
    phone: user.phone
  };
}
