# Business Card Contact Extractor

A **Node.js / Next.js** web application that lets you upload photos of business cards, automatically extracts contact information, searches for a LinkedIn profile, and exports the results to a CSV file ready for import into Google Docs/Sheets.

## Features

- **Image upload** (multiple JPG/PNG files at once)
- **Data extraction** using either:
  - **AI Vision** (OpenAI GPT‑4o) for high‑accuracy extraction, **or**
  - **OCR** (Tesseract.js) with advanced regex parsing
- **LinkedIn profile search** – generates a LinkedIn search URL for each contact
- **CSV export** compatible with Google Docs/Sheets templates
- Fully responsive UI built with Tailwind CSS and Radix UI components

## Prerequisites

- Node.js (v18 or later) and npm (or yarn/pnpm) installed
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
   Create a `.env.local` file in the project root and add:
   ```env
   OPENAI_API_KEY=your-openai-api-key   # required for AI Vision mode
   ```
   The variable is optional if you plan to use the OCR‑only mode.

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
4. Click **Download CSV** to export all contacts.

## API Endpoints

- `POST /api/extract` – extracts contact data using OpenAI GPT‑4o (requires `OPENAI_API_KEY`).
- `POST /api/extract-ocr` – extracts contact data using Tesseract OCR with custom parsing.
- `POST /api/linkedin-search` – returns a LinkedIn search URL for a given name and company.

## Running with Docker

Alternatively, you can run the application using Docker and Docker Compose.

1.  **Build and run the container:**
    ```bash
    docker-compose up -d --build
    ```
2.  The application will be available at **http://localhost:3000**.

To stop the application, run:
```bash
docker-compose down
```

## Building for Production

```bash
npm run build   # creates an optimized production build
npm start       # runs the production server
```

## License

This project is open‑source and available under the MIT License.

---

*Built with Next.js 15, Tailwind CSS, Radix UI, OpenAI, and Tesseract.js.*