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
    onSuccess: () => {
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

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.project_id] });
    },
  });
}

export function useInviteMember() {
  return useMutation({
    mutationFn: inviteMember,
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