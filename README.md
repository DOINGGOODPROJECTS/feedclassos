# FeedClass Beta (SMMS UI)

Frontend-only prototype for the School Meal Management Software (SMMS) MVP.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

## Role switcher
- Use the Role Switcher in the top-right header to swap between `ADMIN`, `SUPERVISOR`, and `DONOR_READONLY`.
- Routes are guarded client-side; unauthorized routes show a 403 page.
- Admins can change the active school context in the header.

## Test the scan flow
Navigate to `/app/supervisor/scan` and use a mock QR payload:
- `SMMS-RB-1001` (active, should succeed)
- `SMMS-RB-1002` (expired subscription)
- `SMMS-HV-2041` (inactive child)

The validator enforces:
- school match
- active subscription and validity dates
- meals remaining
- double-scan prevention (same meal type, same day)

## Simulate payment webhook success
- Go to `/app/admin/payments`
- Click **Simulate webhook success** on a payment intent
- The handler is idempotent via `external_tx_id` (replays are ignored)

## Notes
- Mock data lives in `lib/mockData.ts`.
- Mock service layer with latency is in `lib/mockApi.ts`.
- This is frontend-only: no backend, no external services.
