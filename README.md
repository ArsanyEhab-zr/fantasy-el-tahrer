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
