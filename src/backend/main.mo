import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  type FileId = Text;
  type MimeType = Text;

  public type FileMetadata = {
    id : FileId;
    name : Text;
    size : Nat;
    mimeType : MimeType;
    uploadTimestamp : Time.Time;
    owner : Principal;
    sharedWith : [Principal];
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

  // Initialize Authorization and Storage systems
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let files = Map.empty<FileId, FileMetadata>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var fileCounter : Nat = 0;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func isOwner(file : FileMetadata, principal : Principal) : Bool {
    file.owner == principal;
  };

  public shared ({ caller }) func uploadFile(name : Text, size : Nat, mimeType : MimeType, blob : Storage.ExternalBlob) : async FileId {
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
      blob;
    };

    files.add(id, fileMetadata);
    id;
  };

  public query ({ caller }) func listMyFiles() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list files");
    };
    files.values().toArray().filter(
      func(file) {
        file.owner == caller;
      }
    );
  };

  public query ({ caller }) func listFilesSharedWithMe() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list shared files");
    };
    files.values().toArray().filter(
      func(file) {
        file.sharedWith.find(
          func(principal) {
            principal == caller;
          }
        ) != null;
      }
    );
  };

  public shared ({ caller }) func shareFile(fileId : FileId, principal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can share files");
    };

    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };

    if (not isOwner(file, caller)) {
      Runtime.trap("Unauthorized: Only the owner can share this file");
    };

    if (file.sharedWith.find(func(p) { p == principal }) != null) {
      return ();
    };

    let updatedFile : FileMetadata = {
      file with
      sharedWith = file.sharedWith.concat([principal]);
    };

    files.add(fileId, updatedFile);
  };

  public shared ({ caller }) func unshareFile(fileId : FileId, principal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can unshare files");
    };

    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };

    if (not isOwner(file, caller)) {
      Runtime.trap("Unauthorized: Only the owner can unshare this file");
    };

    let updatedFile : FileMetadata = {
      file with
      sharedWith = file.sharedWith.filter(
        func(p) {
          not (p == principal);
        }
      );
    };

    files.add(fileId, updatedFile);
  };

  public shared ({ caller }) func deleteFile(fileId : FileId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete files");
    };

    let file = switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) { file };
    };

    if (not isOwner(file, caller)) {
      Runtime.trap("Unauthorized: Only the owner can delete this file");
    };

    files.remove(fileId);
  };

  public query ({ caller }) func getFile(fileId : FileId) : async ?FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access files");
    };

    switch (files.get(fileId)) {
      case (null) { null };
      case (?file) {
        if (isOwner(file, caller) or file.sharedWith.find(func(principal) { principal == caller }) != null) {
          ?file;
        } else {
          Runtime.trap("Unauthorized: You do not have access to this file");
        };
      };
    };
  };
};
