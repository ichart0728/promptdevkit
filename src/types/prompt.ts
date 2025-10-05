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
};
export type PromptWithTags = Prompt & { tags: TagOnPrompt[] };
