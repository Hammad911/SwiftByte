/**
 * SwiftBite — canonical restaurant / menu data (Phase 1–2 data layer).
 * Pages resolve records via URL query params (?r=…&item=…).
 */
(function (global) {
  /** @typedef {{ id: string, name: string, description: string, price: number, image: string }} MenuItem */
  /** @typedef {{ id: string, name: string, bannerClass: string, bannerTitle: string, subtitle: string, cuisine: string, ratingLine: string, deliveryLine: string, hoursLine: string, deliveryFeePkr: number, taxPercent: number, minOrderPkr: number, etaMins: number, items: MenuItem[] }} Restaurant */

  /** @type {Restaurant[]} */
  const RESTAURANTS = [
    {
      id: "taco-cubano",
      name: "Taco Cubano",
      bannerClass: "taco-banner",
      bannerTitle: "LET'S TACO<br>BOUT IT!!",
      subtitle: "An authentic mexican touch and delicious!",
      cuisine: "Mexican · Tacos · Fast food",
      ratingLine: "⭐ Excellent 9.5",
      deliveryLine: "🕒 Delivery in 40-50 min",
      hoursLine: "⏰ 10:00 - 22:00",
      pickupAddressLine: "Taco Cubano · Block D, NUST H-12 Commercial, Islamabad",
      deliveryFeePkr: 39,
      taxPercent: 5,
      minOrderPkr: 200,
      etaMins: 45,
      items: [
        {
          id: "classic-beef-taco",
          name: "1. Classic Beef Taco",
          description: "Seasoned ground beef, lettuce, cheddar cheese, and fresh salsa.",
          price: 260,
          image: "assets/1.png"
        },
        {
          id: "chicken-street-taco",
          name: "2. Chicken Street Taco",
          description: "Grilled chicken, onions, cilantro, lime, and house sauce.",
          price: 190,
          image: "assets/2.png"
        },
        {
          id: "spicy-shrimp-taco",
          name: "3. Spicy Shrimp Taco",
          description: "Chili-marinated shrimp, cabbage slaw, and chipotle sauce.",
          price: 260,
          image: "assets/1.png"
        }
      ]
    },
    {
      id: "saltish",
      name: "Saltish",
      bannerClass: "saltish-banner",
      bannerTitle: "FRESH<br>BOWLS",
      subtitle: "Fresh and healthy meals.",
      cuisine: "Healthy · Bowls · Poke",
      ratingLine: "⭐ Very good 8.0",
      deliveryLine: "🕒 Delivery in ~30 min",
      hoursLine: "⏰ 09:00 - 21:00",
      pickupAddressLine: "Saltish Kitchen · Jinnah Super Market, F-7 Markaz, Islamabad",
      deliveryFeePkr: 49,
      taxPercent: 5,
      minOrderPkr: 350,
      etaMins: 32,
      items: [
        {
          id: "grilled-chicken-bowl",
          name: "Grilled Chicken Bowl",
          description: "Chicken, quinoa, greens, roasted veg, lemon herb dressing.",
          price: 420,
          image: "assets/5.jfif"
        },
        {
          id: "salmon-poke-bowl",
          name: "Salmon Poke Bowl",
          description: "Atlantic salmon, sushi rice, edamame, avocado, sesame soy.",
          price: 580,
          image: "assets/8.jfif"
        },
        {
          id: "vegan-power-bowl",
          name: "Vegan Power Bowl",
          description: "Chickpeas, sweet potato, kale, tahini, seeds, and pickles.",
          price: 380,
          image: "assets/7.jfif"
        }
      ]
    },
    {
      id: "karahi-house",
      name: "Karahi House",
      bannerClass: "karahi-banner",
      bannerTitle: "SIZZLING<br>DESI KARAHI",
      subtitle: "Charcoal smoke, slow-cooked gravies, fresh roti.",
      cuisine: "Pakistani · BBQ · Karahi",
      ratingLine: "⭐ Top 9.2",
      deliveryLine: "🕒 Delivery in 35–45 min",
      hoursLine: "⏰ 11:30 - 23:30",
      pickupAddressLine: "Karahi House · F-10 Markaz, Islamabad",
      deliveryFeePkr: 45,
      taxPercent: 5,
      minOrderPkr: 450,
      etaMins: 40,
      items: [
        {
          id: "chicken-karahi-full",
          name: "Chicken Karahi (Full)",
          description: "Classic tomato–ginger karahi, family style.",
          price: 1890,
          image: "assets/4.jfif"
        },
        {
          id: "mutton-paye",
          name: "Mutton Paye (2 pcs)",
          description: "Slow-simmered trotters, naan on the side.",
          price: 620,
          image: "assets/1.png"
        },
        {
          id: "seekh-plate",
          name: "Seekh Kebab Plate",
          description: "Four skewers, chutney, onions, lemon.",
          price: 540,
          image: "assets/2.png"
        }
      ]
    },
    {
      id: "slice-street-pizza",
      name: "Slice Street Pizza",
      bannerClass: "pizza-banner",
      bannerTitle: "HOT<br>SLICES",
      subtitle: "Thin crust, wood-fired flavour, fast slices.",
      cuisine: "Italian · Pizza · Comfort",
      ratingLine: "⭐ Very good 8.7",
      deliveryLine: "🕒 Delivery in 25–35 min",
      hoursLine: "⏰ 12:00 - 02:00",
      pickupAddressLine: "Slice Street · Giga Mall, DHA II, Islamabad",
      deliveryFeePkr: 59,
      taxPercent: 5,
      minOrderPkr: 400,
      etaMins: 30,
      items: [
        {
          id: "margherita-large",
          name: "Margherita (Large)",
          description: "San Marzano sauce, mozzarella, basil, olive oil.",
          price: 1190,
          image: "assets/5.jfif"
        },
        {
          id: "pepperoni-loaded",
          name: "Pepperoni Feast",
          description: "Double pepperoni, mozzarella blend, chili honey drizzle.",
          price: 1490,
          image: "assets/8.jfif"
        },
        {
          id: "veg-supreme",
          name: "Veg Supreme",
          description: "Bell peppers, mushrooms, olives, sweet corn.",
          price: 1090,
          image: "assets/7.jfif"
        }
      ]
    },
    {
      id: "chai-lab",
      name: "Chai Lab",
      bannerClass: "chai-banner",
      bannerTitle: "BREWED<br>CHAIS",
      subtitle: "Karak chai, paratha rolls, and midnight snacks.",
      cuisine: "Cafe · Chai · Snacks",
      ratingLine: "⭐ Loved 9.0",
      deliveryLine: "🕒 Delivery in 20–30 min",
      hoursLine: "⏰ 07:00 - 02:00",
      pickupAddressLine: "Chai Lab · I-8 Markaz, Islamabad",
      deliveryFeePkr: 35,
      taxPercent: 5,
      minOrderPkr: 250,
      etaMins: 25,
      items: [
        {
          id: "karak-doodh-patti",
          name: "Karak Doodh Patti",
          description: "Strong kettle chai, large cup.",
          price: 180,
          image: "assets/1.png"
        },
        {
          id: "chicken-paratha-roll",
          name: "Chicken Paratha Roll",
          description: "Malai boti, mint chutney, pickled onions.",
          price: 320,
          image: "assets/2.png"
        },
        {
          id: "nutella-paratha",
          name: "Nutella Paratha",
          description: "Crisp paratha, Nutella, crushed nuts.",
          price: 260,
          image: "assets/4.jfif"
        }
      ]
    }
  ];

  function extractRating(line) {
    const m = String(line || "").match(/(\d+(?:\.\d+)?)\s*$/);
    return m ? Number(m[1]) : 8.5;
  }

  /** @param {typeof RESTAURANTS[0]} base */
  function enrich(base) {
    /** @type {Record<string, string[]>} */
    const dietById = {
      saltish: ["halal", "vegan-options", "healthy", "gluten-conscious"],
      "taco-cubano": ["halal"],
      "karahi-house": ["halal"],
      "slice-street-pizza": ["halal", "vegetarian-options"],
      "chai-lab": ["halal", "vegetarian-options"]
    };
    return {
      ...base,
      ratingValue: typeof base.ratingValue === "number" ? base.ratingValue : extractRating(base.ratingLine),
      dietTags: dietById[base.id] || ["halal"]
    };
  }

  function allRestaurants() {
    return RESTAURANTS.map((r) => enrich(r));
  }

  /** @param {string} id */
  function getRestaurant(id) {
    const key = (id || "").trim();
    const base = RESTAURANTS.find((r) => r.id === key) || RESTAURANTS[0];
    return enrich(base);
  }

  /**
   * @param {string} restaurantId
   * @param {string} itemId
   */
  function getMenuItem(restaurantId, itemId) {
    const r = getRestaurant(restaurantId);
    const iid = (itemId || "").trim();
    return r.items.find((i) => i.id === iid) || r.items[0];
  }

  global.SwiftBiteMenu = {
    RESTAURANTS,
    allRestaurants,
    getRestaurant,
    getMenuItem
  };
})(window);
