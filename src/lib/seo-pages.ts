import type { Metadata } from "next";

// Content for the public, search-targeted service pages rendered by
// src/components/seo/ServiceLandingPage.tsx. Each page targets one group of
// search phrases (see `keywords`). Keep facts in sync with the landing page,
// Terms of Service and the payout shares in src/lib/utils.ts.

export const SITE_URL = "https://www.okoatime.com";

export type SeoPage = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  breadcrumb: string;
  eyebrow: string;
  h1: string;
  intro: string;
  cta: { label: string; href: string };
  closing: string;
  // schema.org serviceType; omitted for partner/recruitment pages.
  serviceType?: string;
  highlights: { title: string; body: string }[];
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  faqs: { q: string; a: string }[];
  related: SeoSlug[];
};

export type SeoSlug =
  | "boat-transport-lamu"
  | "grocery-delivery-shela"
  | "seafood-delivery-lamu"
  | "become-a-rider"
  | "sell-on-okoatime";

const ORDER = { label: "Order now", href: "/dashboard/order/new" };
const JOIN = { label: "Sign up free", href: "/register" };

export const SEO_PAGES: Record<SeoSlug, SeoPage> = {
  "boat-transport-lamu": {
    slug: "boat-transport-lamu",
    title: "Boat Transport in Lamu — Book a Boat to Shela & Manda",
    description:
      "Book a boat in Lamu with OkoaTime. Lamu–Shela, Shela–Manda and custom routes with local boat operators. See the price per trip before you book and pay with M-Pesa.",
    keywords: [
      "boat transport Lamu", "boat taxi Lamu", "Lamu to Shela boat", "Shela to Manda boat",
      "Manda Island boat", "boat hire Lamu", "boti Lamu",
    ],
    breadcrumb: "Boat Transport",
    eyebrow: "Lamu · Shela · Manda",
    h1: "Boat Transport in Lamu, Shela & Manda",
    intro:
      "In Lamu the road is the water. OkoaTime lets you book a boat with a local operator from your phone — for the Lamu–Shela run, a crossing to Manda Island, or a custom trip — and pay with M-Pesa.",
    cta: { label: "Book a boat", href: "/dashboard/order/new" },
    closing: "Need a boat? Book it in a few taps.",
    serviceType: "Boat transport",
    highlights: [
      { title: "Local boat operators", body: "Every operator on OkoaTime is a vetted local who knows these waters." },
      { title: "Price shown up front", body: "Each boat lists its price per trip and capacity, so there's no haggling at the jetty." },
      { title: "Pay with M-Pesa", body: "Pay by M-Pesa STK push or to our Till number. No card or cash needed." },
      { title: "Book from your phone", body: "Arrange your crossing before you reach the waterfront." },
    ],
    sections: [
      {
        heading: "Routes we cover",
        paragraphs: [
          "Boats on OkoaTime run the crossings people in the Lamu archipelago make every day. If your trip isn't listed, ask for a custom route.",
        ],
        bullets: [
          "Lamu Town ↔ Shela",
          "Shela ↔ Manda Island",
          "Lamu Town ↔ Manda Island",
          "Custom routes around the archipelago",
        ],
      },
      {
        heading: "Who books boats with OkoaTime",
        bullets: [
          "Travellers crossing to Manda Island, where Lamu's airport is",
          "Guests staying in Shela villas and guesthouses",
          "Residents of Shela and Manda heading into Lamu Town",
          "Groups and families who need a whole boat",
        ],
      },
      {
        heading: "Boats also carry your deliveries",
        paragraphs: [
          "When you order seafood, groceries or household items to Shela or Manda, a rider can take your order to the jetty and a boat operator brings it across for the last leg. You see one delivery fee at checkout and can track the order the whole way.",
        ],
      },
      {
        heading: "Weather and sea conditions",
        paragraphs: [
          "Crossings depend on the weather and the sea. If conditions are unsafe, your operator may delay the trip — your safety comes first.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much does a boat from Lamu to Shela cost?",
        a: "Each boat operator sets their own price per trip, and it is shown on the boat's listing before you book. You pay that price through M-Pesa.",
      },
      {
        q: "Can I book a boat to Manda Island?",
        a: "Yes. Shela–Manda and Lamu Town–Manda are routes we cover. If you are catching a flight, book ahead and allow extra time for weather.",
      },
      {
        q: "How many people fit on a boat?",
        a: "Every boat lists its passenger capacity, so you can pick one that fits your group.",
      },
      {
        q: "How do I pay?",
        a: "Pay with M-Pesa — either an STK push to your phone or directly to the OkoaTime Till number.",
      },
      {
        q: "I own a boat. Can I join OkoaTime?",
        a: "Yes. Boat operators can list their boat, take bookings and carry deliveries. See the Sell on OkoaTime page.",
      },
    ],
    related: ["grocery-delivery-shela", "seafood-delivery-lamu", "sell-on-okoatime"],
  },

  "grocery-delivery-shela": {
    slug: "grocery-delivery-shela",
    title: "Grocery Delivery in Shela & Lamu — Fruits, Veg & Household Items",
    description:
      "Groceries, fresh fruit and vegetables and household items delivered in Shela, Lamu Town and Manda Island in 30–60 minutes. Pay with M-Pesa and track your rider live.",
    keywords: [
      "grocery delivery Shela", "grocery delivery Lamu", "fruit and vegetable delivery Lamu",
      "villa supplies Shela", "household items delivery Lamu", "mboga delivery Lamu",
    ],
    breadcrumb: "Grocery Delivery",
    eyebrow: "Groceries · Fruit & Veg · Household",
    h1: "Grocery Delivery in Shela, Lamu & Manda",
    intro:
      "Staying in a Shela villa or living in Lamu Town? Order your groceries on OkoaTime and a local rider picks them up from Lamu's shops and mama mbogas and brings them to your door — usually within 30 to 60 minutes.",
    cta: ORDER,
    closing: "Skip the trip to town. Get your groceries delivered.",
    serviceType: "Grocery delivery",
    highlights: [
      { title: "30–60 minute delivery", body: "Across Lamu Town, Shela and Manda Island." },
      { title: "From local shops", body: "Fresh produce from local mama mbogas and everyday goods from trusted Lamu shops." },
      { title: "Pay with M-Pesa", body: "M-Pesa STK push or our Till number. No card needed." },
      { title: "Live tracking", body: "Watch your rider on the map until your order arrives." },
    ],
    sections: [
      {
        heading: "What you can order",
        bullets: [
          "Pantry staples: rice, flour, cereals, legumes, cooking oil, sugar, salt and spices",
          "Drinks and snacks",
          "Fresh fruit, vegetables, leafy greens and herbs",
          "Household goods: detergents, cleaning supplies, toiletries, paper products and kitchenware",
        ],
      },
      {
        heading: "Stocking a villa or holiday home",
        paragraphs: [
          "Shela and Manda are a boat ride from Lamu Town's shops. Instead of carrying bags across the water, place one order and we bring it to you — by bike to the jetty and by boat for the last leg when needed.",
        ],
      },
      {
        heading: "How it works",
        bullets: [
          "Choose House Shopping, Fruits & Vegetables or Household Items and add what you need",
          "Enter your delivery address and pay with M-Pesa",
          "A nearby rider picks up your order and you track them live until it arrives",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you deliver groceries to Shela?",
        a: "Yes. We deliver groceries, fruit and vegetables and household items to Shela, Lamu Town and Manda Island.",
      },
      {
        q: "How long does grocery delivery take?",
        a: "Most orders arrive within 30 to 60 minutes. Deliveries that need a boat crossing can take a little longer, especially in rough weather.",
      },
      {
        q: "How much is the delivery fee?",
        a: "The delivery fee depends on your delivery area and is shown at checkout before you pay.",
      },
      {
        q: "How do I pay?",
        a: "Pay with M-Pesa, either by STK push to your phone or to the OkoaTime Till number.",
      },
      {
        q: "Je, mnaleta mboga na matunda Shela?",
        a: "Ndiyo. Tunaleta mboga, matunda na bidhaa za nyumbani Shela, Lamu mjini na Manda. Unalipa kwa M-Pesa.",
      },
    ],
    related: ["seafood-delivery-lamu", "boat-transport-lamu", "sell-on-okoatime"],
  },

  "seafood-delivery-lamu": {
    slug: "seafood-delivery-lamu",
    title: "Fresh Seafood Delivery in Lamu — Fish, Prawns, Crab & Lobster",
    description:
      "Fresh fish, prawns, crab, lobster and octopus from Lamu suppliers, delivered to Lamu Town, Shela and Manda Island. Order online, pay with M-Pesa and track your rider live.",
    keywords: [
      "seafood delivery Lamu", "fresh fish Lamu", "fish delivery Shela", "lobster Lamu",
      "prawns Lamu", "samaki Lamu",
    ],
    breadcrumb: "Seafood Delivery",
    eyebrow: "Fish · Prawns · Crab · Lobster",
    h1: "Fresh Seafood Delivery in Lamu",
    intro:
      "Lamu's fish comes in at dawn. OkoaTime connects you with local seafood suppliers so you can order fish, prawns, crab, lobster, octopus and squid and have them delivered to your door in Lamu Town, Shela or Manda.",
    cta: ORDER,
    closing: "Today's catch, delivered to your door.",
    serviceType: "Seafood delivery",
    highlights: [
      { title: "From Lamu suppliers", body: "Seafood from local fishermen and fish sellers, not a distant warehouse." },
      { title: "30–60 minute delivery", body: "Across Lamu Town, Shela and Manda Island." },
      { title: "Pay with M-Pesa", body: "M-Pesa STK push or our Till number." },
      { title: "Live tracking", body: "Follow your rider on the map so you're ready when the fish arrives." },
    ],
    sections: [
      {
        heading: "What you can order",
        bullets: [
          "Fresh fish",
          "Prawns and crab",
          "Lobster",
          "Octopus and squid",
          "Other shellfish",
          "Dried fish",
        ],
      },
      {
        heading: "Order early for the best choice",
        paragraphs: [
          "Fresh fish lands in the morning. Order earlier in the day for the widest choice; popular items like lobster and prawns can sell out.",
        ],
      },
      {
        heading: "If something isn't right",
        paragraphs: [
          "If your seafood arrives damaged, spoiled or missing, contact us and we'll sort it out under our Return & Refund Policy.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where does the seafood come from?",
        a: "From local seafood suppliers in Lamu who sell through OkoaTime. Riders collect your order from the supplier and bring it straight to you.",
      },
      {
        q: "Do you deliver seafood to Shela and Manda?",
        a: "Yes. We deliver to Lamu Town, Shela and Manda Island. Orders to Shela and Manda may finish the journey by boat.",
      },
      {
        q: "How do I pay?",
        a: "Pay with M-Pesa, either by STK push to your phone or to the OkoaTime Till number.",
      },
      {
        q: "What if my order is not fresh?",
        a: "Contact us right away. Damaged, spoiled or missing items are handled under our Return & Refund Policy.",
      },
      {
        q: "Naweza kuagiza samaki Lamu kupitia OkoaTime?",
        a: "Ndiyo. Agiza samaki, kamba, kaa na pweza, ulipe kwa M-Pesa, na tutakuletea Lamu mjini, Shela au Manda.",
      },
    ],
    related: ["grocery-delivery-shela", "boat-transport-lamu", "sell-on-okoatime"],
  },

  "become-a-rider": {
    slug: "become-a-rider",
    title: "Rider Jobs in Lamu — Earn Delivering with OkoaTime",
    description:
      "Earn money delivering orders in Lamu Town, Shela and Manda. OkoaTime riders keep 70% of every delivery fee and get paid via M-Pesa. Bicycle, motorbike or on foot — sign up free.",
    keywords: [
      "rider jobs Lamu", "delivery jobs Lamu", "boda boda jobs Lamu", "jobs in Lamu",
      "kazi Lamu", "delivery rider Kenya",
    ],
    breadcrumb: "Become a Rider",
    eyebrow: "Earn with OkoaTime",
    h1: "Become an OkoaTime Rider in Lamu",
    intro:
      "Riders are the heart of OkoaTime. If you know Lamu's streets, you can earn by picking up orders from local suppliers and delivering them to customers across the island.",
    cta: JOIN,
    closing: "Know Lamu? Start earning with OkoaTime.",
    highlights: [
      { title: "Keep 70% of the delivery fee", body: "On every order you deliver from pickup to the customer." },
      { title: "Bicycle, motorbike or on foot", body: "You don't need a motorbike to start." },
      { title: "Paid via M-Pesa", body: "Request a payout from the app and receive it on M-Pesa." },
      { title: "Track your earnings", body: "See every delivery and what you earned in your rider dashboard." },
    ],
    sections: [
      {
        heading: "How much you earn",
        paragraphs: [
          "You keep 70% of the delivery fee on every order you deliver. When an order continues to Shela or Manda by boat, you take it to the jetty and keep 40% of the delivery fee, and the boat operator earns 30% for the water leg.",
        ],
      },
      {
        heading: "What you need",
        bullets: [
          "Your national ID number",
          "A bicycle, a motorbike, or the ability to deliver on foot",
          "A smartphone to receive orders and follow the map",
          "An M-Pesa line to receive payouts",
        ],
      },
      {
        heading: "How to join",
        bullets: [
          "Create an account and choose Rider",
          "Enter your ID number and vehicle type",
          "Once your account is reviewed, start accepting orders near you",
        ],
      },
    ],
    faqs: [
      {
        q: "Do I need a motorbike to be a rider?",
        a: "No. You can deliver by bicycle, motorbike or on foot.",
      },
      {
        q: "How much does an OkoaTime rider earn?",
        a: "You keep 70% of the delivery fee on every order you deliver. On orders that continue by boat, you keep 40% for taking the order to the jetty.",
      },
      {
        q: "How do I get paid?",
        a: "Request a payout from your rider dashboard and you are paid via M-Pesa.",
      },
      {
        q: "Does it cost anything to join?",
        a: "No. Signing up as a rider is free.",
      },
      {
        q: "Nawezaje kuwa rider wa OkoaTime?",
        a: "Jisajili kwenye okoatime.com, chagua 'Rider', kisha weka namba ya kitambulisho chako na aina ya chombo chako — baiskeli, pikipiki au kwa miguu.",
      },
    ],
    related: ["sell-on-okoatime", "boat-transport-lamu", "seafood-delivery-lamu"],
  },

  "sell-on-okoatime": {
    slug: "sell-on-okoatime",
    title: "Sell on OkoaTime — For Lamu Suppliers & Boat Operators",
    description:
      "Reach more customers in Lamu, Shela and Manda. List your seafood, groceries, produce or household goods — or your boat — on OkoaTime. Riders deliver and customers pay with M-Pesa.",
    keywords: [
      "sell online Lamu", "Lamu suppliers", "sell fish online Lamu", "boat owners Lamu",
      "grow my business Lamu", "OkoaTime supplier",
    ],
    breadcrumb: "Sell on OkoaTime",
    eyebrow: "For suppliers & boat operators",
    h1: "Sell on OkoaTime",
    intro:
      "Join 20+ local suppliers already reaching more customers across Lamu, Shela and Manda. You list what you sell, customers order and pay with M-Pesa, and our riders handle the delivery.",
    cta: JOIN,
    closing: "Bring your business online with OkoaTime.",
    highlights: [
      { title: "More customers", body: "Reach residents and visitors across Lamu Town, Shela and Manda Island." },
      { title: "We handle delivery", body: "Riders and boat operators collect orders from you and deliver them." },
      { title: "Customers pay by M-Pesa", body: "No chasing payments. Request your payout via M-Pesa." },
      { title: "AI listing assistant", body: "Our built-in assistant helps you write and categorise product listings." },
    ],
    sections: [
      {
        heading: "For suppliers",
        paragraphs: [
          "Fishermen, fish sellers, mama mbogas, shops and household-goods sellers can all list on OkoaTime. OkoaTime charges a 10% commission on the item subtotal of each order.",
        ],
        bullets: [
          "Seafood",
          "Groceries",
          "Fruits & vegetables",
          "Household items",
        ],
      },
      {
        heading: "For boat operators",
        paragraphs: [
          "List your boat with its capacity and price per trip and take passenger bookings. You can also carry OkoaTime deliveries to Shela and Manda: keep 70% of the delivery fee when you do the whole delivery, or 30% for the water leg when a rider brings the order to the jetty.",
        ],
      },
      {
        heading: "How to join",
        bullets: [
          "Create an account and choose Supplier or Boat",
          "Add your business or boat details",
          "Once approved, add your products or boat listing and start receiving orders",
        ],
      },
    ],
    faqs: [
      {
        q: "How much does it cost to sell on OkoaTime?",
        a: "Signing up is free. OkoaTime charges a 10% commission on the item subtotal of each order you receive.",
      },
      {
        q: "Do I have to deliver orders myself?",
        a: "No. OkoaTime riders and boat operators collect orders from you and deliver them to customers.",
      },
      {
        q: "How do I get paid?",
        a: "Customers pay through OkoaTime by M-Pesa. You request a payout from your dashboard and receive it via M-Pesa.",
      },
      {
        q: "I own a boat. What can I earn?",
        a: "You set your own price per trip for passenger bookings. For deliveries you keep 70% of the delivery fee, or 30% when you carry the water leg of a bike-to-boat delivery.",
      },
      {
        q: "Nina duka au mimi ni mvuvi Lamu. Naweza kuuza kupitia OkoaTime?",
        a: "Ndiyo. Jisajili kama Supplier, weka bidhaa zako, na wateja wataagiza na kulipa kwa M-Pesa. Rider wetu watachukua oda na kuipeleka kwa mteja.",
      },
    ],
    related: ["become-a-rider", "boat-transport-lamu", "seafood-delivery-lamu"],
  },
};

export function seoMetadata(slug: SeoSlug): Metadata {
  const page = SEO_PAGES[slug];
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/${slug}`,
      siteName: "OkoaTime",
      type: "website",
      locale: "en_KE",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}
