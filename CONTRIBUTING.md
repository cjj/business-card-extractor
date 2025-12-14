# Contributing to Business Card Contact Extractor

## Development Workflow

### Setting Up Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure your API keys
4. Start development server: `npm run dev`

### Before Committing

Always run these commands locally to catch issues before pushing:

```bash
npm run lint              # Check code style
npx tsc --noEmit         # TypeScript type checking
npm test                 # Run tests
npm run build            # Verify production build
```

These are the same checks that run in CI, so running them locally will save time.

## CI/CD Pipeline

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. **Lint** - ESLint checks for code quality issues
2. **TypeScript Check** - `tsc --noEmit` validates types (stricter than Next.js build)
3. **Tests** - Runs the test suite via `npm test`
4. **Build** - Creates production build via `npm run build`

**All steps must pass for CI to succeed.**

### Common CI Failures & Solutions

#### Missing Test Script
**Error:** `npm error Missing script: "test"`

**Solution:** Ensure `package.json` has a test script defined:
```json
"scripts": {
  "test": "echo \"No tests yet\" && exit 0"
}
```

#### TypeScript Errors Not Caught Locally
**Issue:** Build passes locally but fails in CI

**Cause:** Next.js build may not catch all TypeScript errors. CI runs `tsc --noEmit` which is stricter.

**Solution:** Always run `npx tsc --noEmit` before pushing.

#### ESLint Warnings Treated as Errors
**Issue:** Warnings pass locally but fail in CI

**Solution:** Fix all warnings or use `eslint-disable` comments for intentional cases:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { 'LinkedIn Profile': _, ...rest } = contact;
```

## Code Standards

### Contact Data Type Definition

The application uses a strict TypeScript interface for contact data that matches Google Contacts CSV import format:

```typescript
interface ContactData {
  'Name': string;
  'Given Name': string;
  'Family Name': string;
  'E-mail 1 - Type': string;
  'E-mail 1 - Value': string;
  'Phone 1 - Type': string;
  'Phone 1 - Value': string;
  'Address 1 - Type': string;
  'Address 1 - Formatted': string;
  'Address 1 - Street': string;
  'Address 1 - City': string;
  'Address 1 - Region': string;
  'Address 1 - Postal Code': string;
  'Address 1 - Country': string;
  'Organization 1 - Name': string;
  'Organization 1 - Title': string;
  'Website 1 - Type': string;
  'Website 1 - Value': string;
  'LinkedIn Profile'?: string; // Optional - UI only, not exported
}
```

**Important:** When updating field names, you must update:
1. Type definitions in `app/page.tsx`
2. Extraction logic in `app/api/extract/route.ts`
3. OCR parsing in `app/api/extract-ocr/route.ts`
4. AI prompts to match field names exactly

### Field Name Consistency

**DO:**
- Use exact Google Contacts CSV field names: `Given Name`, `Family Name`
- Include Type/Value suffixes: `E-mail 1 - Type`, `E-mail 1 - Value`
- Use consistent indexing throughout the codebase

**DON'T:**
- Mix old field names (`First Name`/`Last Name`) with new ones
- Forget to update all references when changing field names
- Use different field names in different parts of the application

## Troubleshooting Build Issues

### Field Name Mismatches

**Error:** `Element implicitly has an 'any' type because expression of type '"First Name"' can't be used to index type...`

**Cause:** Old field names (`First Name`, `Last Name`) used in code that expects new names (`Given Name`, `Family Name`).

**Solution:** Search for all occurrences and update:
```bash
# Find old field names
grep -r "First Name\|Last Name" app/
```

### Docker Build Issues

If the Docker build fails:
1. Check Node.js version in `Dockerfile` matches requirements (v22+)
2. Ensure `.env.local` exists with required variables
3. Verify `npm ci` completes successfully
4. Check build logs: `docker logs business-card-extractor-app-1`

## Version History

### 2025-12-13 - Google Contacts Format Update
- **Changed:** Field names from `First Name`/`Last Name` to `Given Name`/`Family Name`
- **Added:** Full Google Contacts CSV format support with Type/Value fields
- **Removed:** LinkedIn Profile from CSV export (kept in UI only)
- **Security:** Next.js 15.5.3 → 15.5.9 (fixes CVSS 10.0 RCE vulnerability)
- **Infrastructure:** Node.js 20 → 22 in Dockerfile

### Key Learnings
- Always run `tsc --noEmit` before pushing (catches more errors than Next.js build)
- All package.json scripts referenced in CI must exist
- Field name changes require updates across multiple files (types, API routes, UI)
