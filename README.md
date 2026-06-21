# DevLens AI

DevLens AI is a Chrome Extension SaaS for understanding GitHub repositories instantly with AI.

It ships as a monorepo with:
- `packages/shared` for shared Zod contracts and API types
- `packages/backend` for the Express + TypeScript API
- `packages/extension` for the Chrome Extension MV3 UI

## What Works

- GitHub repository and file page detection
- Sidebar injection on GitHub
- Repository summary generation
- Repository Q&A with chat history
- README generation
- API endpoint detection
- Mermaid architecture diagram generation
- File explanation
- Function explanation from highlighted code
- JWT authentication
- MongoDB persistence for user, repository analysis, and chat history records
- Free-tier question limits

## Environment Variables

Copy `.env.example` to `.env` and set:
- `MONGODB_URI` for MongoDB Atlas
- `JWT_SECRET` for auth signing
- `GEMINI_API_KEY` for Gemini 2.5 Flash
- `GEMINI_MODEL` if you want a different Gemini model
- `CORS_ORIGIN` for frontend and extension access
- `VITE_API_BASE_URL` for the extension backend URL

## Local Development

Install dependencies:

```bash
npm install
```

Build all packages:

```bash
npm run build
```

Type-check the workspace:

```bash
npm run typecheck
```

Run the backend:

```bash
npm run dev:backend
```

Build the extension:

```bash
npm run build -w @devlens/extension
```

## Deployment

### Render backend

Use [render.yaml](render.yaml) for the backend service. The build command installs dependencies and builds the shared and backend packages before starting `@devlens/backend`.

### Chrome extension packaging

1. Run `npm run build -w @devlens/extension`.
2. Load `packages/extension/dist` as an unpacked extension in Chrome for local verification.
3. Zip the `dist` directory contents for Chrome Web Store submission.
4. Make sure `manifest.json`, popup assets, service worker, and content script bundles are all included in the package.

## Chrome Web Store Checklist

- Confirm `host_permissions` only include the domains the extension actually needs.
- Verify no secrets are bundled into the extension.
- Test repo pages and file pages on GitHub.
- Confirm authentication works before publishing.
- Confirm all buttons handle loading and error states gracefully.

## Notes

The Gemini API key is read only from the backend environment. The extension never receives it.
