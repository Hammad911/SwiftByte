import { PrismaClient, UserRole, DeliveryMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Mirrors `js/menu-data.js` (ids, prices, fees for DB seeding). */
const SEED = [
  {
    slug: "taco-cubano",
    name: "Taco Cubano",
    cuisine: "Mexican · Tacos · Fast food",
    deliveryFeePkr: 39,
    taxPercent: 5,
    minOrderPkr: 200,
    etaMins: 45,
    items: [
      { slug: "classic-beef-taco", name: "1. Classic Beef Taco", price: 260, photo: "assets/1.png", desc: "Seasoned ground beef, lettuce, cheddar cheese, and fresh salsa." },
      { slug: "chicken-street-taco", name: "2. Chicken Street Taco", price: 190, photo: "assets/2.png", desc: "Grilled chicken, onions, cilantro, lime, and house sauce." },
      { slug: "spicy-shrimp-taco", name: "3. Spicy Shrimp Taco", price: 260, photo: "assets/1.png", desc: "Chili-marinated shrimp, cabbage slaw, and chipotle sauce." }
    ]
  },
  {
    slug: "saltish",
    name: "Saltish",
    cuisine: "Healthy · Bowls · Poke",
    deliveryFeePkr: 49,
    taxPercent: 5,
    minOrderPkr: 350,
    etaMins: 32,
    items: [
      { slug: "grilled-chicken-bowl", name: "Grilled Chicken Bowl", price: 420, photo: "assets/5.jfif", desc: "Chicken, quinoa, greens, roasted veg, lemon herb dressing." },
      { slug: "salmon-poke-bowl", name: "Salmon Poke Bowl", price: 580, photo: "assets/8.jfif", desc: "Atlantic salmon, sushi rice, edamame, avocado, sesame soy." },
      { slug: "vegan-power-bowl", name: "Vegan Power Bowl", price: 380, photo: "assets/7.jfif", desc: "Chickpeas, sweet potato, kale, tahini, seeds, and pickles." }
    ]
  },
  {
    slug: "karahi-house",
    name: "Karahi House",
    cuisine: "Pakistani · BBQ · Karahi",
    deliveryFeePkr: 45,
    taxPercent: 5,
    minOrderPkr: 450,
    etaMins: 40,
    items: [
      { slug: "chicken-karahi-full", name: "Chicken Karahi (Full)", price: 1890, photo: "assets/4.jfif", desc: "Classic tomato–ginger karahi, family style." },
      { slug: "mutton-paye", name: "Mutton Paye (2 pcs)", price: 620, photo: "assets/1.png", desc: "Slow-simmered trotters, naan on the side." },
      { slug: "seekh-plate", name: "Seekh Kebab Plate", price: 540, photo: "assets/2.png", desc: "Four skewers, chutney, onions, lemon." }
    ]
  },
  {
    slug: "slice-street-pizza",
    name: "Slice Street Pizza",
    cuisine: "Italian · Pizza · Comfort",
    deliveryFeePkr: 59,
    taxPercent: 5,
    minOrderPkr: 400,
    etaMins: 30,
    items: [
      { slug: "margherita-large", name: "Margherita (Large)", price: 1190, photo: "assets/5.jfif", desc: "San Marzano sauce, mozzarella, basil, olive oil." },
      { slug: "pepperoni-loaded", name: "Pepperoni Feast", price: 1490, photo: "assets/8.jfif", desc: "Double pepperoni, mozzarella blend, chili honey drizzle." },
      { slug: "veg-supreme", name: "Veg Supreme", price: 1090, photo: "assets/7.jfif", desc: "Bell peppers, mushrooms, olives, sweet corn." }
    ]
  },
  {
    slug: "chai-lab",
    name: "Chai Lab",
    cuisine: "Cafe · Chai · Snacks",
    deliveryFeePkr: 35,
    taxPercent: 5,
    minOrderPkr: 250,
    etaMins: 25,
    items: [
      { slug: "karak-doodh-patti", name: "Karak Doodh Patti", price: 180, photo: "assets/1.png", desc: "Strong kettle chai, large cup." },
      { slug: "chicken-paratha-roll", name: "Chicken Paratha Roll", price: 320, photo: "assets/2.png", desc: "Malai boti, mint chutney, pickled onions." },
      { slug: "nutella-paratha", name: "Nutella Paratha", price: 260, photo: "assets/4.jfif", desc: "Crisp paratha, Nutella, crushed nuts." }
    ]
  }
] as const;

function dietTagsFor(slug: string): string[] {
  const map: Record<string, string[]> = {
    saltish: ["halal", "vegan-options", "healthy", "gluten-conscious"],
    "taco-cubano": ["halal"],
    "karahi-house": ["halal"],
    "slice-street-pizza": ["halal", "vegetarian-options"],
    "chai-lab": ["halal", "vegetarian-options"]
  };
  return map[slug] || ["halal"];
}

async function main() {
  const hash = await bcrypt.hash("demo1234", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@swiftbite.demo" },
    create: {
      email: "owner@swiftbite.demo",
      name: "Demo Restaurant Owner",
      passwordHash: hash,
      role: UserRole.RESTAURANT_OWNER,
      phone: "+925300000000"
    },
    update: {}
  });

  for (const r of SEED) {
    const cuisineTypes = r.cuisine.split(" · ").map((s) => s.trim());
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        ownerId: owner.id,
        name: r.name,
        description: r.cuisine,
        cuisineTypes,
        deliveryMode: DeliveryMode.DELIVERY,
        minOrder: r.minOrderPkr,
        prepTime: r.etaMins,
        commissionRate: 0.12,
        isOpen: true
      },
      update: {
        name: r.name,
        minOrder: r.minOrderPkr,
        prepTime: r.etaMins
      }
    });

    for (const it of r.items) {
      await prisma.menuItem.upsert({
        where: {
          restaurantId_slug: { restaurantId: restaurant.id, slug: it.slug }
        },
        create: {
          restaurantId: restaurant.id,
          slug: it.slug,
          name: it.name,
          description: it.desc,
          photo: it.photo,
          price: it.price,
          dietaryTags: dietTagsFor(r.slug),
          isAvailable: true
        },
        update: {
          name: it.name,
          price: it.price,
          description: it.desc,
          photo: it.photo
        }
      });
    }
  }

  console.log("Seed OK — restaurants:", SEED.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
