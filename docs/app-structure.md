# Application Structure

The OpenQase project follows a structure typical for modern Next.js applications, leveraging the App Router.

## Root Directory

The root directory contains configuration files, the main application source (`src/`), documentation (`docs/`), Supabase configuration (`supabase/`), scripts (`scripts/`), and other project-level items.

*   `src/`: Contains the core application code.
*   `docs/`: Contains markdown documentation files for GitHub.
*   `supabase/`: Contains Supabase CLI configuration and migrations.
*   `scripts/`: Contains custom Node.js/TypeScript utility scripts for tasks like data migration or setup.
*   `public/`: Static assets directly served by Next.js.
*   `next.config.ts`: Next.js configuration file.
*   `package.json`: Project dependencies and scripts.
*   `tailwind.config.js`, `postcss.config.js`: Tailwind CSS configuration.
*   `tsconfig.json`: TypeScript configuration for the main application.
*   `.env.local`: Local environment variables (Supabase keys, etc.). **Never commit this file.**

## `src/` Directory

This is where the primary application logic resides.

*   `src/app/`: Core of the Next.js App Router implementation. Contains layouts, pages, API routes, and specific feature routes.
*   `src/components/`: Shared React components used throughout the application, likely including UI elements built with shadcn/ui.
*   `src/lib/`: Core library code, utilities, and integrations. Notably contains Supabase client helpers (`supabase-*.ts`), API clients, type definitions, and validation logic.
*   `src/utils/`: Additional utility functions. *(Consider consolidating relevant utilities into `src/lib/` if appropriate)*.
*   `src/hooks/`: Custom React hooks.
*   `src/contexts/`: React Context providers.
*   `src/types/`: Application-specific TypeScript type definitions (though some might also be in `src/lib/types.ts`).
*   `src/middleware.ts`: Next.js middleware, primarily handling authentication and route protection.
*   `src/config/`: Application-level configuration constants or settings.

## `src/app/` Directory

Defines the application's routes and views.

*   `layout.tsx`: Root layout component wrapping all pages.
*   `page.tsx`: The application's homepage component.
*   `globals.css`: Global CSS styles.
*   `admin/`: Contains all routes and components for the Content Management System.
*   `api/`: Contains API route handlers. *(Note: These might be partially or fully deprecated in favor of Server Actions)*.
*   `auth/`: Routes related to user authentication (login, signup, callback).
*   `blog/`, `case-study/`, `paths/`, `profile/`, `contact/`, `about/`: Public-facing routes for different content types or application features.

This structure separates concerns, placing routing and core page logic in `src/app/`, reusable UI elements in `src/components/`, shared business logic and utilities in `src/lib/`, and configuration at the root or within `src/config/`. # Server & Client Components

This project leverages the React Server Components (RSC) architecture introduced with the Next.js App Router. This allows for a hybrid approach where components can be rendered either on the server or the client, optimizing performance and developer experience.

## Server Components (Default)

*   **Definition:** Components defined in `.tsx` or `.jsx` files within the `src/app/` directory are **Server Components by default**. They do *not* need the `"use server";` directive (that's for Server Actions).
*   **Rendering:** Rendered entirely on the server. Their code is never sent to the client bundle.
*   **Capabilities:**
    *   Can directly access server-side resources (databases, file systems, environment variables).
    *   Can use `async/await` for data fetching directly within the component.
    *   Ideal for static content display and initial data loading.
*   **Limitations:**
    *   Cannot use React hooks like `useState`, `useEffect`, `useContext`.
    *   Cannot use browser-only APIs (e.g., `window`, `localStorage`).
    *   Cannot have interactive event handlers (`onClick`, `onChange`, etc.).
*   **Example Usage (OpenQase):**
    *   `page.tsx` files (e.g., `src/app/admin/blog-posts/page.tsx`, `src/app/blog/[slug]/page.tsx`) are typically Server Components responsible for fetching initial list or item data using helpers like `getSupabaseServerClient`.
    *   Layout components (`layout.tsx`) are often Server Components.

## Client Components

*   **Definition:** To make a component interactive and allow it to run in the browser, you must explicitly mark it as a Client Component using the **`"use client";` directive** at the very top of the file.
*   **Rendering:** Initially rendered on the server (for SSR/SSG), then "hydrated" and made interactive on the client. Their code *is* included in the client bundle.
*   **Capabilities:**
    *   Can use React hooks (`useState`, `useEffect`, `useContext`, etc.).
    *   Can use browser APIs.
    *   Can have interactive event handlers.
*   **Limitations:**
    *   Cannot directly access server-side resources (must fetch data via API calls or Server Actions).
    *   Cannot use `async/await` directly for data fetching in the component body (use `useEffect` or standard React state).
*   **Example Usage (OpenQase):**
    *   Components containing forms with state and event handlers, like the admin edit forms (`src/app/admin/[content-type]/[id]/client.tsx`).
    *   Components using standard React hooks for client-side state management.
    *   Any component requiring `useState`, `useEffect`, or browser interaction.

## Relationship & Interaction

*   Server Components can import and render Client Components.
*   Client Components **cannot** directly import Server Components. They can, however, receive Server Components as props (e.g., via the `children` prop).
*   Data fetching is often done in Server Components and the data is passed down as props to Client Components.
*   For mutations or actions triggered by user interaction in Client Components, **Server Actions** are used. Client Components invoke Server Actions (defined in separate files, often with `"use server";`), which execute securely on the server.

This separation allows the project to keep interactive JavaScript bundles smaller while leveraging the server for efficient data fetching and secure operations. Refer to the [Next.js Documentation](https://nextjs.org/docs/app/getting-started/server-and-client-components) for more details on patterns. 