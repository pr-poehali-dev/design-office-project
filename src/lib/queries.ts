import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getAllTasks,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  getMessages,
  sendMessage,
  inviteMember,
  getDesigners,
  getTeam,
  inviteToTeam,
  updateTeamMember,
  removeTeamMember,
} from "./api";

const STALE_5MIN = 5 * 60 * 1000;

export function useProjects(enabled = true) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await getProjects();
      return data.projects || [];
    },
    staleTime: STALE_5MIN,
    enabled,
  });
}

export function useProject(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const data = await getProject(id!);
      return data.project;
    },
    staleTime: STALE_5MIN,
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateProject(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", vars.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAllTasks(enabled = true) {
  return useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const data = await getAllTasks();
      return data.tasks || [];
    },
    staleTime: STALE_5MIN,
    enabled,
  });
}

export function useProjectTasks(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["tasks", "project", projectId],
    queryFn: async () => {
      const data = await getTasksByProject(projectId!);
      return data.tasks || [];
    },
    staleTime: STALE_5MIN,
    enabled: !!projectId && enabled,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });

      const prevAll = qc.getQueryData(["tasks", "all"]);
      const prevProject = qc.getQueriesData({ queryKey: ["tasks", "project"] });

      const patchList = (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: Record<string, unknown>) => t.id === id ? { ...t, ...data } : t);
      };

      qc.setQueryData(["tasks", "all"], patchList);
      qc.setQueriesData({ queryKey: ["tasks", "project"] }, patchList);

      return { prevAll, prevProject };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevAll) qc.setQueryData(["tasks", "all"], context.prevAll);
      if (context?.prevProject) {
        for (const [key, data] of context.prevProject) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useMessages(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const data = await getMessages(projectId!);
      return data.messages || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
    enabled: !!projectId && enabled,
  });
}

export function useSendMessage(currentUser?: { id: string; first_name?: string; last_name?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["messages", vars.project_id] });
      const prev = qc.getQueryData(["messages", vars.project_id]);

      if (currentUser) {
        qc.setQueryData(["messages", vars.project_id], (old: unknown) => {
          const list = Array.isArray(old) ? old : [];
          return [...list, {
            id: `temp-${Date.now()}`,
            content: vars.content,
            sender_id: currentUser.id,
            sender_first_name: currentUser.first_name || "",
            sender_last_name: currentUser.last_name || "",
            created_at: new Date().toISOString(),
          }];
        });
      }

      return { prev };
    },
    onError: (_err, vars, context) => {
      if (context?.prev) qc.setQueryData(["messages", vars.project_id], context.prev);
    },
    onSettled: (_res, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.project_id] });
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

export function useDesigners(params?: { city?: string; specialization?: string; search?: string }) {
  return useQuery({
    queryKey: ["designers", params?.city || "", params?.specialization || "", params?.search || ""],
    queryFn: () => getDesigners(params),
    staleTime: STALE_5MIN,
    select: (data) => data.designers || [],
  });
}

export function useTeam(enabled = true) {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const data = await getTeam();
      return data.members || [];
    },
    staleTime: STALE_5MIN,
    enabled,
  });
}

export function useInviteToTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteToTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateTeamMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}