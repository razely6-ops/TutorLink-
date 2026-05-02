# Security Specification - TutorLink

## Data Invariants
1. A booking must have a valid `studentId` and `tutorId`.
2. A user can only edit their own profile.
3. Only participants can read and write to a chat room.
4. Messages must be sent by a participant of the chat room.

## The Dirty Dozen Payloads
1. Create a `user` document with another user's UID. (Deny)
2. Create a `booking` where `studentId` is not the current user's UID. (Deny)
3. Change the `price` of a `booking` after it's confirmed. (Deny)
4. Read a `chat_room` where the current user is not in `participantIds`. (Deny)
5. Send a `message` to a `chat_room` the user is not in. (Deny)
6. Spoof `senderId` in a `message`. (Deny)
7. Make oneself a "featured" tutor without permission. (Deny)
8. Delete a `booking` created by someone else. (Deny)
9. List all `users` without filtering by UID. (Deny)
10. Update `rating` on a `tutor_profile` directly. (Deny - should be via cloud function or restricted update)
11. Inject a massive string into `bio`. (Deny)
12. Use a non-numeric value for `rates`. (Deny)

## Test Runner (Conceptual)
Verified manually via Firestore Emulator or logically via rules audits.
