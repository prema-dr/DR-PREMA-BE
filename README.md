# DR-BE — Dr Prema API

NestJS 12 + TypeScript + MySQL (Prisma 7) + Cloudinary + JWT.

Serves the public website and the admin panel (Services, Blogs, Testimonials, Gallery, Publications, Videos, Dashboard).

## The key idea: service/category mapping

`Service` is the single category table. Every content model (`Blog`, `Testimonial`, `GalleryImage`,
`Publication`, `Video`) has a `serviceId`. The admin only picks a service when adding content;
`GET /api/services/:slug` then returns that service together with all of its enabled content, so
nothing has to be linked by hand.

- Disabling a service hides its landing page and removes its content from every public endpoint.
- Blogs only appear when `isPublished` is true **and** `publishDate <= now` (a future date schedules a post).
- Testimonials never expose their service on the public API (mapping only).

## Setup

```bash
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*, ADMIN_*
npm install                   # also runs `prisma generate`
npm run db:migrate            # create tables (dev)  |  npm run db:deploy in production
npm run db:seed               # admin user + the 14 services, 6 blogs, 8 testimonials from the current site
npm run start:dev             # http://localhost:4000/api
```

Create the database first: `CREATE DATABASE dr_prema CHARACTER SET utf8mb4;`

| Script | Purpose |
|---|---|
| `npm run start:dev` | watch mode |
| `npm run build` / `start:prod` | production build / run |
| `npm test` | unit tests |
| `npm run db:studio` | browse data |

## API

Base path `/api`. Admin routes need `Authorization: Bearer <token>` from `POST /auth/login`.
Create/update routes accept `multipart/form-data` (for image upload) or JSON (when no file).
Images: JPEG/PNG/WebP, max 5 MB, stored in Cloudinary under `dr-prema/<module>`.

### Public

| Method | Path | Notes |
|---|---|---|
| GET | `/services` | enabled services in display order |
| GET | `/services/:slug` | service + `blogs`, `testimonials`, `gallery`, `publications`, `videos` |
| GET | `/blogs?service=&page=&limit=&search=` | paginated, newest first |
| GET | `/blogs/:slugOrRewritePath` | e.g. `/blogs/my-post` or `/blogs/vbac/myths` |
| GET | `/testimonials?service=&page=&limit=` | paginated |
| GET | `/gallery?service=` | |
| GET | `/publications?service=` | |
| GET | `/videos?service=` | |
| GET | `/health` | DB check |

### Admin

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login` (5/min/IP), `GET /auth/me` |
| Dashboard | `GET /admin/dashboard` → totals for all six content types |
| Services | `GET`, `GET :id`, `POST`, `PATCH :id` (also enable/disable via `isEnabled`), `PATCH reorder` `{ids:[…]}` — file field `image` |
| Blogs | `GET` (`serviceId`, `status`, `search`), `GET :id`, `POST`, `PATCH :id`, `PATCH :id/publish` `{isPublished}`, `DELETE :id` — file field `featuredImage` |
| Testimonials | CRUD; `isEnabled` toggles — optional file `image` |
| Gallery | CRUD; `isEnabled` toggles — file `image` required on create, `altText` required |
| Publications | CRUD; `isEnabled` toggles — JSON only |
| Videos | CRUD; `isEnabled` toggles — Instagram `videoUrl` + file `thumbnail` required on create |

List endpoints take `page`, `limit` (max 50), `search`, `serviceId`, `isEnabled`.
Services have no delete (disable instead); deleting a service that still has content is blocked by the database (`onDelete: Restrict`).

## Security notes

- Passwords hashed with bcrypt (cost 12); unknown emails take the same time as wrong passwords.
- JWT signed with `JWT_SECRET` (32+ chars enforced), expiry `JWT_EXPIRES_IN`.
- `helmet`, global rate limit (120/min) plus a strict login limit, CORS limited to `CORS_ORIGINS`.
- Blog HTML is sanitised server-side; validation rejects unknown fields; uploads are type- and size-checked.
- The seed script creates the first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (12+ chars). Change it after first login.
