import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface FileMetadata {
    id: FileId;
    sharedWithGroups: Array<GroupId>;
    owner: Principal;
    blob: ExternalBlob;
    name: string;
    size: bigint;
    mimeType: MimeType;
    uploadTimestamp: Time;
    sharedWith: Array<Principal>;
}
export interface CreateGroupRequest {
    members: Array<Principal>;
    name: GroupName;
}
export interface Group {
    id: GroupId;
    members: Array<Principal>;
    owner: Principal;
    name: GroupName;
    createdAt: Time;
}
export type GroupId = string;
export type MimeType = string;
export type GroupName = string;
export type FileId = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGroupMember(groupId: GroupId, member: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(request: CreateGroupRequest): Promise<GroupId>;
    deleteFile(fileId: FileId): Promise<void>;
    deleteGroup(groupId: GroupId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFile(fileId: FileId): Promise<FileMetadata | null>;
    getGroup(groupId: GroupId): Promise<Group | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listFilesSharedWithMe(): Promise<Array<FileMetadata>>;
    listGroupsByMember(member: Principal): Promise<Array<Group>>;
    listGroupsByOwner(owner: Principal): Promise<Array<Group>>;
    listMyFiles(): Promise<Array<FileMetadata>>;
    removeGroupMember(groupId: GroupId, member: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    shareFile(fileId: FileId, principal: Principal): Promise<void>;
    shareFileWithGroup(fileId: FileId, groupId: GroupId): Promise<void>;
    unshareFile(fileId: FileId, principal: Principal): Promise<void>;
    unshareFileFromGroup(fileId: FileId, groupId: GroupId): Promise<void>;
    uploadFile(name: string, size: bigint, mimeType: MimeType, blob: ExternalBlob): Promise<FileId>;
}
