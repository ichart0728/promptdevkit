export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
  tier: "free" | "team" | "enterprise";
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individuals exploring prompt operations.",
    features: [
      "Unlimited personal prompts",
      "Community templates",
      "Basic analytics",
    ],
    cta: "Sign Up Free",
    href: "/signin",
    highlighted: false,
    tier: "free",
  },
  {
    name: "Growth",
    price: "$29",
    description: "Unlock collaboration and workflow automation for teams.",
    features: [
      "Shared workspaces",
      "Version control & reviews",
      "Usage insights",
      "Email support",
    ],
    cta: "Start 14-day Trial",
    href: "/signin?plan=growth",
    highlighted: true,
    badge: "Most popular",
    tier: "team",
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    description: "Advanced governance and integrations for large organizations.",
    features: [
      "Custom SLAs",
      "Granular permissions",
      "Dedicated success manager",
      "Security reviews",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@promptdevkit.com",
    highlighted: false,
    tier: "enterprise",
  },
];
