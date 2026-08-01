This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Package manager

**This is a pnpm-only project.** `pnpm-lock.yaml` is the single committed lockfile, and `package.json` pins `packageManager` to an exact pnpm version.

Do not use npm, yarn, or bun. `npm install` fails outright: `node_modules` is a pnpm symlink store, and npm's dependency resolver crashes while walking `node_modules/.pnpm`. Note that `npm run dev` appears to work only because it reuses whatever pnpm already installed.

This is a convention, not a programmatic guard, so please follow it.

## Getting Started

Install dependencies, then run the development server:

```bash
pnpm install
pnpm dev
```

Other project scripts:

```bash
pnpm lint      # eslint
pnpm build     # production build
pnpm validate  # mounted production checks for the project pages
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
