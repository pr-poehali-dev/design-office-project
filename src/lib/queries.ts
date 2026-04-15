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
  getProposal,
  createProposal,
  updateProposal,
  uploadProposalBg,
  getProposalTemplates,
  saveProposalTemplate,
  deleteProposalTemplate,
  updateProfile,
  uploadAvatar,
  getPortfolio,
  addPortfolioItem,
  deletePortfolioItem,
  getCompanyData,
  saveCompanyData,
  getInbox,
  getUnreadCount,
  getDmMessages,
  sendDm,
  markMessagesRead,
  getEstimate,
  addEstimateItem,
  deleteEstimateItem,
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
  getDocuments,
  uploadDocument,
  deleteDocument,
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

export function useProposal(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["proposal", projectId],
    queryFn: async () => {
      const data = await getProposal(projectId!);
      return data.proposal || null;
    },
    staleTime: STALE_5MIN,
    enabled: !!projectId && enabled,
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["proposal", vars.project_id] });
    },
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateProposal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal"] });
    },
  });
}

export function useUploadProposalBg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { image: string; content_type: string } }) => uploadProposalBg(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal"] });
    },
  });
}

export function useProposalTemplates() {
  return useQuery({
    queryKey: ["proposal-templates"],
    queryFn: async () => {
      const data = await getProposalTemplates();
      return data.templates || [];
    },
    staleTime: STALE_5MIN,
  });
}

export function useSaveProposalTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveProposalTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposal-templates"] }); },
  });
}

export function useDeleteProposalTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProposalTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposal-templates"] }); },
  });
}

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const data = await getInbox();
      return { project_messages: data.project_messages || [], dm_conversations: data.dm_conversations || [] };
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useDmMessages(peerId: string | undefined) {
  return useQuery({
    queryKey: ["dm", peerId],
    queryFn: async () => {
      const data = await getDmMessages(peerId!);
      return data.messages || [];
    },
    enabled: !!peerId,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useSendDm(currentUser?: { id: string; first_name?: string; last_name?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendDm,
    onMutate: async (vars) => {
      const key = ["dm", vars.receiver_id];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      if (currentUser) {
        qc.setQueryData(key, (old: unknown) => {
          const list = Array.isArray(old) ? old : [];
          return [...list, {
            id: `temp-${Date.now()}`, content: vars.content,
            sender_id: currentUser.id, receiver_id: vars.receiver_id,
            sender_first_name: currentUser.first_name || "", sender_last_name: currentUser.last_name || "",
            is_read: false, created_at: new Date().toISOString(),
          }];
        });
      }
      return { prev };
    },
    onError: (_e, vars, ctx) => { if (ctx?.prev) qc.setQueryData(["dm", vars.receiver_id], ctx.prev); },
    onSettled: (_r, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["dm", vars.receiver_id] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markMessagesRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

export function useUpdateProfile() {
  return useMutation({ mutationFn: updateProfile });
}

export function useUploadAvatar() {
  return useMutation({ mutationFn: uploadAvatar });
}

export function usePortfolio() {
  return useQuery({ queryKey: ["portfolio"], queryFn: async () => { const d = await getPortfolio(); return d.items || []; }, staleTime: STALE_5MIN });
}

export function useAddPortfolioItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: addPortfolioItem, onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); } });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deletePortfolioItem, onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); } });
}

export function useCompanyData() {
  return useQuery({
    queryKey: ["company-data"],
    queryFn: getCompanyData,
    staleTime: STALE_5MIN,
  });
}

export function useSaveCompanyData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveCompanyData,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["company-data"] }); },
  });
}

// Estimate
export function useEstimate(projectId: string | undefined) {
  return useQuery({
    queryKey: ["estimate", projectId],
    queryFn: () => getEstimate(projectId!),
    enabled: !!projectId,
    staleTime: STALE_5MIN,
  });
}
export function useAddEstimateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => addEstimateItem(projectId, data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["estimate", v.projectId] }); },
  });
}
export function useDeleteEstimateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: string; itemId: string }) => deleteEstimateItem(projectId, itemId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["estimate", v.projectId] }); },
  });
}

// Payments
export function usePayments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["payments", projectId],
    queryFn: () => getPayments(projectId!),
    enabled: !!projectId,
    staleTime: STALE_5MIN,
  });
}
export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => addPayment(projectId, data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["payments", v.projectId] }); },
  });
}
export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, paymentId, data }: { projectId: string; paymentId: string; data: Record<string, unknown> }) => updatePayment(projectId, paymentId, data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["payments", v.projectId] }); },
  });
}
export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, paymentId }: { projectId: string; paymentId: string }) => deletePayment(projectId, paymentId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["payments", v.projectId] }); },
  });
}

// Documents
export function useDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId!),
    enabled: !!projectId,
    staleTime: STALE_5MIN,
  });
}
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { title: string; file: string; content_type: string; ext: string } }) => uploadDocument(projectId, data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["documents", v.projectId] }); },
  });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, docId }: { projectId: string; docId: string }) => deleteDocument(projectId, docId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["documents", v.projectId] }); },
  });
}