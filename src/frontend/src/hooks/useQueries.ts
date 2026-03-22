import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type {
  CreateGroupRequest,
  FileMetadata,
  Group,
  GroupId,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

export function useListMyFiles() {
  const { actor, isFetching } = useActor();
  return useQuery<FileMetadata[]>({
    queryKey: ["myFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListSharedWithMe() {
  const { actor, isFetching } = useActor();
  return useQuery<FileMetadata[]>({
    queryKey: ["sharedWithMe"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFilesSharedWithMe();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useUploadFile(onProgress: (p: number) => void) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      bytes,
    }: {
      file: File;
      bytes: Uint8Array;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const fixedBytes = new Uint8Array(
        bytes.buffer.slice(0),
      ) as Uint8Array<ArrayBuffer>;
      const blob =
        ExternalBlob.fromBytes(fixedBytes).withUploadProgress(onProgress);
      return actor.uploadFile(
        file.name,
        BigInt(file.size),
        file.type || "application/octet-stream",
        blob,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}

export function useDeleteFile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteFile(fileId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}

export function useShareFile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileId,
      principal,
    }: { fileId: string; principal: Principal }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.shareFile(fileId, principal);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}

export function useUnshareFile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileId,
      principal,
    }: { fileId: string; principal: Principal }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.unshareFile(fileId, principal);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ── Group queries ─────────────────────────────────────────────────────────────

export function useListMyGroups(principalId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Group[]>({
    queryKey: ["myGroups", principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.listGroupsByMember(Principal.fromText(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetGroup(groupId: GroupId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Group | null>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return null;
      return actor.getGroup(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateGroupRequest) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createGroup(request);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useAddGroupMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      member,
    }: { groupId: GroupId; member: Principal }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addGroupMember(groupId, member);
    },
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useRemoveGroupMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      member,
    }: { groupId: GroupId; member: Principal }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.removeGroupMember(groupId, member);
    },
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useDeleteGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: GroupId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteGroup(groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useShareFileWithGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileId,
      groupId,
    }: { fileId: string; groupId: GroupId }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.shareFileWithGroup(fileId, groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}

export function useUnshareFileFromGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileId,
      groupId,
    }: { fileId: string; groupId: GroupId }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.unshareFileFromGroup(fileId, groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFiles"] });
    },
  });
}
