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
- 🚀 **High Performance**: 94/100 Lighthouse score with optimized loading.

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

## Performance

Pomofit achieves excellent performance scores:

- **Overall Lighthouse Score**: 94/100 🟢
- **Performance**: 90/100 🟢
- **Accessibility**: 95/100 🟢
- **Best Practices**: 95/100 🟢
- **SEO**: 95/100 🟢

### Key Metrics

- **LCP**: 800ms (excellent)
- **CLS**: 0.000 (perfect)
- **Bundle Size**: 102.47KB total
- **Load Time**: 975ms

See [docs/guides/PERFORMANCE_OPTIMIZATIONS.md](docs/guides/PERFORMANCE_OPTIMIZATIONS.md) for detailed optimization information.

---

## Testing

Pomofit uses **Jest** and **React Testing Library** for unit/integration tests, and **Cypress** for end-to-end tests.

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- E2E: `npm run e2e`

See [docs/testing/TESTING.md](docs/testing/TESTING.md) for details.

---

## Project Structure

```
pomofit/
├── app/                    # Next.js app directory (pages, layouts, API routes)
├── components/             # Reusable UI and feature components
├── lib/                    # Contexts, hooks, utilities, and Supabase integration
├── public/                 # Static assets, icons, manifest, service worker
├── __tests__/              # Unit, integration, and component tests
├── cypress/                # E2E tests
├── docs/                   # 📚 Project documentation
│   ├── guides/             # Feature guides and optimization docs
│   ├── testing/            # Testing documentation
│   └── performance-reports/ # Lighthouse audit reports
├── scripts/                # Performance testing and build scripts
└── README.md               # This file
```

---

## Documentation

📚 **Comprehensive documentation** is available in the `docs/` folder:

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Performance Optimizations](docs/guides/PERFORMANCE_OPTIMIZATIONS.md)** - Detailed optimization guide
- **[Testing Guide](docs/testing/TESTING.md)** - Testing strategy and best practices
- **[AI Features](docs/guides/AI_INSIGHTS_GUIDE.md)** - AI-powered features documentation
- **[Versioning Strategy](docs/guides/VERSIONING.md)** - Release and version management

---

## PWA

Pomofit is a Progressive Web App. You can install it on your device and use it offline.

---

## Contributing

1. Fork the repo and create your branch.
2. Write tests for your feature or fix.
3. Run `npm test` and `npm run e2e` to ensure all tests pass.
4. Follow the [testing guidelines](docs/testing/TESTING.md).
5. Submit a pull request!

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
