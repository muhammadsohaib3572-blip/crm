---
name: login_debugging
description: Debug and fix pending login request, infinite redirect, and render issues on the Login page
source: auto-skill
extracted_at: '2026-06-09T15:45:00.000Z'
---

## Purpose
This skill provides a step‑by‑step procedure to diagnose and resolve issues where the Login page does not render, the network request to `/auth/login` stays pending, and redirects do not occur.

## Procedure
1. **Start both servers**
   - Run `npm run dev` in `frontend`.
   - Run `uvicorn backend.app.main:app --reload` in `backend`.
   - Verify both processes are listening (frontend on port 3000, backend on port 8000).
2. **Open the login page** (`http://localhost:3000/login`).
   - Ensure the page UI appears. If it does not, check the browser console for JavaScript errors.
3. **Check authentication guard**
   - Review `frontend/app/layout.tsx` and `frontend/components/auth/ProtectedRoute.tsx` for redirect logic.
   - Confirm `isLoading` state is set to `false` after the initial token rehydration.
   - Verify `PUBLIC_PATHS` includes `'/login'` so the guard does not redirect away.
4. **Inspect the network request**
   - In DevTools > Network, look for the `POST /auth/login` request.
   - If it remains **pending**:
     - Confirm the backend endpoint is reachable (`curl http://localhost:8000/auth/login`).
     - Ensure the Axios instance has `baseURL` correctly set and `withCredentials` is a boolean (`true`).
     - Verify the request headers contain `Content-Type: application/x-www-form-urlencoded` and `Authorization` is **not** sent on the login call.
5. **Validate backend response**
   - The FastAPI `/auth/login` route should return JSON with `access_token` and `refresh_token`.
   - If the response is missing or returns 5xx, check the backend logs for DB connection or auth‑service errors.
6. **Token handling**
   - In `LoginForm.tsx`, after a successful login, tokens are saved to `localStorage` **before** calling `/auth/me`.
   - Ensure `localStorage.setItem` succeeds (no storage quota errors).
   - Confirm `api.interceptors.request` adds the `Authorization` header from `localStorage` for the subsequent `/auth/me` call.
7. **Redirect after login**
   - Verify `router.push('/dashboard')` executes after `setAuth` resolves.
   - Check that the dashboard route is not blocked by `ProtectedRoute` (user role must be allowed).
8. **Common pitfalls & fixes**
   - **Incorrect `withCredentials` type** – change from string to boolean (already done).
   - **Infinite redirect loop** – make sure `PUBLIC_PATHS` contains `'/login'` and that the `useEffect` guard does not fire before `isLoading` is cleared.
   - **CORS / same‑origin** – if backend runs on a different origin, ensure CORS middleware allows credentials.
   - **Pending request due to missing response** – add `return` statements in FastAPI endpoints and ensure DB session is committed.
9. **Final verification**
   - Refresh the page, fill in valid credentials, and watch the request complete (200 OK).
   - Confirm navigation to `/dashboard` and that the dashboard renders.
   - Check `localStorage` contains both tokens.

## After‑action
- Commit any code changes (e.g., Axios config, guard `useEffect` fixes).
- Add a note to the project memory summarizing the root cause and fix.

---

*This skill was auto‑generated on 2026‑06‑09.*