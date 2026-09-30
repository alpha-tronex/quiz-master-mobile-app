# App Store resubmission — Guideline 5.1.1(v) (account deletion)

Drafted 2026-09-29. Use this when resubmitting the build that adds in-app
account deletion. Paste the relevant section into the matching App Store
Connect field; nothing here needs to be sent as a literal file to Apple.

## Reply to the rejection (App Store Connect "Reply" box, Resolution Center)

> Thank you for the review. We've addressed Guideline 5.1.1(v): the app now
> supports in-app account deletion for every user.
>
> On the Account tab, a "Delete my account" button (under a "Danger zone"
> section) lets any signed-in user permanently and immediately delete their
> account. This is a hard delete, not deactivation — the user's account
> record and quiz history are removed right away, with no separate
> customer-service step required. The action is confirmed with a native
> alert before it executes, since it's irreversible.
>
> Steps to test:
> 1. Log in (or register a new account — registration is self-service).
> 2. Tap the "Account" tab.
> 3. Scroll to "Danger zone" and tap "Delete my account."
> 4. Confirm the dialog. The app immediately signs the account out and
>    returns to the login screen; the account and its data no longer exist.
>
> We've submitted a new build with this change. Please let us know if
> anything else is needed.

## What's New / release notes (App Store Connect "What's New in This Version")

> This update adds the ability to permanently delete your account and all
> associated quiz history directly from the app (Account tab → Delete my
> account). Minor stability improvements.

## App Review Information (if Apple asks about the deletion flow specifically)

> Account deletion: Account tab → "Delete my account" (in the "Danger zone"
> section near the bottom) → confirm in the dialog. Deletion is immediate,
> permanent, and requires no additional login or customer-service contact.

## Not something I can do for you

Apple's 5.1.1(v) review typically also expects (or App Review may separately
ask for) a short screen recording showing the deletion flow end-to-end on a
real device. I can't record your device's screen — you'll need to capture
that yourself (e.g. iPhone Control Center screen recording while you log in,
open Account, and tap through Delete my account) and attach it if Apple's
review notes request one. Everything else above is ready to paste in.
