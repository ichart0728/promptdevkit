import Link from "next/link";

import { FadeInSection } from "@/components/fade-in-section";
import { pricingPlans } from "@/data/pricing";

const features = [
  {
    title: "AI-Powered Prompt Studio",
    description:
      "Design, version, and share prompts with confidence using live previews and automatic documentation.",
    icon: "✨",
  },
  {
    title: "Team Playbooks",
    description:
      "Standardize best practices with reusable playbooks so every teammate can execute consistent workflows.",
    icon: "🧩",
  },
  {
    title: "Compliance Guardrails",
    description:
      "Role-based access and audit trails make it simple to keep sensitive knowledge secure and compliant.",
    icon: "🛡️",
  },
  {
    title: "Insightful Analytics",
    description:
      "Understand adoption and performance at a glance with dashboards tailored for product and ops leaders.",
    icon: "📊",
  },
  {
    title: "One-Click Execution",
    description:
      "Run prompts across channels from a single workspace—no context switching, no copy-paste fatigue.",
    icon: "⚡",
  },
  {
    title: "Developer Friendly",
    description:
      "SDKs and webhooks keep your product and engineering teams in sync with every prompt iteration.",
    icon: "🛠️",
  },
];

const benefits = [
  {
    title: "Launch playbooks 60% faster",
    description:
      "Move from idea to production in hours, not weeks, with reusable templates and built-in QA flows.",
  },
  {
    title: "Reduce duplicated work",
    description:
      "A single source of truth keeps content accurate across teams, reducing redundant prompt versions.",
  },
  {
    title: "Delight every stakeholder",
    description:
      "Share intuitive previews with marketing, ops, and engineering so everyone can sign off quickly.",
  },
];

const testimonials = [
  {
    name: "Jordan Patel",
    role: "Head of Product, OrbitAI",
    quote:
      "“PromptDevKit cut our experimentation time in half. Our PMs finally have a workspace built for iteration.”",
  },
  {
    name: "Mina Lopez",
    role: "Automation Lead, Flux Labs",
    quote:
      "“The compliance guardrails were an instant win. We can empower more teams without worrying about risk.”",
  },
];

const faqs = [
  {
    question: "Can I migrate prompts from other tools?",
    answer:
      "Yes. Import prompts from CSV, JSON, or our API in minutes with guided validation to ensure accuracy.",
  },
  {
    question: "Does PromptDevKit work with my LLM provider?",
    answer:
      "Absolutely. Connect OpenAI, Anthropic, Azure OpenAI, and custom deployments through our integrations hub.",
  },
  {
    question: "Is there a discount for startups or education?",
    answer:
      "We offer discounted plans for qualified startups, non-profits, and educational institutions—reach out to learn more.",
  },
  {
    question: "How secure is the platform?",
    answer:
      "We provide SSO, SOC 2 compliance, audit trails, and bring-your-own-key encryption for enterprise-grade security.",
  },
];

const trustedLogos = ["NovaTech", "Atlas Systems", "Skyline", "Brightwave", "Northwind", "Synth Labs"];

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_transparent_55%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-24 sm:pt-32">
          <FadeInSection className="flex flex-col gap-12">
            <div className="flex flex-col gap-8 text-center sm:text-left">
              <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-purple-300/40 bg-purple-50/60 px-4 py-1 text-sm font-medium text-purple-700 shadow-sm dark:border-purple-500/30 dark:bg-purple-400/10 dark:text-purple-200 sm:self-start">
                Prompt operations reimagined for modern teams
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Orchestrate every AI prompt with precision and speed
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                PromptDevKit centralizes prompt creation, testing, and rollout so you can ship AI-powered experiences faster—without compromising quality or compliance.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/signin"
                  className="w-full rounded-full bg-purple-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-500 sm:w-auto"
                >
                  Get Started
                </Link>
                <Link
                  href="#pricing"
                  className="w-full rounded-full border border-foreground/15 px-6 py-3 text-center text-sm font-semibold transition hover:border-foreground/40 hover:text-purple-600 dark:hover:text-purple-300 sm:w-auto"
                >
                  Explore Pricing
                </Link>
              </div>
            </div>
            <div className="grid gap-8 rounded-3xl border border-foreground/10 bg-white/70 p-8 shadow-xl shadow-purple-500/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-xl text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">
                      ⚙️
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                        Workflow Preview
                      </p>
                      <p className="text-sm text-muted-foreground">
                        A collaborative prompt review in action.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-slate-50 via-white to-purple-50 p-6 shadow-inner dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/50">
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                      <span>Prompt Review</span>
                      <span>Team Workspace</span>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/60">
                        <p className="text-sm font-medium">Launch Campaign Assistant</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          “Generate a 5-email nurture sequence for B2B leads with segmentation by industry and persona.”
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-300">
                          <span className="rounded-full bg-purple-100 px-2 py-1 dark:bg-purple-500/20">Draft</span>
                          <span>2 reviewers</span>
                          <span>Last updated 2h ago</span>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-dashed border-purple-200/60 p-4 text-xs text-muted-foreground dark:border-purple-500/30">
                          ✅ QA scenarios automatically generated
                        </div>
                        <div className="rounded-xl border border-dashed border-purple-200/60 p-4 text-xs text-muted-foreground dark:border-purple-500/30">
                          🔄 Version history synced with GitHub
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-6 rounded-2xl border border-foreground/10 bg-slate-50/60 p-6 dark:border-white/10 dark:bg-slate-900/60">
                  <div>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Live Metrics</p>
                    <p className="mt-2 text-4xl font-semibold">98% rollout success</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Teams ship confident updates with automated guardrails and instant rollback controls.
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-white/70 p-4 text-center shadow-sm dark:bg-slate-950/40">
                      <dt className="text-xs uppercase text-muted-foreground">Review cycle</dt>
                      <dd className="mt-1 text-xl font-semibold">3 hrs</dd>
                    </div>
                    <div className="rounded-xl bg-white/70 p-4 text-center shadow-sm dark:bg-slate-950/40">
                      <dt className="text-xs uppercase text-muted-foreground">Saved effort</dt>
                      <dd className="mt-1 text-xl font-semibold">42%</dd>
                    </div>
                  </dl>
                  <Link
                    href="/signin"
                    className="rounded-full bg-foreground px-5 py-2 text-center text-sm font-semibold text-background transition hover:opacity-90"
                  >
                    Try the workspace demo
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24">
        <FadeInSection className="mt-6">
          <p className="text-center text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Trusted by high-performing teams
          </p>
          <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-6 text-sm font-semibold text-foreground/70 sm:grid-cols-3 md:grid-cols-6">
            {trustedLogos.map((logo) => (
              <div
                key={logo}
                className="flex h-16 w-full items-center justify-center rounded-xl border border-foreground/10 bg-white/70 px-4 text-center shadow-sm dark:border-white/10 dark:bg-slate-950/60"
              >
                {logo}
              </div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What is PromptDevKit?</h2>
            <p className="text-lg text-muted-foreground">
              PromptDevKit is the unified platform for designing, testing, and scaling prompts. Build collaborative workflows, automate rollouts, and measure performance—without leaving a single workspace.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Centralize prompts, variants, and approvals in one organized hub.</li>
              <li>• Integrate with your stack using REST, webhooks, and native SDKs.</li>
              <li>• Ship confidently with testing sandboxes, snapshots, and rollbacks.</li>
            </ul>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-purple-200/50 via-transparent to-purple-500/30 blur-2xl dark:from-purple-500/20 dark:to-purple-900/40" />
            <div className="w-full max-w-md rounded-3xl border border-foreground/10 bg-white/80 p-6 shadow-2xl shadow-purple-500/20 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Execution Flow</span>
                <span>Status: Ready</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50 to-white p-4 dark:border-purple-500/30 dark:from-purple-500/10 dark:to-slate-950/60">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">Segment detection</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Auto-detects persona and routes to the highest performing prompt in seconds.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-muted-foreground dark:border-white/10 dark:bg-slate-950/50">
                  🔐 SOC 2 Type II certified infrastructure
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-muted-foreground dark:border-white/10 dark:bg-slate-950/50">
                  🤝 Connects seamlessly with Slack, Jira, and Salesforce
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Why teams choose PromptDevKit</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Go beyond basic prompt storage. PromptDevKit is designed to help revenue, operations, and product teams move faster together.
          </p>
        </FadeInSection>

        <FadeInSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-gradient-to-br from-white to-purple-50/40 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:from-slate-950 dark:to-purple-950/40"
            >
              <h3 className="text-xl font-semibold text-foreground">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </FadeInSection>

        <FadeInSection className="rounded-3xl border border-purple-400/40 bg-gradient-to-r from-purple-500 via-purple-600 to-fuchsia-500 px-8 py-10 text-white shadow-xl">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="text-2xl font-semibold">Ready to launch your next AI workflow?</h3>
              <p className="mt-2 text-sm text-purple-100">
                Join thousands of builders using PromptDevKit to orchestrate reliable prompts at scale.
              </p>
            </div>
            <Link
              href="/signin"
              className="w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-purple-700 transition hover:bg-purple-100 sm:w-auto"
            >
              Create your free account
            </Link>
          </div>
        </FadeInSection>

        <FadeInSection>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Feature highlights</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Built for scale from day one—PromptDevKit combines collaboration, governance, and performance in one platform.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex h-full flex-col gap-4 rounded-3xl border border-foreground/10 bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="h-12 w-12 rounded-full bg-purple-100 text-2xl flex items-center justify-center dark:bg-purple-500/20">
                  <span aria-hidden>{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Social proof that speaks for itself</h2>
            <p className="text-lg text-muted-foreground">
              Teams across industries rely on PromptDevKit to bring AI workflows to life. See how they are accelerating productivity while staying compliant.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="flex h-full flex-col justify-between rounded-3xl border border-foreground/10 bg-white/80 p-6 text-left shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                >
                  <p className="text-sm text-muted-foreground">{testimonial.quote}</p>
                  <div className="mt-6 text-sm font-semibold text-foreground">
                    <p>{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-purple-600/90 to-indigo-600/90 p-8 text-white shadow-xl">
            <p className="text-sm uppercase tracking-widest text-purple-100">Case study highlight</p>
            <h3 className="mt-4 text-2xl font-semibold">Flux Labs scaled onboarding content in 10 days</h3>
            <p className="mt-4 text-sm text-purple-100/90">
              With PromptDevKit, Flux Labs automated QA, reduced manual prompt updates by 68%, and delivered a fully audited workflow ready for compliance review.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              View the full story
            </Link>
          </div>
        </FadeInSection>

        <FadeInSection id="pricing" className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing made simple</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Choose the plan that fits your team. Upgrade or downgrade anytime.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`flex h-full flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  plan.highlighted
                    ? "border-purple-400 bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:border-purple-500 dark:from-purple-500/10 dark:via-slate-950 dark:to-purple-900/40"
                    : "border-foreground/10 bg-white/70 dark:border-white/10 dark:bg-slate-950/60"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    {plan.badge ? (
                      <span className="rounded-full bg-purple-600/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-3xl font-semibold">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-purple-600 text-white hover:bg-purple-500"
                      : "bg-foreground text-background hover:opacity-90"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-foreground/10 bg-white/80 p-5 shadow-sm transition hover:border-purple-400/70 dark:border-white/10 dark:bg-slate-950/70"
              >
                <summary className="cursor-pointer list-none text-lg font-semibold text-foreground">
                  <div className="flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-sm text-purple-600 transition-transform group-open:rotate-45 dark:text-purple-300">+</span>
                  </div>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </FadeInSection>
      </main>

      <footer className="border-t border-foreground/10 bg-white/80 py-12 dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-lg font-semibold text-white">
                PD
              </div>
              <span className="text-lg font-semibold">PromptDevKit</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Build, manage, and optimize AI prompts with a workspace your entire organization can trust.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="mailto:hello@promptdevkit.com" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm font-semibold text-foreground">Join the community</p>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Link href="https://x.com" className="rounded-full border border-foreground/10 px-3 py-1 hover:border-purple-400/60 hover:text-purple-600 dark:border-white/10 dark:hover:text-purple-300">
                X
              </Link>
              <Link href="https://www.linkedin.com" className="rounded-full border border-foreground/10 px-3 py-1 hover:border-purple-400/60 hover:text-purple-600 dark:border-white/10 dark:hover:text-purple-300">
                LinkedIn
              </Link>
              <Link href="https://discord.com" className="rounded-full border border-foreground/10 px-3 py-1 hover:border-purple-400/60 hover:text-purple-600 dark:border-white/10 dark:hover:text-purple-300">
                Discord
              </Link>
            </div>
            <Link
              href="/signin"
              className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-500"
            >
              Start building today
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
