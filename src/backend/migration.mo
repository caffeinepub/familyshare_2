import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
  type OldFileId = Text;
  type OldMimeType = Text;

  type OldFileMetadata = {
    id : OldFileId;
    name : Text;
    size : Nat;
    mimeType : OldMimeType;
    uploadTimestamp : Int;
    owner : Principal;
    sharedWith : [Principal];
    blob : Storage.ExternalBlob;
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    files : Map.Map<Text, OldFileMetadata>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    fileCounter : Nat;
  };

  type NewFileId = Text;
  type NewMimeType = Text;

  type NewFileMetadata = {
    id : NewFileId;
    name : Text;
    size : Nat;
    mimeType : NewMimeType;
    uploadTimestamp : Int;
    owner : Principal;
    sharedWith : [Principal];
    sharedWithGroups : [Text];
    blob : Storage.ExternalBlob;
  };

  type NewUserProfile = {
    name : Text;
  };

  type NewGroupId = Text;
  type NewGroupName = Text;

  type CreateGroupRequest = {
    name : NewGroupName;
    members : [Principal];
  };

  type NewGroup = {
    id : NewGroupId;
    name : NewGroupName;
    owner : Principal;
    members : [Principal];
    createdAt : Int;
  };

  type NewActor = {
    files : Map.Map<Text, NewFileMetadata>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    groups : Map.Map<NewGroupId, NewGroup>;
    fileCounter : Nat;
    groupCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newFiles = old.files.map<Text, OldFileMetadata, NewFileMetadata>(
      func(_fileId, oldFileMetadata) {
        {
          oldFileMetadata with
          sharedWithGroups = [];
        };
      }
    );
    {
      files = newFiles;
      userProfiles = old.userProfiles;
      groups = Map.empty<NewGroupId, NewGroup>();
      fileCounter = old.fileCounter;
      groupCounter = 0;
    };
  };
};
