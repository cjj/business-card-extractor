# Business Card Contact Extractor

A **Node.js / Next.js** web application that lets you upload photos of business cards, automatically extracts contact information, searches for a LinkedIn profile, and exports the results to a CSV file ready for import into Google Contacts.

## Features

- **Image upload** (multiple JPG/PNG files at once)
- **Data extraction** using either:
  - **AI Vision** (OpenAI GPT‑4o) for high‑accuracy extraction, **or**
  - **OCR** (Tesseract.js) with advanced regex parsing
- **LinkedIn profile search** – generates a LinkedIn search URL for each contact
- **CSV export** compatible with Google Contacts import template
- Fully responsive UI built with Tailwind CSS and Radix UI components

## Prerequisites

**For Local Development:**
- Node.js (v18 or later) and npm (or yarn/pnpm) installed

**For Docker:**
- Docker and Docker Compose installed

**For AI Vision Mode:**
- An OpenAI API key (required for AI Vision mode). You can obtain one at https://platform.openai.com/api-keys.

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cjj/business-card-extractor
   cd business-card-extractor
   ```
2. **Install dependencies**
   ```bash
   npm install   # or `yarn` / `pnpm install`
   ```
3. **Configure environment variables**
   Copy the example file and configure your API key:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your-openai-api-key   # required for AI Vision mode
   ```
   The API key is optional if you plan to use OCR-only mode.

## Running the Application Locally

Start the development server:
```bash
npm run dev   # or `yarn dev` / `pnpm dev`
```
The app will be available at **http://localhost:3000**.

### Using the UI
1. Click **Select Images** to choose one or more business‑card photos.
2. Toggle the **AI Vision** switch to choose between AI (recommended) or OCR extraction.
3. Press **Extract** – the app will process each image, fetch a LinkedIn search link, and display the results in a table.
4. Click **Download CSV** to export all contacts. You should be able to use this file directly to import into Google Contacts. 

## API Endpoints

- `POST /api/extract` – extracts contact data using OpenAI GPT‑4o (requires `OPENAI_API_KEY`).
- `POST /api/extract-ocr` – extracts contact data using Tesseract OCR with custom parsing.
- `POST /api/linkedin-search` – returns a LinkedIn search URL for a given name and company.

## Running with Docker

Alternatively, you can run the application using Docker and Docker Compose. The Docker setup uses an optimized production build with Next.js standalone mode for minimal image size (~300MB) and fast startup.

### Prerequisites
- Docker and Docker Compose installed
- `.env.local` file configured (see Setup section above)

### Quick Start

1.  **Build and run the container:**
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the application:**
    - Open your browser to **http://localhost:3000**

### Managing the Container

**View logs:**
```bash
docker logs business-card-extractor-app-1
```

**Stop the application:**
```bash
docker-compose down
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

### Notes
- The container uses a non-root user for enhanced security
- Environment variables are loaded from `.env.local` at runtime
- OCR mode works without an API key; AI Vision mode requires `OPENAI_API_KEY`
- The production build uses multi-stage Docker builds for optimization

## Building for Production

```bash
npm run build   # creates an optimized production build
npm start       # runs the production server
```

## Development & CI Notes

### CI/Build Pipeline
The GitHub Actions CI workflow runs the following checks in order:
1. **Lint** - `npm run lint`
2. **TypeScript check** - `npx tsc --noEmit`
3. **Tests** - `npm test`
4. **Build** - `npm run build`

**Important:** All commands must pass for CI to succeed. If you add new scripts or modify the build process, ensure they're compatible with the CI workflow in `.github/workflows/ci.yml`.

### Google Contacts CSV Format
The application exports contact data in Google Contacts CSV import format with these fields:
- **Name fields:** `Name`, `Given Name`, `Family Name`
- **Contact fields:** `E-mail 1 - Type/Value`, `Phone 1 - Type/Value`
- **Address fields:** `Address 1 - Type/Formatted/Street/City/Region/Postal Code/Country`
- **Organization fields:** `Organization 1 - Name/Title`
- **Website fields:** `Website 1 - Type/Value`

**Note:** LinkedIn Profile is displayed in the UI but intentionally excluded from CSV export.

### Recent Changes
- **2025-12-13:** Updated to Google Contacts official CSV format (changed from `First Name`/`Last Name` to `Given Name`/`Family Name`)
- **2025-12-13:** Security patches: Next.js 15.5.3 → 15.5.9, Node.js 20 → 22 (Dockerfile)
- **2025-12-13:** Added placeholder test script to satisfy CI requirements

## License

This project is open‑source and available under the MIT License.

---

*Built with Next.js 15, Tailwind CSS, Radix UI, OpenAI, and Tesseract.js.*