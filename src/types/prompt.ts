export type Tag = { id: string; name: string };
export type TagOnPrompt = { tag: Tag };
export type Prompt = {
  id: string;
  title: string;
  body: string;
  variables: Record<string, string> | unknown;
  logging: boolean;
  ownerId?: string;
  teamId?: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
};
export type PromptWithTags = Prompt & { tags: TagOnPrompt[] };

export type PromptComment = {
  id: string;
  promptId: string;
  authorId?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  parentId?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  replies: PromptComment[];
};

export type PromptVersion = {
  id: string;
  promptId: string;
  version: number;
  title: string;
  body: string;
  variables: Record<string, unknown> | null;
  createdAt: string;
};
