-- Drop existing tables from the legacy schema
DROP TABLE IF EXISTS "PromptComment" CASCADE;
DROP TABLE IF EXISTS "TagOnPrompt" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
DROP TABLE IF EXISTS "RunLog" CASCADE;
DROP TABLE IF EXISTS "PromptVersion" CASCADE;
DROP TABLE IF EXISTS "Prompt" CASCADE;
DROP TABLE IF EXISTS "TeamMember" CASCADE;
DROP TABLE IF EXISTS "Team" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop legacy enum
DROP TYPE IF EXISTS "TeamRole";

-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create new enum for team member roles
CREATE TYPE "team_role" AS ENUM ('admin', 'editor', 'viewer');

-- Create new tables following the updated specification
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "hashedPassword" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT DEFAULT 'en',
    "timeZone" TEXT,
    "lastSeenAt" TIMESTAMPTZ,
    "onboardedAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPriceCents" INTEGER,
    "annualPriceCents" INTEGER,
    "currency" TEXT DEFAULT 'usd',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriptionId" TEXT,
    "trialEndsAt" TIMESTAMPTZ,
    "periodStart" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMPTZ,
    "cancelAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "ownerId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "archivedAt" TIMESTAMPTZ,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "team_role" NOT NULL DEFAULT 'viewer',
    "invitedBy" UUID,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "teamId" UUID,
    "createdById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ,
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promptId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "metadata" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_favorites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promptId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_favorites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promptId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "comment_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "threadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentId" UUID,
    "body" TEXT NOT NULL,
    "mentions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "editedAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientId" UUID NOT NULL,
    "actorId" UUID,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes and constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
CREATE INDEX "Plan_isDefault_idx" ON "plans"("isDefault");

CREATE UNIQUE INDEX "PlanLimit_planId_key_key" ON "plan_limits"("planId", "key");
CREATE INDEX "PlanLimit_key_idx" ON "plan_limits"("key");

CREATE UNIQUE INDEX "user_plans_subscriptionId_key" ON "user_plans"("subscriptionId");
CREATE INDEX "UserPlan_userId_idx" ON "user_plans"("userId");
CREATE INDEX "UserPlan_planId_idx" ON "user_plans"("planId");
CREATE INDEX "UserPlan_status_idx" ON "user_plans"("status");

CREATE UNIQUE INDEX "Workspace_ownerId_slug_key" ON "workspaces"("ownerId", "slug");
CREATE INDEX "Workspace_slug_idx" ON "workspaces"("slug");

CREATE UNIQUE INDEX "Team_workspaceId_slug_key" ON "teams"("workspaceId", "slug");
CREATE INDEX "Team_ownerId_idx" ON "teams"("ownerId");

CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE INDEX "TeamMember_userId_idx" ON "team_members"("userId");
CREATE INDEX "TeamMember_role_idx" ON "team_members"("role");

CREATE INDEX "Prompt_workspaceId_updatedAt_idx" ON "prompts"("workspaceId", "updatedAt");
CREATE INDEX "Prompt_teamId_updatedAt_idx" ON "prompts"("teamId", "updatedAt");
CREATE INDEX "Prompt_createdById_idx" ON "prompts"("createdById");

CREATE UNIQUE INDEX "PromptVersion_promptId_version_key" ON "prompt_versions"("promptId", "version");
CREATE INDEX "PromptVersion_createdById_idx" ON "prompt_versions"("createdById");

CREATE UNIQUE INDEX "PromptFavorite_promptId_userId_key" ON "prompt_favorites"("promptId", "userId");
CREATE INDEX "PromptFavorite_userId_idx" ON "prompt_favorites"("userId");

CREATE INDEX "CommentThread_promptId_createdAt_idx" ON "comment_threads"("promptId", "createdAt");
CREATE INDEX "CommentThread_isResolved_idx" ON "comment_threads"("isResolved");

CREATE INDEX "Comment_threadId_createdAt_idx" ON "comments"("threadId", "createdAt");
CREATE INDEX "Comment_authorId_idx" ON "comments"("authorId");

CREATE INDEX "Notification_recipientId_readAt_idx" ON "notifications"("recipientId", "readAt");
CREATE INDEX "Notification_actorId_idx" ON "notifications"("actorId");
CREATE INDEX "Notification_type_idx" ON "notifications"("type");

-- Add foreign keys
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompt_favorites" ADD CONSTRAINT "prompt_favorites_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prompt_favorites" ADD CONSTRAINT "prompt_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_threads" ADD CONSTRAINT "comment_threads_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_threads" ADD CONSTRAINT "comment_threads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "comment_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
