# Minimal Google Photos Example

This is a standalone minimal example of how to connect to Google Photos API using Node.js and a simple HTML frontend.

## Prerequisites

1.  A Google Cloud Project with the **Google Photos Library API** enabled.
2.  OAuth 2.0 Credentials (Client ID and Client Secret).
3.  `http://localhost:3333/auth/callback` added to your Authorized redirect URIs in the Google Cloud Console.

## Setup

1.  Navigate to this directory:
    ```bash
    cd minimal-google-photos
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
4.  Fill in your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

## Running the App

```bash
npm start
```

Open [http://localhost:3333](http://localhost:3333) in your browser.
