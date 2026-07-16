const API_BASE_URL = "http://localhost:3000/api";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Pega o ID do médico do sessionStorage
  const sessionStr = sessionStorage.getItem("doctor_session");
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.id) {
        headers.set("x-doctor-id", session.id);
      }
    } catch (e) {
      console.error("Erro ao ler sessão do sessionStorage", e);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) =>
    fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) =>
    fetchWithAuth(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: "DELETE" }),
};
