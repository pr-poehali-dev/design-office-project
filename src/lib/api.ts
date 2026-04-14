const API_URLS = {
  auth: "https://functions.poehali.dev/5f9050c7-55f5-4006-b7c8-ae19d93f9160",
  projects: "https://functions.poehali.dev/354a783a-eed5-46be-811e-db5f09633e08",
  designers: "https://functions.poehali.dev/bfe179cb-2802-48ba-94bc-ede7fea2ab25",
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