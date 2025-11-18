# Progress Gemini - Step 7 (Future Steps)

This document outlines the next set of checkpoints identified from analyzing the existing codebase and technical specifications. The primary focus is on replacing mocked implementations with live database logic.

## Checkpoint 20: Implement Live Database Logic for Services

**Files:** 
* `d:\RelaySoftware\relay\services\userService.ts`
* `d:\RelaySoftware\relay\lib\gamification.ts`
* `d:\RelaySoftware\relay\services\referralService.ts`

**Description:** Replace all mocked data and placeholder functions in the user, gamification, and referral services with live Firestore database calls. This involves uncommenting and implementing the database queries for fetching user data, calculating streaks, and processing referrals.

## Checkpoint 21: Implement Live Database Logic for Invoice API

**File:** `d:\RelaySoftware\relay\app\api\invoices\route.ts`

**Description:** Update the `POST` and `GET` handlers in the invoice API to interact with the Firestore database. This includes creating new invoice documents, fetching lists of invoices for a user, and removing the mock data array.

## Checkpoint 22: Implement `PUT` and `DELETE` for Invoices API

**File:** `d:\RelaySoftware\relay\app\api\invoices\route.ts`

**Description:** Add `PUT` (update) and `DELETE` handlers to the invoice API route. This will complete the core CRUD (Create, Read, Update, Delete) functionality for invoices, allowing users to modify and remove invoice records. This will require new Zod validation schemas for updates.

## Checkpoint 23: Implement `processReferral` and `addAccountCredit` Logic

**File:** `d:\RelaySoftware\relay\services\referralService.ts`

**Description:** Implement the full business logic for the `processReferral` and `addAccountCredit` functions. This includes looking up the referrer by their code, creating the referral record in the database, and atomically incrementing the account credit for both the referrer and the new user.