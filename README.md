# Pomofit

**Pomofit** is a productivity and fitness web app that combines the Pomodoro technique with guided workout breaks. Built with Next.js, React, Supabase, and Tailwind CSS, Pomofit helps you stay focused and healthy throughout your workday.

---

## Features

- ⏲️ **Pomodoro Timer**: Classic focus/break cycles to boost productivity.
- 🏋️ **Workout Integration**: Get short workout suggestions during breaks.
- 📝 **Journaling**: Log your thoughts and progress.
- 📊 **Productivity Insights**: Visualize your focus and workout history.
- 🛡️ **PWA Support**: Installable, offline-capable, and mobile-friendly.
- 🔒 **Authentication**: Secure login with Supabase.
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E tests.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Supabase project (for authentication and data)

### Installation

```bash
git clone https://github.com/mmdsharifi/pomofit.git
cd pomofit
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Testing

Pomofit uses **Jest** and **React Testing Library** for unit/integration tests, and **Cypress** for end-to-end tests.

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- E2E: `npm run e2e`

See [TESTING.md](./TESTING.md) for details.

---

## Project Structure

- `app/` – Next.js app directory (pages, layouts, API routes)
- `components/` – Reusable UI and feature components
- `lib/` – Contexts, hooks, utilities, and Supabase integration
- `public/` – Static assets, icons, manifest, service worker
- `__tests__/` – Unit, integration, and component tests
- `cypress/` – E2E tests

---

## PWA

Pomofit is a Progressive Web App. You can install it on your device and use it offline.

---

## Contributing

1. Fork the repo and create your branch.
2. Write tests for your feature or fix.
3. Run `npm test` and `npm run e2e` to ensure all tests pass.
4. Submit a pull request!

---

## License

This project is currently unlicensed. Please contact the maintainer for usage terms.

---

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Cypress](https://www.cypress.io/)
- [Jest](https://jestjs.io/)
