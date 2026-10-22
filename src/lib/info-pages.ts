export type InfoSection = {
  id?: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  faqs?: { q: string; a: string }[];
};

export type InfoPage = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  sections: InfoSection[];
  links?: { href: string; label: string }[];
};

const support = "Message us from Account → Support, or on WhatsApp at +234 703 934 0610.";

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "about",
    title: "About us",
    eyebrow: "Venzorah",
    summary: "Venzorah is a UK marketplace for African food, fashion, beauty, art, home and the makers behind them.",
    sections: [
      {
        heading: "What we are",
        paragraphs: [
          "Venzorah brings independent African shops and makers onto one UK storefront. A buyer can browse every store, keep one basket, and check out once. Each seller still receives their own order, their own delivery fee, and their own earnings.",
          "The marketplace is built for people in the United Kingdom. Addresses, postcodes and delivery options follow the UK system. Sellers list in pounds, and the platform records every amount in pence.",
        ],
      },
      {
        heading: "How the marketplace is split",
        bullets: [
          "Buyers shop, save addresses, pay by card or wallet, and follow each order.",
          "Sellers choose a plan, list products, set their own delivery prices, and withdraw cleared earnings.",
          "Venzorah runs the shop, checks sellers, takes commission only on eligible product sales, and leaves the delivery fee with the seller who charged it.",
        ],
      },
      {
        heading: "Who we are for",
        paragraphs: [
          "Households looking for pantry goods, clothing, beauty, books, art and homeware from African sellers. Sellers who want a UK shopfront without building a website of their own. Teams who buy in bulk for events, shops and offices.",
        ],
      },
    ],
    links: [
      { href: "/products", label: "Shop the marketplace" },
      { href: "/sell-on-venzorah", label: "Sell on Venzorah" },
      { href: "/p/contact", label: "Contact us" },
    ],
  },
  {
    slug: "careers",
    title: "Venzorah careers",
    eyebrow: "Work with us",
    summary: "We are building the team that runs the marketplace, supports sellers, and looks after buyers in the UK.",
    sections: [
      {
        heading: "Open roles",
        paragraphs: [
          "There is no public vacancy list on this page yet. When a role opens, it will be posted here with the team, the location, and how to apply.",
          "Until then, introduce yourself. Tell us what you do, where you are based, and the kind of work you want. We read messages sent through support and WhatsApp.",
        ],
      },
      {
        heading: "Teams we expect to grow",
        bullets: [
          "Marketplace operations: seller onboarding, catalogue quality and order care.",
          "Buyer support: orders, returns and wallet questions.",
          "Partnerships: brands, logistics partners and community sellers.",
        ],
      },
    ],
    links: [{ href: "/p/contact", label: "Contact the team" }],
  },
  {
    slug: "express",
    title: "Venzorah Express",
    eyebrow: "Delivery",
    summary: "Venzorah Express is the name for the faster UK delivery options a seller chooses to offer.",
    sections: [
      {
        heading: "What Express means",
        paragraphs: [
          "Each seller sets their own delivery methods, prices and days. A standard option is the usual choice. When a seller also offers a faster method, that option is shown as Express at checkout.",
          "The price you see is the price that seller charges for that method. Venzorah does not add a second delivery fee, and the delivery money is paid to that seller in full.",
        ],
      },
      {
        heading: "What you can expect",
        bullets: [
          "The payment page lists the delivery choices for each store in your basket.",
          "A basket from two stores can use a different method for each store.",
          "Tracking appears on the order when the seller adds it.",
          "If a postcode cannot be served, checkout will not invent a rate.",
        ],
      },
    ],
    links: [
      { href: "/p/shipping", label: "Delivery options and timelines" },
      { href: "/account/orders", label: "Track an order" },
    ],
  },
  {
    slug: "terms",
    title: "Terms and conditions",
    eyebrow: "Marketplace rules",
    summary: "These are the rules for shopping and selling on Venzorah in the United Kingdom.",
    sections: [
      {
        heading: "The contract",
        paragraphs: [
          "When you create an account, you agree to these rules and to the privacy notice. A buyer enters a contract with the seller for the goods, and with Venzorah for use of the marketplace, the wallet and the account tools.",
          "Prices are in pounds sterling. The amount due is calculated on our servers from the live catalogue, the seller’s delivery rate and any valid coupon. A price typed in the browser is not the price charged.",
        ],
      },
      {
        heading: "Accounts",
        paragraphs: [
          "You need an account to check out. You can browse and add to the basket before you sign in. Keep your sign-in details private. Tell us if you think someone else has used your account.",
        ],
      },
      {
        heading: "Orders",
        paragraphs: [
          "An order is accepted when payment succeeds. A basket with more than one seller becomes one checkout and a separate order for each seller. Each seller prepares and sends their own goods.",
          "The delivery postcode is the one you choose at checkout, from a saved address or a new one. We show that postcode on the shop so you can see where the next order would go.",
        ],
      },
      {
        heading: "Sellers",
        paragraphs: [
          "Sellers choose a plan before the first listing. The plan prices and listing limits are the ones shown on the seller plans page. Commission is taken from eligible product sales. A delivery fee is not commission and is not shared with other sellers.",
          "A free plan charges commission on product sales. A paid plan charges no commission while that plan is active and covers the sale. Sellers must give accurate descriptions, lawful goods, and a UK delivery method they can actually fulfil.",
        ],
      },
      {
        heading: "Earnings",
        paragraphs: [
          "When an order is paid, the seller’s share is credited to their wallet and held. It can be withdrawn after 7 days if that order has no open complaint. Confirming delivery can release it sooner. An open return or dispute keeps that seller’s share locked. Other sellers on the same checkout are not locked.",
        ],
      },
    ],
    links: [
      { href: "/p/privacy", label: "Privacy notice" },
      { href: "/p/returns", label: "Returns and refunds" },
      { href: "/p/store-credit", label: "Store credit terms" },
      { href: "/p/subscription-terms", label: "Seller plan terms" },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy notice",
    eyebrow: "Your information",
    summary: "We use personal information to run accounts, orders, delivery, seller checks and support.",
    sections: [
      {
        heading: "What we hold",
        bullets: [
          "Account details: name, email, mobile number and profile picture.",
          "Delivery details: the UK addresses and postcodes you save or enter at checkout.",
          "Orders, payments, wallet entries, refunds and support messages.",
          "Seller records: store details, plans, listings, earnings and verification status.",
        ],
      },
      {
        heading: "Why we use it",
        paragraphs: [
          "To create your account, show the right postcode, take payment, pass each seller their order, hold and release earnings, handle returns, and answer support. Seller identity checks run when a verification provider is switched on.",
          "We do not sell your details. We share an order with the seller who is fulfilling it, and with the providers who host the site, send email, look up UK postcodes, take payment, or check a seller.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can update your profile and addresses in your account. You can ask for a copy of your information, or ask us to delete the account, from Account → Privacy. We still keep records we must keep for orders, refunds, tax and disputes.",
          support,
        ],
      },
    ],
    links: [{ href: "/account/privacy", label: "Make a privacy request" }],
  },
  {
    slug: "returns",
    title: "Returns and refund policy",
    eyebrow: "Orders",
    summary: "You can ask for a return from the order. The request holds that seller’s earning until it is resolved.",
    sections: [
      {
        heading: "How to ask",
        paragraphs: [
          "Open the order in your account and request a return. Tell us what is wrong and which seller’s goods are affected. A complaint is tied to that seller’s part of the order, not to every seller in the checkout.",
        ],
      },
      {
        heading: "What a refund covers",
        bullets: [
          "A product refund returns the goods amount and reverses the commission on that amount.",
          "The delivery fee stays with the seller unless staff refund delivery as well.",
          "Approved refunds are added to your Venzorah wallet. You can spend the balance or pay it out to a saved UK account.",
        ],
      },
      {
        heading: "While a complaint is open",
        paragraphs: [
          "The seller cannot withdraw the share from that order. After the complaint is closed, any amount still due to the seller follows the normal wallet rules. A complaint does not freeze another seller’s wallet.",
        ],
      },
    ],
    links: [
      { href: "/account/orders", label: "Your orders" },
      { href: "/p/store-credit", label: "Wallet and store credit" },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    eyebrow: "Your browser",
    summary: "We use cookies to keep you signed in, to remember a basket, and to bring you back to checkout.",
    sections: [
      {
        heading: "Cookies we set",
        bullets: [
          "A session cookie so you stay signed in.",
          "A basket cookie when you shop before you have an account, and a demo basket cookie for the demonstration catalogue.",
          "A short-lived cookie that returns you to checkout after you sign in.",
        ],
      },
      {
        heading: "What we do not use them for",
        paragraphs: [
          "These cookies run the shop. They are not an advertising profile. The public pages do not set a marketing cookie.",
          "You can clear cookies in your browser. Clearing them signs you out and can empty a guest basket.",
        ],
      },
    ],
    links: [{ href: "/p/privacy", label: "Privacy notice" }],
  },
  {
    slug: "store-credit",
    title: "Venzorah store credit terms",
    eyebrow: "Wallet",
    summary: "Store credit is the balance in your Venzorah wallet. You can add to it, spend it, receive refunds into it, and pay it out.",
    sections: [
      {
        heading: "Adding and spending",
        paragraphs: [
          "You can add funds from Account → Wallet and pay an order from that balance when it covers the total. A wallet payment is an order like any other: each seller is credited their share, and that share stays held until the withdrawal rules are met.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "An approved refund is store credit in your wallet, not a second copy of the order. The balance can be used on a later purchase.",
        ],
      },
      {
        heading: "Paying out",
        paragraphs: [
          "You can send wallet money to a UK account in your name. We ask for the account name, sort code and account number. The amount leaves the wallet when the payout is accepted. Store credit has no cash value outside Venzorah except through that payout. It is not transferable to another person.",
        ],
      },
    ],
    links: [{ href: "/account/wallet", label: "Open your wallet" }],
  },
  {
    slug: "subscription-terms",
    title: "Seller plan terms",
    eyebrow: "Selling",
    summary: "A seller chooses a plan before the first listing. The plan sets the fee, the commission and how many listings can stay live.",
    sections: [
      {
        heading: "Choosing and changing a plan",
        paragraphs: [
          "The plans and prices on the seller subscription page are the ones in force. The first listing asks for an explicit choice, including the free plan. You can move to a higher plan or a lower one later.",
          "Moving to a lower plan keeps your oldest live listings up to the new limit. Listings above that limit become drafts. They are not deleted.",
        ],
      },
      {
        heading: "Commission",
        paragraphs: [
          "Commission applies to eligible product sales after any discount share. It does not apply to the delivery fee. A paid plan charges no commission while it is active and covers the sale. A free plan charges the commission shown on that plan.",
        ],
      },
      {
        heading: "Renewal",
        paragraphs: [
          "A monthly plan is set up to renew. Six-month and annual plans follow the renewal rule shown when you choose them. If a paid plan ends and is not renewed, the seller returns to the free plan rules, including its listing limit.",
        ],
      },
    ],
    links: [{ href: "/sell-on-venzorah", label: "Sell on Venzorah" }],
  },
  {
    slug: "faq",
    title: "Help centre",
    eyebrow: "Questions",
    summary: "Answers for shopping, delivery, wallets, returns and selling on Venzorah.",
    sections: [
      {
        heading: "Shopping",
        faqs: [
          { q: "Can I browse without an account?", a: "Yes. You can look through the shop and add to the basket. Checkout asks you to sign in or create an account, then brings you back to finish the order." },
          { q: "Why does the header show a postcode?", a: "That is the postcode of your default delivery address. It is not a guessed location. Add or change it under Account → Addresses." },
          { q: "Can I have more than one address?", a: "Yes. Save as many UK addresses as you need, mark one as the default, and pick a different one at checkout." },
          { q: "How do I pay?", a: "Pay by card on the payment step, or pay from your wallet when the balance covers the order." },
        ],
      },
      {
        heading: "Delivery and returns",
        faqs: [
          { q: "Who delivers my order?", a: "Each seller sends their own goods and sets the delivery price. Two sellers in one basket means two deliveries." },
          { q: "What is Venzorah Express?", a: "It is a faster delivery method when the seller offers one. The price shown is that seller’s price." },
          { q: "How do I return something?", a: "Open the order and request a return. That complaint holds only that seller’s earning. Approved refunds go to your wallet." },
        ],
      },
      {
        heading: "Selling",
        faqs: [
          { q: "When do I choose a plan?", a: "Before the first listing. You can choose the free plan. You can move up or down later. A lower plan keeps the oldest live listings and drafts the rest." },
          { q: "When can I withdraw?", a: "After the order is paid, your share sits in your seller wallet. It becomes withdrawable after 7 days with no open complaint, or sooner if the buyer confirms delivery." },
          { q: "Does Venzorah take part of my delivery fee?", a: "No. The delivery fee is yours. Commission, where it applies, is on the product sale." },
        ],
      },
    ],
    links: [
      { href: "/p/how-to-shop", label: "How to shop" },
      { href: "/p/contact", label: "Contact us" },
      { href: "/p/shipping", label: "Delivery" },
    ],
  },
  {
    slug: "how-to-shop",
    title: "How to shop on Venzorah",
    eyebrow: "Help centre",
    summary: "Find a product, add it to the basket, sign in at checkout, and choose where it should be delivered.",
    sections: [
      {
        heading: "The steps",
        bullets: [
          "Search or browse a category, then open a product. The store name links to that seller’s other products.",
          "Add it to the basket. You can keep shopping or go to checkout.",
          "Sign in or create an account. You return to checkout rather than to a dashboard.",
          "Choose a saved address or enter a different UK address. Check the postcode.",
          "On the payment step, pick each seller’s delivery option, then pay by card or wallet.",
          "Follow the order from Account → Orders.",
        ],
      },
    ],
    links: [{ href: "/products", label: "Start shopping" }],
  },
  {
    slug: "shipping",
    title: "Delivery options and timelines",
    eyebrow: "Delivery",
    summary: "Delivery price and timing come from the seller, for the postcode you choose.",
    sections: [
      {
        heading: "How a rate is chosen",
        paragraphs: [
          "Sellers publish methods for the UK postcodes they serve. Checkout uses a method only if that seller offers it for your postcode. If you ask for a method that is not available, it is refused. The browser does not set the price.",
        ],
      },
      {
        heading: "Timelines",
        paragraphs: [
          "The days shown beside a method are the seller’s estimate, not a promise from a single national courier. Venzorah Express is the faster option when the seller has one. Standard is the usual option.",
          "You can save several addresses and switch the postcode at checkout. The header shows the default postcode so you can see it before you buy.",
        ],
      },
    ],
    links: [
      { href: "/p/express", label: "Venzorah Express" },
      { href: "/account/addresses", label: "Your addresses" },
    ],
  },
  {
    slug: "contact",
    title: "Contact us",
    eyebrow: "Help",
    summary: "Use in-account support for an order, or WhatsApp if you need a person quickly.",
    sections: [
      {
        heading: "Buyers and sellers",
        paragraphs: [
          "Signed-in buyers can open a support ticket from Account → Support. Include the order number if you have one. Sellers can use the messages in the seller dashboard.",
          "WhatsApp: +234 703 934 0610.",
        ],
      },
      {
        heading: "What to include",
        bullets: [
          "Your name and the email on the account.",
          "The order number, if the question is about an order.",
          "Whether you are a buyer, a seller, or asking about a partnership.",
        ],
      },
    ],
    links: [
      { href: "/account/support", label: "Open a support ticket" },
      { href: "https://wa.me/2347039340610", label: "WhatsApp" },
    ],
  },
  {
    slug: "corporate",
    title: "Corporate and bulk purchases",
    eyebrow: "Orders",
    summary: "Offices, shops and event teams can ask for a bulk order across one or more sellers.",
    sections: [
      {
        heading: "How to ask",
        paragraphs: [
          "Send the products or categories you need, the quantities, the delivery postcode, and the date you need them. We will match the request to sellers who can fulfil it and reply with availability and price before you pay.",
          "Bulk orders use the same marketplace rules: each seller sends their own goods, and delivery is charged per seller.",
        ],
      },
    ],
    links: [{ href: "/p/contact", label: "Send a bulk request" }],
  },
  {
    slug: "report",
    title: "Report a product",
    eyebrow: "Trust",
    summary: "Tell us if a listing is misleading, unsafe, or not allowed on Venzorah.",
    sections: [
      {
        heading: "What to report",
        bullets: [
          "A description or picture that does not match the goods.",
          "A prohibited or unsafe product.",
          "A store using someone else’s name or images.",
        ],
      },
      {
        heading: "What we do",
        paragraphs: [
          "Include the product name and the store name in a support message. Staff can hide a listing while it is reviewed. Reporting a product is not the same as returning an order you already received. Use the order page for a return.",
        ],
      },
    ],
    links: [
      { href: "/p/contact", label: "Report to support" },
      { href: "/p/returns", label: "Returns policy" },
    ],
  },
  {
    slug: "logistics",
    title: "Become a logistics service partner",
    eyebrow: "Partners",
    summary: "Delivery businesses can ask to be listed as a fulfilment option for Venzorah sellers.",
    sections: [
      {
        heading: "Who this is for",
        paragraphs: [
          "UK carriers and local delivery businesses that can collect from sellers and deliver to a UK postcode. Sellers still choose the methods they offer. A partner is not given every order on the marketplace.",
        ],
      },
      {
        heading: "How to apply",
        paragraphs: [
          "Tell us your company name, the areas you cover, the services you offer, and a contact number. Use support or WhatsApp. We will reply if there is a fit with sellers who need that coverage.",
        ],
      },
    ],
    links: [{ href: "/p/contact", label: "Contact partnerships" }],
  },
  {
    slug: "academy",
    title: "Join the Venzorah Academy",
    eyebrow: "Sellers",
    summary: "The Academy is where new sellers learn how to open a store, choose a plan, and deliver in the UK.",
    sections: [
      {
        heading: "What you can learn",
        bullets: [
          "How to open a seller account and choose a plan before the first listing.",
          "How delivery rates, postcodes and Venzorah Express work.",
          "How the wallet hold, commission and payout account work.",
          "How to handle a return without stopping the rest of your earnings.",
        ],
      },
      {
        heading: "How to join",
        paragraphs: [
          "Create a seller account from Sell on Venzorah. Academy notes are published on this page as new lessons are ready. There is no separate fee for reading them.",
        ],
      },
    ],
    links: [
      { href: "/sell-on-venzorah", label: "Open a seller account" },
      { href: "/p/subscription-terms", label: "Seller plan terms" },
    ],
  },
  {
    slug: "flash-sales",
    title: "Flash sales",
    eyebrow: "Offers",
    summary: "Flash sales are short promotions on products sellers, or Venzorah, choose to discount.",
    sections: [
      {
        heading: "How an offer works",
        paragraphs: [
          "A flash sale shows a lower price for a set time. The discounted price is the price charged if you check out while it is live. A coupon, when one is offered, is applied on the server and split across the sellers in the basket.",
          "When the sale ends, the product returns to its normal price. Delivery is still charged at the seller’s rate unless the offer says delivery is included.",
        ],
      },
    ],
    links: [{ href: "/products", label: "Browse products" }],
  },
];

export const INFO_BY_SLUG: Record<string, InfoPage> = Object.fromEntries(INFO_PAGES.map((page) => [page.slug, page]));

function plainBody(page: InfoPage) {
  return page.sections
    .map((section) => {
      const lines = [section.heading, ...(section.paragraphs ?? []), ...(section.bullets ?? [])];
      for (const faq of section.faqs ?? []) lines.push(`${faq.q} ${faq.a}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export const CMS_PAGES: Record<string, { title: string; body: string }> = Object.fromEntries(
  INFO_PAGES.map((page) => [page.slug, { title: page.title, body: plainBody(page) }]),
);
