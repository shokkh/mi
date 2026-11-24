# IELTS Master

IELTS Master is a static IELTS study site with Vercel serverless endpoints for Firebase accounts and opt-in AI feedback. Run `node serve.js` from the project folder, then open `http://127.0.0.1:8765/ielts-master.html` for local practice; the local static server does not provide account or AI API endpoints. Deploy to Vercel (or use `vercel dev`) to test those cloud features. The local server supports audio byte ranges required by browser players. Opening the HTML file directly with `file://` can prevent Listening audio from loading.

## Mock tests

- 3 full Academic mock combinations (Listening, Reading, Writing)
- 3 Listening papers, 10 Reading papers, and 7 Writing papers (including the custom university-departments table and essay)
- A three-part Speaking mock with the “Famous person being interviewed” Part 2 cue card
- Timers, answer entry, local progress saving, answer review for Listening and Reading, writing word counts, and optional Speaking recording
- Optional AI feedback for Writing answers and recorded Speaking responses; users must be signed in and explicitly consent before their response is sent
- Overview Skill Progress updates from unique submitted mock papers in each skill and is saved on this device
- Performance Over Time and Recent Activity track cumulative active days with at least one submitted mock
- Exam and practice modes

The mock library is practice material, not official IELTS content. AI feedback is learning guidance, not an official IELTS/CEFR score. Progress is stored locally and syncs to a signed-in user's Firebase account. Audio recordings remain temporary in the browser; when feedback is requested, the selected recording is sent to the server for transcription and then its transcript is sent to OpenAI. Essays and recordings are not stored in the app's database. Do not send personal or sensitive information.

## Profile

On the first visit, a setup dialog asks for a name and target band score. The Profile page supports email/password and Google sign-in. Signed-in users sync their profile, completed mocks, and active study days across devices. The app remains usable locally without an account.

## Cloud setup

1. In Firebase, enable Email/Password and Google under **Authentication → Sign-in method**, add your deployed domain to **Authorized domains**, and create a Firestore database.
2. Deploy the included owner-only Firestore rules with `firebase deploy --only firestore:rules` after selecting your Firebase project.
3. Add these environment variables to the Vercel project. Do not put service-account or OpenAI secrets in browser code or commit them:
   - `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` (Firebase web app config)
   - `FIREBASE_MESSAGING_SENDER_ID` (optional)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (the complete service-account JSON, stored as a server-side secret)
   - `OPENAI_API_KEY` (server-side secret)
   - `OPENAI_FEEDBACK_MODEL` (optional; defaults to `gpt-4o-mini`)
4. Deploy the project to Vercel. The app uses `/api/firebase-config` to load the public Firebase web config and `/api/feedback` for authenticated Writing/Speaking feedback.

AI feedback is limited to 3 requests per signed-in user per UTC day. Writing text and Speaking audio/transcripts are sent to OpenAI only after the learner checks the consent box and requests feedback. The app does not save that content to Firestore. Review OpenAI's current data-use terms before launch.

## English Podcasts

The English Podcasts page links to the ENGLISH PODCASTS Telegram channel, BBC Learning English, and VOA Learning English. Channel episodes and publisher audio open at their original sources; this project does not copy or host those recordings.

## Vocabulary

The Vocabulary Builder includes 92 entries with pronunciation, Uzbek translations, definitions, and example sentences. Search works with English and Uzbek text. The 50 mock-test terms are drawn from the included practice tests; the additional IELTS terms are original material and are not copied from the Essential book.

## Project files

- `ielts-master.html` — application markup and page shell
- `ielts-master.css` — main layout and theme styles
- `ielts-master.js` — navigation, theme, and dashboard behavior
- `account.js` — Firebase sign-in and per-user profile/progress synchronization
- `api/` — Vercel config and authenticated AI feedback endpoints
- `firestore.rules` — owner-only profile/progress access; server-only AI quota
- `vocabulary.js` — additional original IELTS vocabulary entries and rendering
- `mock-tests.css` — mock library, player, and results styles
- `mock-tests.js` — mock library, timers, answer entry, scoring, and Speaking controls
- `mock-bank.js` — imported question bank used by the mock player
- `serve.js` — local static server with audio range support
- `content/` — question-bank data and associated audio/figure assets

Keep these files and the `content/` directory together. Install server dependencies with `npm install` before deploying the Vercel API functions. For microphone recording, grant permission when prompted.

## Content attribution

The imported IELTS Studio / Open Lingua question-bank materials and associated assets are distributed under the MIT license. See [IELTS-STUDIO-LICENSE.txt](IELTS-STUDIO-LICENSE.txt). IELTS Master is an independent practice project and is not affiliated with or endorsed by IELTS.
