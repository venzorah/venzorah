export const PERMISSIONS = [
  { key: "customer.profile.edit", name: "Edit customer profile", module: "customer", groupName: "profile" },
  { key: "customer.address.manage", name: "Manage addresses", module: "customer", groupName: "profile" },
  { key: "customer.review.create", name: "Write reviews", module: "customer", groupName: "reviews" },
  { key: "customer.order.cancel", name: "Cancel eligible orders", module: "customer", groupName: "orders" },
  { key: "customer.return.request", name: "Request returns", module: "customer", groupName: "orders" },
  { key: "customer.wishlist.manage", name: "Manage wishlist", module: "customer", groupName: "shopping" },
  { key: "customer.support.create", name: "Create support tickets", module: "customer", groupName: "support" },
  { key: "vendor.store.manage", name: "Manage store profile", module: "vendor", groupName: "store" },
  { key: "vendor.kyc.submit", name: "Submit KYC", module: "vendor", groupName: "onboarding" },
  { key: "vendor.product.create", name: "Create products", module: "vendor", groupName: "catalog" },
  { key: "vendor.product.publish", name: "Publish products", module: "vendor", groupName: "catalog" },
  { key: "vendor.inventory.manage", name: "Manage inventory", module: "vendor", groupName: "catalog" },
  { key: "vendor.order.manage", name: "Manage vendor orders", module: "vendor", groupName: "orders" },
  { key: "vendor.shipping.manage", name: "Manage shipping", module: "vendor", groupName: "shipping" },
  { key: "vendor.payout.request", name: "Request payouts", module: "vendor", groupName: "finance" },
  { key: "vendor.promotion.manage", name: "Manage vendor promotions", module: "vendor", groupName: "marketing" },
  { key: "vendor.subscription.manage", name: "Manage subscription", module: "vendor", groupName: "billing" },
  { key: "admin.dashboard.view", name: "View admin dashboard", module: "admin", groupName: "core" },
  { key: "admin.customer.manage", name: "Manage customers", module: "admin", groupName: "users" },
  { key: "admin.vendor.manage", name: "Manage vendors", module: "admin", groupName: "users" },
  { key: "admin.permission.manage", name: "Manage roles and permissions", module: "admin", groupName: "security" },
  { key: "admin.category.manage", name: "Manage categories", module: "admin", groupName: "catalog" },
  { key: "admin.product.moderate", name: "Moderate products", module: "admin", groupName: "catalog" },
  { key: "admin.subscription.manage", name: "Manage subscription plans", module: "admin", groupName: "billing" },
  { key: "admin.order.manage", name: "Manage orders and disputes", module: "admin", groupName: "orders" },
  { key: "admin.finance.manage", name: "Manage payouts and ledger", module: "admin", groupName: "finance" },
  { key: "admin.settings.manage", name: "Manage platform settings", module: "admin", groupName: "settings" },
  { key: "admin.cms.manage", name: "Manage CMS content", module: "admin", groupName: "content" },
  { key: "admin.promotion.manage", name: "Manage promotions", module: "admin", groupName: "marketing" },
  { key: "admin.support.manage", name: "Manage support tickets", module: "admin", groupName: "support" },
  { key: "admin.audit.view", name: "View audit logs", module: "admin", groupName: "security" },
  { key: "admin.kyc.review", name: "Review KYC submissions", module: "admin", groupName: "vendors" },
  { key: "staff.ticket.assign", name: "Assign support tickets", module: "staff", groupName: "support" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ROLE_KEYS = {
  CUSTOMER: "customer",
  VENDOR: "vendor",
  VERIFIED_VENDOR: "verified_vendor",
  ADMIN: "admin",
  SUPPORT_AGENT: "support_agent",
  PRODUCT_MODERATOR: "product_moderator",
  KYC_OFFICER: "kyc_officer",
  FINANCE_OFFICER: "finance_officer",
  DISPUTE_MANAGER: "dispute_manager",
} as const;

export const CUSTOMER_PERMISSIONS: PermissionKey[] = PERMISSIONS.filter((p) =>
  p.key.startsWith("customer."),
).map((p) => p.key);

export const VENDOR_PERMISSIONS: PermissionKey[] = PERMISSIONS.filter((p) =>
  p.key.startsWith("vendor."),
).map((p) => p.key);

export const ADMIN_PERMISSIONS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export const STAFF_PRESETS: Record<string, PermissionKey[]> = {
  [ROLE_KEYS.SUPPORT_AGENT]: [
    "admin.dashboard.view",
    "admin.support.manage",
    "staff.ticket.assign",
    "admin.customer.manage",
  ],
  [ROLE_KEYS.PRODUCT_MODERATOR]: [
    "admin.dashboard.view",
    "admin.product.moderate",
    "admin.category.manage",
  ],
  [ROLE_KEYS.KYC_OFFICER]: ["admin.dashboard.view", "admin.kyc.review", "admin.vendor.manage"],
  [ROLE_KEYS.FINANCE_OFFICER]: [
    "admin.dashboard.view",
    "admin.finance.manage",
    "admin.subscription.manage",
    "admin.audit.view",
  ],
  [ROLE_KEYS.DISPUTE_MANAGER]: [
    "admin.dashboard.view",
    "admin.order.manage",
    "admin.support.manage",
    "admin.finance.manage",
  ],
};
