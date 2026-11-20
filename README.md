# Fanta PWAs

Use three Vercel projects pointing to the same repository and root directory. Each project uses the Vite preset, `npm run build`, and the `dist` output directory. Give each project its own origin because all three service workers control `/`.

| Project | Vercel environment variable | Local development | Local production build |
| --- | --- | --- | --- |
| Fanta | `VITE_APP_TARGET=viewer` | `npm run dev:viewer` | `npm run build:viewer` |
| Fanta Admin | `VITE_APP_TARGET=admin` | `npm run dev:admin` | `npm run build:admin` |
| Fanta Ref | `VITE_APP_TARGET=referee` | `npm run dev:referee` | `npm run build:referee` |

Set the target for both Preview and Production. An unset target builds the viewer. Each build replaces the local `dist` directory. The existing Vercel rewrite serves the selected app on direct links and refreshes.

Configure the same league Firebase web settings on all three projects. For a custom staff PIN, set `VITE_ADMIN_PIN` on the admin project or `VITE_REFEREE_PIN` on the referee project. PINs control the client interface. Firestore authorization requires backend rules.

To check installation locally, run the desired production build and `npm run preview`. Native installation requires a supported browser on HTTPS or localhost.

## Live snapshot and mobile notifications

Fans read `public/live_snapshot`. Staff listen to the source collections and publish confirmed changes. To rebuild the snapshot manually, run `node scripts/syncPublicSnapshot.mjs` from the repository root. Each delivered snapshot update costs one read per connected fan. The document must fit Firestore's 1 MiB limit.

Set these additional Vercel environment variables, then redeploy each affected project.

| Variable | Projects | Value |
| --- | --- | --- |
| `VITE_FIREBASE_VAPID_KEY` | Viewer | Firebase Console → Project settings → Cloud Messaging → Web Push certificates → public key |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Viewer, Admin and Referee | Firebase Console → Project settings → Service accounts → Generate new private key. Paste the complete JSON into the server environment. |

Enable the Firebase Cloud Messaging API and FCM Registration API in the same Google Cloud project. The service account needs permission to send FCM messages and manage topic subscriptions. Keep its JSON outside source control. Vercel runs the two Node APIs. No Firebase Functions deployment is involved.

For a device check, open the deployed Viewer over HTTPS, enable notifications, then background the app. On iOS, install it on the Home Screen first. A notification from a real staff event opens the corresponding viewer match. Test on an isolated Firebase project before broadcasting trial messages to fans.
