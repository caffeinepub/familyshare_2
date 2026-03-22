import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";


actor {
  type FileId = Text;
  type MimeType = Text;
  type GroupId = Text;
  type GroupName = Text;

  public type FileMetadata = {
    id : FileId;
    name : Text;
    size : Nat;
    mimeType : MimeType;
    uploadTimestamp : Time.Time;
    owner : Principal;
    sharedWith : [Principal];
    sharedWithGroups : [GroupId];
    blob : Storage.ExternalBlob;
  };

  module FileMetadata {
    public func compareByTimestamp(file1 : FileMetadata, file2 : FileMetadata) : Order.Order {
      Int.compare(file1.uploadTimestamp, file2.uploadTimestamp);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  public type CreateGroupRequest = {
    name : GroupName;
    members : [Principal];
  };

  public type Group = {
    id : GroupId;
    name : GroupName;
    owner : Principal;
    members : [Principal];
    createdAt : Time.Time;
  };

  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let files = Map.empty<FileId, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let groups = Map.empty<GroupId, Group>();
  var fileCounter : Nat = 0;
  var groupCounter : Nat = 0;

  // Auto-register any authenticated caller as a user.
  // Guards against state loss on canister upgrade/restart.
  func ensureRegistered(caller : Principal) {
    if (not caller.isAnonymous()) {
      switch (accessControlState.userRoles.get(caller)) {
        case (null) { accessControlState.userRoles.add(caller, #user); };
        case (?_) {};
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized") };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized") };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  func isOwner(file : FileMetadata, principal : Principal) : Bool {
    file.owner == principal;
  };

  public shared ({ caller }) func uploadFile(name : Text, size : Nat, mimeType : MimeType, blob : Storage.ExternalBlob) : async FileId {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload files");
    };

    fileCounter += 1;
    let id = "file_" # fileCounter.toText();

    let fileMetadata : FileMetadata = {
      id;
      name;
      size;
      mimeType;
      uploadTimestamp = Time.now();
      owner = caller;
      sharedWith = [];
      sharedWithGroups = [];
      blob;
    };

    files.add(id, fileMetadata);
    id;
  };

  public query ({ caller }) func listMyFiles() : async [FileMetadata] {
    if (caller.isAnonymous()) { return [] };
    files.values().toArray().filter(
      func(file) { file.owner == caller; }
    );
  };

  func isMemberOfAnyGroup(principal : Principal, groupIds : [GroupId]) : Bool {
    groupIds.find(
      func(groupId) {
        switch (groups.get(groupId)) {
          case (null) { false };
          case (?group) {
            group.members.find(func(member) { member == principal }) != null;
          };
        };
      }
    ) != null;
  };

  public query ({ caller }) func listFilesSharedWithMe() : async [FileMetadata] {
    if (caller.isAnonymous()) { return [] };
    files.values().toArray().filter(
      func(file) {
        file.sharedWith.find(func(principal) { principal == caller }) != null
          or isMemberOfAnyGroup(caller, file.sharedWithGroups);
      }
    );
  };

  public shared ({ caller }) func shareFile(fileId : FileId, principal : Principal) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };
    if (not isOwner(file, caller)) { Runtime.trap("Unauthorized: Only the owner can share this file") };
    if (file.sharedWith.find(func(p) { p == principal }) != null) { return () };
    files.add(fileId, { file with sharedWith = file.sharedWith.concat([principal]) });
  };

  public shared ({ caller }) func shareFileWithGroup(fileId : FileId, groupId : GroupId) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };
    if (not isOwner(file, caller)) { Runtime.trap("Unauthorized: Only the owner can share this file") };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (file.sharedWithGroups.find(func(id) { id == groupId }) != null) { return () };
        files.add(fileId, { file with sharedWithGroups = file.sharedWithGroups.concat([groupId]) });
      };
    };
  };

  public shared ({ caller }) func unshareFile(fileId : FileId, principal : Principal) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };
    if (not isOwner(file, caller)) { Runtime.trap("Unauthorized: Only the owner can unshare this file") };
    files.add(fileId, { file with sharedWith = file.sharedWith.filter(func(p) { not (p == principal) }) });
  };

  public shared ({ caller }) func unshareFileFromGroup(fileId : FileId, groupId : GroupId) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };
    if (not isOwner(file, caller)) { Runtime.trap("Unauthorized: Only the owner can unshare this file") };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        files.add(fileId, { file with sharedWithGroups = file.sharedWithGroups.filter(func(id) { id != groupId }) });
      };
    };
  };

  public shared ({ caller }) func deleteFile(fileId : FileId) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };
    if (not isOwner(file, caller)) { Runtime.trap("Unauthorized: Only the owner can delete this file") };
    files.remove(fileId);
  };

  public query ({ caller }) func getFile(fileId : FileId) : async ?FileMetadata {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized") };
    switch (files.get(fileId)) {
      case (null) { null };
      case (?file) {
        if (isOwner(file, caller) or file.sharedWith.find(func(principal) { principal == caller }) != null or isMemberOfAnyGroup(caller, file.sharedWithGroups)) {
          ?file;
        } else {
          Runtime.trap("Unauthorized: You do not have access to this file");
        };
      };
    };
  };

  public shared ({ caller }) func createGroup(request : CreateGroupRequest) : async GroupId {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    groupCounter += 1;
    let id = "group_" # groupCounter.toText();
    groups.add(id, {
      id;
      name = request.name;
      owner = caller;
      members = request.members.concat([caller]);
      createdAt = Time.now();
    });
    id;
  };

  public shared ({ caller }) func addGroupMember(groupId : GroupId, member : Principal) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.owner != caller) { Runtime.trap("Unauthorized: Only the group owner can add members") };
        if (group.members.find(func(p) { p == member }) != null) { return () };
        groups.add(groupId, { group with members = group.members.concat([member]) });
      };
    };
  };

  public shared ({ caller }) func removeGroupMember(groupId : GroupId, member : Principal) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.owner != caller) { Runtime.trap("Unauthorized: Only the group owner can remove members") };
        groups.add(groupId, { group with members = group.members.filter(func(p) { p != member }) });
      };
    };
  };

  public shared ({ caller }) func deleteGroup(groupId : GroupId) : async () {
    ensureRegistered(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.owner != caller) { Runtime.trap("Unauthorized: Only the group owner can delete this group") };
        groups.remove(groupId);
      };
    };
  };

  public query ({ caller }) func listGroupsByOwner(owner : Principal) : async [Group] {
    if (caller.isAnonymous()) { return [] };
    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    groups.values().toArray().filter(func(group) { group.owner == owner });
  };

  public query ({ caller }) func listGroupsByMember(member : Principal) : async [Group] {
    if (caller.isAnonymous()) { return [] };
    if (caller != member and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    groups.values().toArray().filter(
      func(group) { group.members.find(func(p) { p == member }) != null }
    );
  };

  public query ({ caller }) func getGroup(groupId : GroupId) : async ?Group {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized") };
    switch (groups.get(groupId)) {
      case (null) { null };
      case (?group) {
        let isMember = group.members.find(func(p) { p == caller }) != null;
        if (not isMember and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only group members can view this group");
        };
        ?group;
      };
    };
  };
};
