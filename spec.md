# FamilyShare

## Current State
FamilyShare allows users to upload files, share them with individuals via Principal ID, and view files shared with them. There is no group concept -- sharing is strictly one-to-one.

## Requested Changes (Diff)

### Add
- Group data model: GroupId, Group (name, owner, members: [Principal], sharedFiles: [FileId])
- `createGroup(name)` -- creates a group owned by the caller
- `addMemberToGroup(groupId, principal)` -- owner adds a member by Principal ID
- `removeMemberFromGroup(groupId, principal)` -- owner removes a member
- `shareFileWithGroup(fileId, groupId)` -- owner shares a file with all group members
- `listMyGroups()` -- returns groups the caller owns or is a member of
- `getGroup(groupId)` -- returns group details
- `deleteGroup(groupId)` -- owner can delete a group
- Frontend: "Groups" tab in sidebar/bottom nav
- Frontend: Group list with create button
- Frontend: Group detail view: member list, add member by Principal ID, shared files list
- Frontend: "Share to Group" option in file share modal

### Modify
- `listFilesSharedWithMe` -- also returns files shared via any group the caller is in
- ShareModal -- add a second tab or section to share to a group
- NAV_ITEMS -- add Groups nav item

### Remove
- Nothing removed

## Implementation Plan
1. Add Group type and group storage map to backend
2. Implement group CRUD methods with access control
3. Update `listFilesSharedWithMe` to include group-shared files
4. Regenerate backend bindings
5. Add Groups section to frontend with create/manage UI
6. Update ShareModal to support share-to-group
7. Add Groups nav item
