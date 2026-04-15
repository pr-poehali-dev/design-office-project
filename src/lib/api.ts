const API_URLS = {
  auth: "https://functions.poehali.dev/5f9050c7-55f5-4006-b7c8-ae19d93f9160",
  projects: "https://functions.poehali.dev/354a783a-eed5-46be-811e-db5f09633e08",
  designers: "https://functions.poehali.dev/bfe179cb-2802-48ba-94bc-ede7fea2ab25",
  tasks: "https://functions.poehali.dev/a3b72923-93e5-4052-8d6a-7c879d1621cc",
  messages: "https://functions.poehali.dev/1bb1fc89-5192-4068-8f31-750a8936c19c",
  team: "https://functions.poehali.dev/a4261477-82d9-4aee-90c1-67a418897761",
  proposals: "https://functions.poehali.dev/db119ef3-ac19-49e0-bd31-0b0ddec2a678",
};

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// Auth
export async function registerUser(data: {
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  city?: string;
  specialization?: string;
  phone?: string;
}) {
  const res = await fetch(`${API_URLS.auth}?action=register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URLS.auth}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${API_URLS.auth}?action=me`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function inviteMember(data: {
  email: string;
  project_id: string;
  role: string;
}) {
  const res = await fetch(`${API_URLS.auth}?action=invite`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Projects
export async function getProjects() {
  const res = await fetch(API_URLS.projects, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createProject(data: {
  title: string;
  description?: string;
  address?: string;
  area?: number;
  rooms?: number;
  style?: string;
  budget?: number;
  start_date?: string;
  deadline?: string;
}) {
  const res = await fetch(API_URLS.projects, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getProject(id: string) {
  const res = await fetch(`${API_URLS.projects}?id=${id}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function updateProject(
  id: string,
  data: Record<string, unknown>
) {
  const res = await fetch(`${API_URLS.projects}?id=${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProject(id: string) {
  const res = await fetch(`${API_URLS.projects}?id=${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Tasks
export async function getTasksByProject(projectId: string) {
  const res = await fetch(`${API_URLS.tasks}?project_id=${projectId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAllTasks() {
  const res = await fetch(API_URLS.tasks, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createTask(data: {
  project_id: string;
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
  stage_id?: string;
  assigned_to?: string;
}) {
  const res = await fetch(API_URLS.tasks, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTask(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_URLS.tasks}?id=${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTask(id: string) {
  const res = await fetch(`${API_URLS.tasks}?id=${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Messages
export async function getMessages(projectId: string) {
  const res = await fetch(`${API_URLS.messages}?project_id=${projectId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function sendMessage(data: { project_id: string; content: string }) {
  const res = await fetch(API_URLS.messages, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Team
export async function getTeam() {
  const res = await fetch(API_URLS.team, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function inviteToTeam(data: { email: string; team_role?: string }) {
  const res = await fetch(API_URLS.team, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTeamMember(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_URLS.team}?id=${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function removeTeamMember(id: string) {
  const res = await fetch(`${API_URLS.team}?id=${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Proposals
export async function getProposal(projectId: string) {
  const res = await fetch(`${API_URLS.proposals}?project_id=${projectId}`, { method: "GET", headers: authHeaders() });
  return handleResponse(res);
}

export async function createProposal(data: { project_id: string; items?: { title: string; description: string; price: number; order_number: number }[]; template_name?: string }) {
  const res = await fetch(API_URLS.proposals, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}

export async function updateProposal(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_URLS.proposals}?id=${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}

export async function uploadProposalBg(id: string, data: { image: string; content_type: string }) {
  const res = await fetch(`${API_URLS.proposals}?id=${id}&action=upload_bg`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}

export async function deleteProposal(id: string) {
  const res = await fetch(`${API_URLS.proposals}?id=${id}`, { method: "DELETE", headers: authHeaders() });
  return handleResponse(res);
}

export async function getProposalTemplates() {
  const res = await fetch(`${API_URLS.proposals}?action=templates`, { method: "GET", headers: authHeaders() });
  return handleResponse(res);
}

export async function saveProposalTemplate(data: { name: string; items: { title: string; description: string; price: number; order_number: number }[] }) {
  const res = await fetch(`${API_URLS.proposals}?action=save_template`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}

export async function deleteProposalTemplate(id: string) {
  const res = await fetch(`${API_URLS.proposals}?id=${id}&action=delete_template`, { method: "DELETE", headers: authHeaders() });
  return handleResponse(res);
}

// Designers
export async function getDesigners(params?: {
  city?: string;
  specialization?: string;
  search?: string;
}) {
  const url = new URL(API_URLS.designers);
  if (params?.city) url.searchParams.set("city", params.city);
  if (params?.specialization)
    url.searchParams.set("specialization", params.specialization);
  if (params?.search) url.searchParams.set("search", params.search);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}