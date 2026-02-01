# OpenHire - Backend Architecture

Complete backend implementation guide for OpenHire.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui |
| Auth | Better Auth (free, self-hostable) |
| Database | PostgreSQL + Drizzle ORM |
| AI | Vercel AI SDK (OpenAI, Gemini, Anthropic) |
| Voice AI | VAPI (~40% cheaper than Retell) |
| Hosting | Vercel + Postgres OR Self-hosted Docker |

---

## Database Schema (Drizzle ORM)

### Organizations

```typescript
// schema/organizations.ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  imageUrl: text('image_url'),
  interviewCount: integer('interview_count').default(0),
  callCount: integer('call_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Users

```typescript
// schema/users.ts
import { pgTable, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { organizations } from './organizations';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  organizationId: text('organization_id').references(() => organizations.id),
  role: roleEnum('role').default('member'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Interviewers (AI Personas)

```typescript
// schema/interviewers.ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const interviewers = pgTable('interviewers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  agentId: text('agent_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  image: text('image'),
  audioSample: text('audio_sample'),
  rapport: integer('rapport').default(5),
  exploration: integer('exploration').default(5),
  empathy: integer('empathy').default(5),
  speed: integer('speed').default(5),
  systemPrompt: text('system_prompt'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Interviews

```typescript
// schema/interviews.ts
import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { organizations } from './organizations';
import { users } from './users';
import { interviewers } from './interviewers';
import { Question } from '@/types/interview';

export const interviews = pgTable('interviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').references(() => organizations.id).notNull(),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  interviewerId: text('interviewer_id').references(() => interviewers.id),
  name: text('name').notNull(),
  description: text('description'),
  objective: text('objective'),
  questions: jsonb('questions').$type<Question[]>().default([]),
  questionCount: integer('question_count').default(5),
  timeDuration: integer('time_duration').default(15),
  slug: text('slug').unique(),
  isActive: boolean('is_active').default(true),
  isAnonymous: boolean('is_anonymous').default(false),
  themeColor: text('theme_color').default('#6366f1'),
  logoUrl: text('logo_url'),
  responseCount: integer('response_count').default(0),
  insights: jsonb('insights').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Responses

```typescript
// schema/responses.ts
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { interviews } from './interviews';
import { InterviewAnalytics, CallDetails } from '@/types/interview';

export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed', 'analyzed']);
export const candidateStatusEnum = pgEnum('candidate_status', ['pending', 'selected', 'potential', 'rejected']);

export const responses = pgTable('responses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  interviewId: text('interview_id').references(() => interviews.id).notNull(),
  callId: text('call_id').unique(),
  candidateName: text('candidate_name'),
  candidateEmail: text('candidate_email'),
  duration: integer('duration'),
  transcript: text('transcript'),
  recordingUrl: text('recording_url'),
  callDetails: jsonb('call_details').$type<CallDetails>(),
  analytics: jsonb('analytics').$type<InterviewAnalytics>(),
  overallScore: integer('overall_score'),
  status: statusEnum('status').default('pending'),
  candidateStatus: candidateStatusEnum('candidate_status'),
  isViewed: boolean('is_viewed').default(false),
  tabSwitchCount: integer('tab_switch_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  analyzedAt: timestamp('analyzed_at'),
});
```

### Feedback

```typescript
// schema/feedback.ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { interviews } from './interviews';
import { responses } from './responses';

export const feedback = pgTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  interviewId: text('interview_id').references(() => interviews.id),
  responseId: text('response_id').references(() => responses.id),
  email: text('email'),
  satisfaction: integer('satisfaction'),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Schema Index

```typescript
// schema/index.ts
export * from './organizations';
export * from './users';
export * from './interviewers';
export * from './interviews';
export * from './responses';
export * from './feedback';
```

---

## Type Definitions

```typescript
// types/interview.ts

export interface Question {
  id: string;
  question: string;
  followUpCount: number;
  category?: string;
}

export interface InterviewAnalytics {
  overallScore: number;
  overallFeedback: string;
  communication: { score: number; feedback: string };
  technicalSkills: { score: number; feedback: string };
  softSkills: { score: number; feedback: string };
  questionSummaries: Array<{
    questionId: string;
    question: string;
    summary: string;
    score: number;
  }>;
}

export interface TranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  timestamp: number;
}

export interface CallDetails {
  callId: string;
  agentId: string;
  status: string;
  transcriptObject: TranscriptEntry[];
  callAnalysis: {
    summary: string;
    userSentiment: string;
    taskCompletionRating: string;
  };
  latencyMetrics: {
    e2e: number;
    llm: number;
  };
}

export interface CreateInterviewInput {
  name: string;
  description?: string;
  objective?: string;
  questions?: Question[];
  questionCount?: number;
  timeDuration?: number;
  interviewerId?: string;
  isAnonymous?: boolean;
  themeColor?: string;
  logoUrl?: string;
}
```

---

## Authentication (Better Auth)

### Server Setup

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { organizations } from '@/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationCreation: {
        afterCreate: async ({ organization: org, user }) => {
          await db.update(organizations)
            .set({ interviewCount: 0, callCount: 0 })
            .where(eq(organizations.id, org.id));
        },
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
```

### API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### Client Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL,
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useOrganization
} = authClient;
```

---

## Database Setup

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## API Routes Structure

```
app/api/
├── auth/[...all]/route.ts
├── interviews/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                # GET, PATCH, DELETE
│       ├── questions/route.ts      # POST - Generate questions
│       └── insights/route.ts       # POST - Generate insights
├── responses/
│   ├── route.ts                    # GET (list by interview)
│   └── [id]/
│       ├── route.ts                # GET, PATCH, DELETE
│       └── analyze/route.ts        # POST - Trigger analysis
├── calls/
│   ├── register/route.ts           # POST - Register new call
│   └── webhook/route.ts            # POST - Voice provider webhook
├── interviewers/
│   └── route.ts                    # GET (list), POST (create)
├── organizations/
│   └── [id]/route.ts               # GET, PATCH
└── usage/
    └── route.ts                    # GET - Check usage limits
```

---

## Core Services

### Interview Service

```typescript
// services/interview.service.ts
import { db } from '@/lib/db';
import { interviews, responses } from '@/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { CreateInterviewInput } from '@/types/interview';
import { generateSlug } from '@/lib/utils';

export const interviewService = {
  async create(data: CreateInterviewInput, userId: string, orgId: string) {
    const slug = generateSlug(data.name, orgId);

    const [interview] = await db.insert(interviews).values({
      ...data,
      createdById: userId,
      organizationId: orgId,
      slug,
    }).returning();

    return interview;
  },

  async getById(id: string) {
    return db.query.interviews.findFirst({
      where: eq(interviews.id, id),
      with: {
        interviewer: true,
        responses: {
          orderBy: desc(responses.createdAt),
        },
      },
    });
  },

  async getBySlug(slug: string) {
    return db.query.interviews.findFirst({
      where: eq(interviews.slug, slug),
      with: { interviewer: true },
    });
  },

  async listByOrganization(orgId: string) {
    return db.query.interviews.findMany({
      where: eq(interviews.organizationId, orgId),
      orderBy: desc(interviews.createdAt),
      with: {
        interviewer: true,
      },
    });
  },

  async update(id: string, data: Partial<CreateInterviewInput>) {
    const [updated] = await db.update(interviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  },

  async delete(id: string) {
    await db.delete(interviews).where(eq(interviews.id, id));
  },

  async updateResponseCount(interviewId: string) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(responses)
      .where(eq(responses.interviewId, interviewId));

    await db.update(interviews)
      .set({ responseCount: result[0].count })
      .where(eq(interviews.id, interviewId));
  },
};
```

### Response Service

```typescript
// services/response.service.ts
import { db } from '@/lib/db';
import { responses } from '@/schema';
import { eq, desc } from 'drizzle-orm';

export const responseService = {
  async create(data: {
    callId: string;
    interviewId: string;
    candidateName?: string;
    candidateEmail?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'analyzed';
  }) {
    const [response] = await db.insert(responses).values(data).returning();
    return response;
  },

  async getById(id: string) {
    return db.query.responses.findFirst({
      where: eq(responses.id, id),
      with: { interview: true },
    });
  },

  async getByCallId(callId: string) {
    return db.query.responses.findFirst({
      where: eq(responses.callId, callId),
    });
  },

  async listByInterview(interviewId: string) {
    return db.query.responses.findMany({
      where: eq(responses.interviewId, interviewId),
      orderBy: desc(responses.createdAt),
    });
  },

  async update(callId: string, data: Partial<typeof responses.$inferInsert>) {
    const [updated] = await db.update(responses)
      .set(data)
      .where(eq(responses.callId, callId))
      .returning();
    return updated;
  },

  async updateById(id: string, data: Partial<typeof responses.$inferInsert>) {
    const [updated] = await db.update(responses)
      .set(data)
      .where(eq(responses.id, id))
      .returning();
    return updated;
  },
};
```

### AI Service (Vercel AI SDK)

```typescript
// lib/ai.ts - AI Model Configuration
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'openai' | 'google' | 'anthropic';

const providers = {
  openai: () => openai('gpt-4o'),
  google: () => google('gemini-2.0-flash'),
  anthropic: () => anthropic('claude-sonnet-4-20250514'),
};

export function getModel() {
  const provider = (process.env.AI_PROVIDER || 'google') as AIProvider;
  return providers[provider]();
}
```

```typescript
// services/ai.service.ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai';
import { Question, InterviewAnalytics } from '@/types/interview';

// Zod schemas for structured output
const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  followUpCount: z.number(),
  category: z.string().optional(),
});

const questionsResponseSchema = z.object({
  questions: z.array(questionSchema),
});

const analyticsSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallFeedback: z.string(),
  communication: z.object({ score: z.number(), feedback: z.string() }),
  technicalSkills: z.object({ score: z.number(), feedback: z.string() }),
  softSkills: z.object({ score: z.number(), feedback: z.string() }),
  questionSummaries: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    summary: z.string(),
    score: z.number(),
  })),
});

const insightsSchema = z.object({
  insights: z.array(z.string()),
});

export const aiService = {
  async generateQuestions(input: {
    jobTitle: string;
    description: string;
    objective: string;
    questionCount: number;
  }): Promise<Question[]> {
    const { object } = await generateObject({
      model: getModel(),
      schema: questionsResponseSchema,
      prompt: `You are an expert interviewer. Generate ${input.questionCount} interview questions.

Job Title: ${input.jobTitle}
Description: ${input.description}
Objective: ${input.objective}

Generate thoughtful, role-specific questions that assess both technical skills and cultural fit.`,
    });

    return object.questions;
  },

  async analyzeInterview(input: {
    transcript: string;
    questions: Question[];
    objective: string;
  }): Promise<InterviewAnalytics> {
    const { object } = await generateObject({
      model: getModel(),
      schema: analyticsSchema,
      prompt: `Analyze this interview transcript thoroughly.

Interview Questions: ${JSON.stringify(input.questions)}
Objective: ${input.objective}

Transcript:
${input.transcript}

Evaluate the candidate's responses for communication clarity, technical competence, and soft skills. Provide constructive feedback and fair scoring.`,
    });

    return object;
  },

  async generateInsights(summaries: string[], objective: string): Promise<string[]> {
    const { object } = await generateObject({
      model: getModel(),
      schema: insightsSchema,
      prompt: `Analyze these interview summaries and generate 5-7 key insights.

Objective: ${objective}

Interview Summaries:
${summaries.join('\n\n')}

Identify patterns, strengths, areas of concern, and actionable recommendations.`,
    });

    return object.insights;
  },
};
```

### Voice Call Service (VAPI)

```typescript
// services/voice.service.ts
import Vapi from '@vapi-ai/server-sdk';
import crypto from 'crypto';
import { Question } from '@/types/interview';

const vapi = new Vapi({ token: process.env.VAPI_API_KEY! });

export const voiceService = {
  async registerCall(input: {
    assistantId: string;
    interviewId: string;
    candidateName?: string;
    metadata?: Record<string, unknown>;
  }) {
    const call = await vapi.calls.create({
      assistantId: input.assistantId,
      metadata: {
        interviewId: input.interviewId,
        candidateName: input.candidateName,
        ...input.metadata,
      },
    });

    return {
      callId: call.id,
      webCallUrl: call.webCallUrl,
    };
  },

  async getCallDetails(callId: string) {
    return vapi.calls.get(callId);
  },

  async createAssistant(input: {
    name: string;
    voiceId: string;
    systemPrompt: string;
    firstMessage: string;
    questions: Question[];
    personality: { rapport: number; empathy: number; exploration: number; speed: number };
  }) {
    return vapi.assistants.create({
      name: input.name,
      voice: {
        provider: 'elevenlabs',
        voiceId: input.voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: input.systemPrompt,
        }],
        temperature: 0.7,
      },
      firstMessage: input.firstMessage,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
      },
      silenceTimeoutSeconds: input.personality.speed > 7 ? 20 : 30,
      maxDurationSeconds: 1800,
      endCallMessage: "Thank you for your time. We'll be in touch soon!",
    });
  },

  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    const expectedSig = crypto
      .createHmac('sha256', process.env.VAPI_WEBHOOK_SECRET!)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    return signature === expectedSig;
  },
};
```

---

## Webhook Handler

```typescript
// app/api/calls/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { voiceService } from '@/services/voice.service';
import { responseService } from '@/services/response.service';
import { interviewService } from '@/services/interview.service';
import { aiService } from '@/services/ai.service';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-vapi-signature') || '';
  const timestamp = req.headers.get('x-vapi-timestamp') || '';
  const body = await req.text();

  if (!voiceService.verifyWebhookSignature(body, signature, timestamp)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.message.type) {
    case 'status-update':
      if (event.message.status === 'in-progress') {
        await responseService.create({
          callId: event.message.call.id,
          interviewId: event.message.call.metadata?.interviewId,
          candidateName: event.message.call.metadata?.candidateName,
          status: 'in_progress',
        });
      }
      break;

    case 'end-of-call-report':
      const callId = event.message.call.id;
      const callDetails = await voiceService.getCallDetails(callId);
      const response = await responseService.getByCallId(callId);

      if (!response) break;

      const interview = await interviewService.getById(response.interviewId);
      if (!interview) break;

      await responseService.update(callId, {
        status: 'completed',
        duration: event.message.durationSeconds,
        transcript: event.message.transcript,
        recordingUrl: event.message.recordingUrl,
      });

      const analytics = await aiService.analyzeInterview({
        transcript: event.message.transcript,
        questions: interview.questions || [],
        objective: interview.objective || '',
      });

      await responseService.update(callId, {
        status: 'analyzed',
        callDetails: callDetails,
        analytics,
        overallScore: analytics.overallScore,
        analyzedAt: new Date(),
      });

      await interviewService.updateResponseCount(response.interviewId);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## API Route Examples

### Interviews CRUD

```typescript
// app/api/interviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { interviewService } from '@/services/interview.service';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interviews = await interviewService.listByOrganization(
    session.user.organizationId
  );

  return NextResponse.json(interviews);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const interview = await interviewService.create(
    body,
    session.user.id,
    session.user.organizationId
  );

  return NextResponse.json(interview, { status: 201 });
}
```

### Generate Questions

```typescript
// app/api/interviews/[id]/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { interviewService } from '@/services/interview.service';
import { aiService } from '@/services/ai.service';
import { headers } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interview = await interviewService.getById(params.id);
  if (!interview) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();

  const questions = await aiService.generateQuestions({
    jobTitle: body.jobTitle || interview.name,
    description: body.description || interview.description || '',
    objective: body.objective || interview.objective || '',
    questionCount: body.questionCount || interview.questionCount || 5,
  });

  const updated = await interviewService.update(interview.id, { questions });

  return NextResponse.json({ questions, interview: updated });
}
```

### Register Call

```typescript
// app/api/calls/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { interviewService } from '@/services/interview.service';
import { voiceService } from '@/services/voice.service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { interviewId, candidateName, candidateEmail } = body;

  const interview = await interviewService.getById(interviewId);
  if (!interview || !interview.isActive) {
    return NextResponse.json({ error: 'Interview not found or inactive' }, { status: 404 });
  }

  if (!interview.interviewer?.agentId) {
    return NextResponse.json({ error: 'No interviewer configured' }, { status: 400 });
  }

  const call = await voiceService.registerCall({
    assistantId: interview.interviewer.agentId,
    interviewId: interview.id,
    candidateName,
    metadata: { candidateEmail },
  });

  return NextResponse.json(call);
}
```

---

## Utility Functions

```typescript
// lib/utils.ts
import { createId } from '@paralleldrive/cuid2';

export function generateSlug(name: string, orgId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  const suffix = createId().slice(0, 8);
  return `${base}-${suffix}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

---

## Environment Variables

```bash
# .env.example

# ===================
# REQUIRED
# ===================

# Database (Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/openhire"

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"

# AI Services (Vercel AI SDK - choose one provider)
AI_PROVIDER="google"  # "google" | "openai" | "anthropic"

# Provider API Keys (only need the one you're using)
GOOGLE_GENERATIVE_AI_API_KEY=""  # For Gemini
OPENAI_API_KEY=""                 # For OpenAI
ANTHROPIC_API_KEY=""              # For Claude

# Voice Provider (VAPI)
VAPI_API_KEY=""
VAPI_WEBHOOK_SECRET=""

# App URL
NEXT_PUBLIC_URL="http://localhost:3000"

# ===================
# OPTIONAL
# ===================

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  openhire:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/openhire
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL:-http://localhost:3000}
      - AI_PROVIDER=${AI_PROVIDER:-google}
      - GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - VAPI_API_KEY=${VAPI_API_KEY}
      - VAPI_WEBHOOK_SECRET=${VAPI_WEBHOOK_SECRET}
      - NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL:-http://localhost:3000}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: openhire
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Project Structure

```
openhire/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── interviews/
│   │   ├── responses/
│   │   ├── calls/
│   │   ├── interviewers/
│   │   └── organizations/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── interviews/
│   │   ├── responses/
│   │   └── settings/
│   └── interview/[slug]/page.tsx
├── components/
│   ├── ui/
│   └── ...
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── db.ts
│   └── utils.ts
├── schema/
│   ├── organizations.ts
│   ├── users.ts
│   ├── interviewers.ts
│   ├── interviews.ts
│   ├── responses.ts
│   ├── feedback.ts
│   └── index.ts
├── services/
│   ├── interview.service.ts
│   ├── response.service.ts
│   ├── ai.service.ts
│   └── voice.service.ts
├── types/
│   └── interview.ts
├── docs/
├── drizzle/
├── public/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── package.json
└── README.md
```

---

## Build Phases

### Phase 1: Foundation
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up Drizzle ORM + PostgreSQL schema
- [ ] Configure Better Auth (email + Google OAuth)
- [ ] Create base UI components (shadcn/ui)
- [ ] Set up Docker development environment

### Phase 2: Core Features
- [ ] Interview CRUD (create, list, edit, delete)
- [ ] AI question generation (Vercel AI SDK)
- [ ] VAPI voice assistant setup
- [ ] Webhook handling for call events
- [ ] Response recording and storage

### Phase 3: Analysis & Dashboard
- [ ] AI-powered interview analysis
- [ ] Candidate scoring system
- [ ] Dashboard with analytics
- [ ] Response filtering and search
- [ ] Email notifications

### Phase 4: Polish & Launch
- [ ] Write documentation
- [ ] Docker production config
- [ ] Vercel one-click deploy button
- [ ] GitHub README with video embed
- [ ] Record setup video (Loom)
- [ ] Launch on r/selfhosted + Hacker News

---

## Future Roadmap

- [ ] Local LLM Support (Ollama)
- [ ] Multiple Voice Providers (VAPI, Retell, Bland AI)
- [ ] Webhook Integrations (Slack, Discord)
- [ ] ATS Integrations (Greenhouse, Lever, Workday)
- [ ] Custom Scoring Rubrics
- [ ] Team Collaboration
