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
    }
  ];

  /** @param {string} id */
  function getRestaurant(id) {
    const key = (id || "").trim();
    return RESTAURANTS.find((r) => r.id === key) || RESTAURANTS[0];
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
    getRestaurant,
    getMenuItem
  };
})(window);
