import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function requiredId(id: number | undefined, label: string): number {
  if (!id) {
    throw new Error(`Missing required id for ${label}`);
  }

  return id;
}

async function main() {
  console.info('Seeding database...');

  const [adminPassword, alicePassword, bobPassword, charliePassword] =
    await Promise.all([
      hash('admin123456', 12),
      hash('alice123456', 12),
      hash('bob123456', 12),
      hash('charlie123456', 12),
    ]);

  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const usersSeed = [
    {
      email: 'admin@mini-blog.local',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
    {
      email: 'alice@mini-blog.local',
      password: alicePassword,
      name: 'Alice Writer',
      role: 'USER',
    },
    {
      email: 'bob@mini-blog.local',
      password: bobPassword,
      name: 'Bob Reader',
      role: 'USER',
    },
    {
      email: 'charlie@mini-blog.local',
      password: charliePassword,
      name: 'Charlie Dev',
      role: 'USER',
    },
  ] satisfies Prisma.UserCreateManyInput[];

  await prisma.user.createMany({ data: usersSeed });

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: usersSeed.map((user) => user.email),
      },
    },
  });

  const userIdByEmail = new Map<string, number>(
    users.map((user): [string, number] => [user.email, user.id]),
  );

  const categoriesSeed = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Life', slug: 'life' },
    { name: 'Tutorial', slug: 'tutorial' },
  ];

  await prisma.category.createMany({ data: categoriesSeed });

  const categories = await prisma.category.findMany({
    where: {
      slug: {
        in: categoriesSeed.map((category) => category.slug),
      },
    },
  });

  const categoryIdBySlug = new Map<string, number>(
    categories.map((category): [string, number] => [
      category.slug,
      category.id,
    ]),
  );

  const post1 = await prisma.post.create({
    data: {
      title: 'Building a Clean NestJS Backend for a Mini Blog',
      slug: 'building-clean-nestjs-backend-mini-blog',
      content:
        'This article explains how to structure modules, shared layers, and database access in a clean and scalable way for a mini blog backend.',
      published: true,
      authorId: requiredId(
        userIdByEmail.get('alice@mini-blog.local'),
        'alice user',
      ),
      categoryId: requiredId(
        categoryIdBySlug.get('technology'),
        'technology category',
      ),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'How Writing Every Day Improved My Technical Thinking',
      slug: 'writing-every-day-improved-technical-thinking',
      content:
        'A short story about how journaling, note-taking, and publishing small posts can improve engineering communication and decision making.',
      published: true,
      authorId: requiredId(
        userIdByEmail.get('charlie@mini-blog.local'),
        'charlie user',
      ),
      categoryId: requiredId(categoryIdBySlug.get('life'), 'life category'),
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Prisma Seeding Patterns for Relational Data',
      slug: 'prisma-seeding-patterns-relational-data',
      content:
        'This post demonstrates practical seeding patterns for users, categories, posts, and threaded comments while keeping data deterministic.',
      published: false,
      authorId: requiredId(
        userIdByEmail.get('admin@mini-blog.local'),
        'admin user',
      ),
      categoryId: requiredId(
        categoryIdBySlug.get('tutorial'),
        'tutorial category',
      ),
    },
  });

  const firstCommentOnPost1 = await prisma.comment.create({
    data: {
      content: 'Great write-up. The module boundaries are very clear.',
      postId: post1.id,
      userId: requiredId(userIdByEmail.get('bob@mini-blog.local'), 'bob user'),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks Bob! I will add an auth flow article next.',
      postId: post1.id,
      userId: requiredId(
        userIdByEmail.get('alice@mini-blog.local'),
        'alice user',
      ),
      parentId: firstCommentOnPost1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Can you also share your testing strategy for services?',
      postId: post1.id,
      userId: requiredId(
        userIdByEmail.get('charlie@mini-blog.local'),
        'charlie user',
      ),
    },
  });

  const firstCommentOnPost2 = await prisma.comment.create({
    data: {
      content: 'I started doing this too, and it really works.',
      postId: post2.id,
      userId: requiredId(
        userIdByEmail.get('alice@mini-blog.local'),
        'alice user',
      ),
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Consistency is the hardest part, but worth it.',
      postId: post2.id,
      userId: requiredId(userIdByEmail.get('bob@mini-blog.local'), 'bob user'),
      parentId: firstCommentOnPost2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Draft is looking good. Waiting for the final version.',
      postId: post3.id,
      userId: requiredId(
        userIdByEmail.get('charlie@mini-blog.local'),
        'charlie user',
      ),
    },
  });

  console.info('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
