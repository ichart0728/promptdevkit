import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const db = prisma as unknown as Record<string, any>;

type PlanSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  isActive: boolean;
  limits: Record<string, number>;
};

const planSeeds: PlanSeed[] = [
  {
    id: "plan_free",
    slug: "free",
    name: "Free",
    description: "For trying PromptDevKit with limited collaborative features.",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    isActive: true,
    limits: {
      prompts: 20,
      prompt_versions: 5,
      team_members: 3,
      runs_per_month: 100,
      storage_mb: 50,
    },
  },
  {
    id: "plan_pro",
    slug: "pro",
    name: "Pro",
    description: "Best for growing teams that need collaboration and higher limits.",
    monthlyPriceCents: 2900,
    annualPriceCents: 29000,
    isActive: true,
    limits: {
      prompts: 500,
      prompt_versions: 50,
      team_members: 25,
      runs_per_month: 5000,
      storage_mb: 1024,
    },
  },
];

type SeededPlanMap = Record<string, Record<string, any>>;

async function seedPlans(): Promise<SeededPlanMap> {
  if (!db.plan || !db.planLimit) {
    throw new Error("Plan models are missing from the Prisma client. Run migrations before seeding.");
  }

  const plans: SeededPlanMap = {};
  for (const seed of planSeeds) {
    const plan = await db.plan.upsert({
      where: { id: seed.id },
      create: {
        id: seed.id,
        slug: seed.slug,
        key: seed.slug,
        code: seed.slug,
        name: seed.name,
        displayName: seed.name,
        description: seed.description,
        isActive: seed.isActive,
        monthlyPriceCents: seed.monthlyPriceCents,
        annualPriceCents: seed.annualPriceCents,
      },
      update: {
        slug: seed.slug,
        key: seed.slug,
        code: seed.slug,
        name: seed.name,
        displayName: seed.name,
        description: seed.description,
        isActive: seed.isActive,
        monthlyPriceCents: seed.monthlyPriceCents,
        annualPriceCents: seed.annualPriceCents,
      },
    });

    plans[seed.slug] = plan;

    for (const [limitKey, limitValue] of Object.entries(seed.limits)) {
      await db.planLimit.upsert({
        where: { id: `${plan.id}-${limitKey}` },
        create: {
          id: `${plan.id}-${limitKey}`,
          planId: plan.id,
          plan_id: plan.id,
          key: limitKey,
          limitKey,
          limit_key: limitKey,
          value: limitValue,
          limitValue,
          limit_value: limitValue,
        },
        update: {
          value: limitValue,
          limitValue,
          limit_value: limitValue,
        },
      });
    }
  }

  return plans;
}

async function seedDevUser(): Promise<Record<string, any>> {
  if (!db.user) {
    throw new Error("User model is missing from the Prisma client.");
  }

  const id = process.env.DEV_USER_ID ?? "dev-user-0001";
  const email = process.env.DEV_USER_EMAIL ?? "dev@example.com";
  const name = process.env.DEV_USER_NAME ?? "Dev User";
  const avatarUrl =
    process.env.DEV_USER_AVATAR_URL ??
    "https://avatars.dicebear.com/api/initials/Dev%20User.svg";

  const createData = {
    id,
    email,
    name,
    avatarUrl,
    avatar_url: avatarUrl,
    image: avatarUrl,
  };

  const updateData = {
    email,
    name,
    avatarUrl,
    avatar_url: avatarUrl,
    image: avatarUrl,
  };

  return db.user.upsert({
    where: { id },
    create: createData,
    update: updateData,
  });
}

async function seedWorkspace(user: Record<string, any>): Promise<Record<string, any>> {
  if (!db.workspace) {
    throw new Error("Workspace model is missing from the Prisma client.");
  }

  const workspaceId = "workspace-dev-main";
  const slug = process.env.DEV_WORKSPACE_SLUG ?? "dev-workspace";

  return db.workspace.upsert({
    where: { id: workspaceId },
    create: {
      id: workspaceId,
      slug,
      handle: slug,
      key: slug,
      name: "Development Workspace",
      description: "Workspace seeded for local development",
      ownerId: user.id,
      owner_id: user.id,
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      avatar_url: user.avatarUrl ?? user.image ?? null,
    },
    update: {
      slug,
      handle: slug,
      key: slug,
      name: "Development Workspace",
      description: "Workspace seeded for local development",
      ownerId: user.id,
      owner_id: user.id,
    },
  });
}

async function seedUserPlan(
  user: Record<string, any>,
  plan: Record<string, any>,
  workspace: Record<string, any>,
): Promise<void> {
  if (!db.userPlan) {
    return;
  }

  const startedAt = new Date();
  const renewsAt = new Date(startedAt.getTime());
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await db.userPlan.upsert({
    where: { id: `${user.id}-${workspace.id}` },
    create: {
      id: `${user.id}-${workspace.id}`,
      userId: user.id,
      user_id: user.id,
      planId: plan.id,
      plan_id: plan.id,
      workspaceId: workspace.id,
      workspace_id: workspace.id,
      status: "active",
      startedAt,
      startsAt: startedAt,
      started_at: startedAt,
      renewsAt,
      renews_at: renewsAt,
    },
    update: {
      planId: plan.id,
      plan_id: plan.id,
      status: "active",
      renewsAt,
      renews_at: renewsAt,
    },
  });
}

async function seedTeam(
  workspace: Record<string, any>,
  user: Record<string, any>,
): Promise<Record<string, any>> {
  if (!db.team) {
    throw new Error("Team model is missing from the Prisma client.");
  }

  const teamId = "team-dev-core";
  const team = await db.team.upsert({
    where: { id: teamId },
    create: {
      id: teamId,
      workspaceId: workspace.id,
      workspace_id: workspace.id,
      slug: "core-team",
      key: "core-team",
      name: "Core Team",
      description: "Default team for development environment",
      createdById: user.id,
      created_by_id: user.id,
    },
    update: {
      workspaceId: workspace.id,
      workspace_id: workspace.id,
      slug: "core-team",
      key: "core-team",
      name: "Core Team",
      description: "Default team for development environment",
    },
  });

  if (db.teamMember) {
    await db.teamMember.upsert({
      where: { id: `${team.id}-${user.id}` },
      create: {
        id: `${team.id}-${user.id}`,
        teamId: team.id,
        team_id: team.id,
        userId: user.id,
        user_id: user.id,
        role: "owner",
      },
      update: {
        role: "owner",
      },
    });
  }

  if (db.workspaceMember) {
    await db.workspaceMember.upsert({
      where: { id: `${workspace.id}-${user.id}` },
      create: {
        id: `${workspace.id}-${user.id}`,
        workspaceId: workspace.id,
        workspace_id: workspace.id,
        userId: user.id,
        user_id: user.id,
        role: "owner",
      },
      update: {
        role: "owner",
      },
    });
  }

  return team;
}

type PromptSeed = {
  id: string;
  slug: string;
  title: string;
  description: string;
  visibility: "private" | "workspace" | "team";
  latestVersion: {
    id: string;
    version: number;
    summary: string;
    content: string;
    variables: Array<{ key: string; name: string; required?: boolean; description?: string }>;
  };
};

const promptSeeds: PromptSeed[] = [
  {
    id: "prompt-welcome-email",
    slug: "welcome-email",
    title: "Welcome Email",
    description: "Generate a friendly welcome email for new users joining the product.",
    visibility: "team",
    latestVersion: {
      id: "prompt-welcome-email-v1",
      version: 1,
      summary: "Initial welcome email template",
      content: `You are an assistant that writes onboarding emails.\n\nRecipient: {{recipient_name}}\nProduct: {{product_name}}\nKey features: {{key_features}}\nTone: friendly and concise.\n\nGenerate a short welcome email with a subject line and body.`,
      variables: [
        { key: "recipient_name", name: "Recipient Name", required: true },
        { key: "product_name", name: "Product Name", required: true },
        { key: "key_features", name: "Key Features", description: "Comma separated" },
      ],
    },
  },
  {
    id: "prompt-weekly-summary",
    slug: "weekly-summary",
    title: "Weekly Summary",
    description: "Summarise the team's work for status updates.",
    visibility: "workspace",
    latestVersion: {
      id: "prompt-weekly-summary-v1",
      version: 1,
      summary: "Summarises highlights for stakeholders",
      content: `You are an assistant preparing a weekly summary update.\n\nTeam: {{team_name}}\nWins: {{wins}}\nChallenges: {{challenges}}\nNext steps: {{next_steps}}\nAudience: leadership.\n\nReturn the summary as markdown with sections for Highlights, Challenges, and Next Steps.`,
      variables: [
        { key: "team_name", name: "Team Name", required: true },
        { key: "wins", name: "Wins", description: "Bulleted list" },
        { key: "challenges", name: "Challenges" },
        { key: "next_steps", name: "Next Steps" },
      ],
    },
  },
];

async function seedPrompts(
  workspace: Record<string, any>,
  team: Record<string, any>,
  user: Record<string, any>,
): Promise<Record<string, any>[]> {
  if (!db.prompt) {
    throw new Error("Prompt model is missing from the Prisma client.");
  }

  const prompts: Record<string, any>[] = [];

  for (const seed of promptSeeds) {
    const prompt = await db.prompt.upsert({
      where: { id: seed.id },
      create: {
        id: seed.id,
        slug: seed.slug,
        key: seed.slug,
        identifier: seed.slug,
        title: seed.title,
        summary: seed.description,
        description: seed.description,
        visibility: seed.visibility,
        workspaceId: workspace.id,
        workspace_id: workspace.id,
        teamId: team.id,
        team_id: team.id,
        createdById: user.id,
        created_by_id: user.id,
      },
      update: {
        slug: seed.slug,
        key: seed.slug,
        identifier: seed.slug,
        title: seed.title,
        summary: seed.description,
        description: seed.description,
        visibility: seed.visibility,
        workspaceId: workspace.id,
        workspace_id: workspace.id,
        teamId: team.id,
        team_id: team.id,
      },
    });

    prompts.push(prompt);

    if (db.promptVersion) {
      await db.promptVersion.upsert({
        where: { id: seed.latestVersion.id },
        create: {
          id: seed.latestVersion.id,
          promptId: prompt.id,
          prompt_id: prompt.id,
          version: seed.latestVersion.version,
          number: seed.latestVersion.version,
          title: `${seed.title} v${seed.latestVersion.version}`,
          summary: seed.latestVersion.summary,
          body: seed.latestVersion.content,
          content: seed.latestVersion.content,
          template: seed.latestVersion.content,
          variables: seed.latestVersion.variables,
          createdById: user.id,
          created_by_id: user.id,
        },
        update: {
          version: seed.latestVersion.version,
          number: seed.latestVersion.version,
          title: `${seed.title} v${seed.latestVersion.version}`,
          summary: seed.latestVersion.summary,
          body: seed.latestVersion.content,
          content: seed.latestVersion.content,
          template: seed.latestVersion.content,
          variables: seed.latestVersion.variables,
        },
      });
    }
  }

  return prompts;
}

async function seedPromptFavorites(
  user: Record<string, any>,
  prompts: Record<string, any>[],
): Promise<void> {
  if (!db.promptFavorite) {
    return;
  }

  const favorites = prompts.slice(0, 1);
  for (const prompt of favorites) {
    await db.promptFavorite.upsert({
      where: { id: `${user.id}-${prompt.id}` },
      create: {
        id: `${user.id}-${prompt.id}`,
        promptId: prompt.id,
        prompt_id: prompt.id,
        userId: user.id,
        user_id: user.id,
      },
      update: {},
    });
  }
}

async function seedComments(
  user: Record<string, any>,
  prompts: Record<string, any>[],
): Promise<void> {
  if (!db.commentThread || !db.comment) {
    return;
  }

  for (const prompt of prompts) {
    const threadId = `thread-${prompt.id}`;
    const thread = await db.commentThread.upsert({
      where: { id: threadId },
      create: {
        id: threadId,
        promptId: prompt.id,
        prompt_id: prompt.id,
        title: `${prompt.title} feedback`,
        createdById: user.id,
        created_by_id: user.id,
        workspaceId: prompt.workspaceId ?? prompt.workspace_id ?? null,
        workspace_id: prompt.workspaceId ?? prompt.workspace_id ?? null,
      },
      update: {
        title: `${prompt.title} feedback`,
        createdById: user.id,
        created_by_id: user.id,
      },
    });

    await db.comment.upsert({
      where: { id: `${thread.id}-root` },
      create: {
        id: `${thread.id}-root`,
        threadId: thread.id,
        thread_id: thread.id,
        commentThreadId: thread.id,
        comment_thread_id: thread.id,
        authorId: user.id,
        author_id: user.id,
        body: "Let's try running this prompt with sample values to verify logging works.",
      },
      update: {
        body: "Let's try running this prompt with sample values to verify logging works.",
      },
    });

    await db.comment.upsert({
      where: { id: `${thread.id}-follow-up` },
      create: {
        id: `${thread.id}-follow-up`,
        threadId: thread.id,
        thread_id: thread.id,
        commentThreadId: thread.id,
        comment_thread_id: thread.id,
        authorId: user.id,
        author_id: user.id,
        body: "Remember to capture any feedback directly in the prompt notes.",
      },
      update: {
        body: "Remember to capture any feedback directly in the prompt notes.",
      },
    });
  }
}

async function main() {
  const plans = await seedPlans();
  const user = await seedDevUser();
  const workspace = await seedWorkspace(user);
  const proPlan = plans.pro ?? Object.values(plans)[0];
  if (proPlan) {
    await seedUserPlan(user, proPlan, workspace);
  }
  const team = await seedTeam(workspace, user);
  const prompts = await seedPrompts(workspace, team, user);
  await seedPromptFavorites(user, prompts);
  await seedComments(user, prompts);
}

main()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
