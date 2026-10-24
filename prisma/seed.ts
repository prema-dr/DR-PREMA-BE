// Idempotent seed: admin account + the existing site content (services, blogs, testimonials).
// Run with `npm run db:seed`. Safe to re-run: records are upserted by slug / skipped when present.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { makeExcerpt, readTimeMinutes } from '../src/common/utils/content.util.js';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
const read = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`./seed-data/${name}.json`, import.meta.url), 'utf8'));

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user');
    return;
  }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: process.env.ADMIN_NAME ?? 'Admin',
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`Admin ready: ${email}`);
}

async function seedServices() {
  const services = read<any[]>('services');
  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        summary: s.summary,
        heroHeading: s.heroHeading,
        heroSub: s.heroSub,
        iconKey: s.iconKey,
        // Frontend-relative path for now; replaced by a Cloudinary URL when an admin uploads one.
        imageUrl: s.imageUrl,
        content: s.content,
        sortOrder: s.sortOrder,
      },
    });
  }
  console.log(`Services: ${services.length}`);
}

async function seedBlogs() {
  const blogs = read<any[]>('blogs');
  const services = new Map((await prisma.service.findMany()).map((s) => [s.name, s.id]));
  for (const b of blogs) {
    const serviceId = services.get(b.service);
    if (!serviceId) throw new Error(`Unknown service "${b.service}" for blog "${b.slug}"`);
    await prisma.blog.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        serviceId,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt || makeExcerpt(b.content),
        content: b.content,
        readTimeMinutes: readTimeMinutes(b.content),
        featuredImageUrl: b.imageUrl,
        imageAlt: b.title,
        isPublished: true,
      },
    });
  }
  console.log(`Blogs: ${blogs.length}`);
}

async function seedTestimonials() {
  if ((await prisma.testimonial.count()) > 0) {
    console.log('Testimonials: already present, skipped');
    return;
  }
  const items = read<any[]>('testimonials');
  const services = new Map((await prisma.service.findMany()).map((s) => [s.name, s.id]));
  await prisma.testimonial.createMany({
    data: items.map((t) => {
      const serviceId = services.get(t.service);
      if (!serviceId) throw new Error(`Unknown service "${t.service}" for testimonial "${t.name}"`);
      return { serviceId, name: t.name, review: t.review, rating: t.rating };
    }),
  });
  console.log(`Testimonials: ${items.length}`);
}

try {
  await seedAdmin();
  await seedServices();
  await seedBlogs();
  await seedTestimonials();
} finally {
  await prisma.$disconnect();
}
