# FamilyShare

## Current State
New project with no existing application files.

## Requested Changes (Diff)

### Add
- File upload feature (any file type) using blob-storage
- File listing with name, size, upload date, and uploader
- Download files
- Delete files (owner or admin only)
- User authentication via authorization component
- Share files with other users by username/principal
- View shared files (files others shared with you)
- My Files view vs Shared With Me view

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Define file metadata storage (name, size, type, uploader, timestamp, shared-with list)
2. Backend: Upload file (store blob + metadata)
3. Backend: List my files
4. Backend: List files shared with me
5. Backend: Share a file with another user (by principal)
6. Backend: Delete a file (owner only)
7. Backend: Get download URL for a file
8. Frontend: Login/logout with authorization
9. Frontend: Upload file UI with drag-and-drop
10. Frontend: My Files tab with file cards (name, size, date, share/delete actions)
11. Frontend: Shared With Me tab
12. Frontend: Share modal (enter username/principal to share)
