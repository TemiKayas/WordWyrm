# Gemini Assistant Guidelines for WordWyrm

This file contains project-specific context and instructions for the Gemini CLI agent to ensure consistent, high-quality assistance.

## Core Interaction Rule: Fixes & Modifications
**Whenever a code fix, refactoring, or feature implementation is required:**
- Do NOT simply ask to proceed.
- **ALWAYS provide a detailed, self-contained CLI prompt** that describes exactly what needs to be done. 
- This prompt should be written so that it could be pasted into another agent instance to perform the task perfectly without further context.
- Include file paths, specific function names, logic changes, and desired outcomes.

## Project Context
- **Project Type:** Next.js (App Router), TypeScript, Prisma, Tailwind CSS.
- **Database:** PostgreSQL (via Neon), managed with Prisma ORM.
- **Game Engine:** Phaser 3 (integrated via React components in `lib/phaser` and `components/game`).
- **Authentication:** NextAuth.js.

## Conventions & Patterns
1.  **Database Changes:**
    - Always modify `prisma/schema.prisma` first.
    - Use `npx prisma migrate dev` for schema changes to generate migration history.
    - **Avoid** `npx prisma db push` unless specifically handling a drift/reset scenario where migration history is being rebuilt.
    - **Always stop the dev server** before running Prisma commands to avoid `EPERM` file lock errors on Windows.
    - **Never** run commands that might lose data without consulting first.

2.  **Game Development (Phaser):**
    - Game scenes are located in `lib/phaser/`.
    - React wrappers for games are in `components/game/`.
    - `endGame` logic in scenes must handle `manual_exit` by saving data and redirecting immediately, NOT showing a game-over screen.
    - Game sessions are only saved for authenticated students enrolled in the class.

3.  **Styling:**
    - Use Tailwind CSS for all styling.
    - Follow the existing "Quicksand" font and color palette (e.g., `#473025`, `#96b902`) seen in `SnakeScene.ts` and other components.

## Testing & Verification
- When suggesting a fix, provide a **verification checklist** to ensure the fix works as intended.
- Verify database state using `npx prisma studio` when dealing with data persistence issues.
