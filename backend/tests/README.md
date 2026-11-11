# Backend tests

Run from the `backend` folder:

    npm test

No database, no internet and no extra packages are needed (uses Node's built-in
test runner, Node 18+). Tests can never touch your real database: Prisma,
email, WhatsApp and Cloudinary are replaced with fakes (`tests/helpers`).

| File | Covers |
|---|---|
| `auth.test.js` | login, token checks, forgot password, reset password |
| `permissions.test.js` | admin vs employee rules, role taken from DB, expired subscription = read-only |
| `isolation.test.js` | company A can never see/change company B's customers, leads, chats, messages, employees |

`todo` tests are KNOWN GAPS in the app, not broken tests. They show as
`not ok ... # TODO` and do not fail the run. When you fix the app behaviour,
remove the `{ todo: ... }` option so the test is enforced from then on.

Tip: `DEBUG_TESTS=1 npm test` shows the controllers' console logs.

The isolation tests use a fake database that really applies `where` filters, so
a query that forgets `companyId` makes a test fail.
