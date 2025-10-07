export const extractVars = (body: string) =>
  Array.from(
    new Set(
      Array.from(body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)).map((match) => match[1])
    )
  );
