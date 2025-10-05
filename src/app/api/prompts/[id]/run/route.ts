import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import {
  formatValidationError,
  logValidationFailure,
  promptRunSchema,
} from '@/lib/prompt-validation';
import { NextResponse } from 'next/server';

type Params = {
  params: { id: string };
};

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prompt = await prisma.prompt.findFirst({
    where: {
      id: params.id,
      archivedAt: null,
      OR: [
        {
          ownerId: session.user.id,
          owner: { deletedAt: null },
        },
        {
          team: {
            deletedAt: null,
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      ],
    },
  });

  if (!prompt) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn('[prompts:run] Invalid JSON payload', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: { fieldErrors: {}, formErrors: ['Invalid JSON body.'] } },
      { status: 400 },
    );
  }

  const parsed = promptRunSchema.safeParse(payload);
  if (!parsed.success) {
    logValidationFailure('prompts:run', parsed.error);
    return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
  }

  const variables = parsed.data.variables ?? {};
  const rendered = renderTemplate(prompt.body, variables);

  return NextResponse.json({ result: rendered });
}
