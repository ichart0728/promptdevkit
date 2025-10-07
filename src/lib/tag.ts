export const normalizeTag = (s: string) => s.trim().toLowerCase();

export const normalizeTags = (arr: string[]) =>
  Array.from(new Set(arr.map(normalizeTag).filter(Boolean))).slice(0, 10);
