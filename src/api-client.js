import { DEFAULT_API_URL } from "./constants.js";

export class MiniPMDBClient {
  constructor(baseUrl = process.env.MINIPMDB_API_URL || DEFAULT_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get(pathname, query = {}) {
    const url = new URL(`${this.baseUrl}${pathname}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    return request(url, { method: "GET" });
  }

  async post(pathname, body = {}) {
    return request(`${this.baseUrl}${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`MiniPMDB is not reachable at ${new URL(url).origin}. Start it with npm start. (${error.message})`);
  }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(value.message || value.error || `MiniPMDB request failed with ${response.status}.`);
  return value;
}
