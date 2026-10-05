/**
 * Helper utilities for SIGAP Playwright E2E Tests
 */

export const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Generates unique citizen credentials with timestamp/random suffix
 */
export function generateCitizenData() {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const suffix = ts.toString().slice(-6);
  return {
    nama: `Warga Test ${suffix}`,
    email: `warga_${ts}@sigap.id`,
    password: `Citizen123!`,
    nik: `3201${ts.toString().padStart(12, '0').slice(-12)}`,
    nomor_hp: `0899${ts.toString().slice(-8)}`,
  };
}

/**
 * Registers a new citizen via API and logs in to return user + access_token
 */
export async function registerCitizenApi(request, data = generateCitizenData()) {
  const regResponse = await request.post(`${API_BASE_URL}/auth/register`, {
    data,
  });
  if (!regResponse.ok()) {
    throw new Error(`Failed to register citizen: ${regResponse.status()} ${await regResponse.text()}`);
  }
  const user = await regResponse.json();

  // Log in immediately to obtain access_token
  const loginRes = await loginApi(request, data.email, data.password);

  return {
    user,
    access_token: loginRes.access_token,
    citizenData: data,
  };
}

/**
 * Log in via API and return access_token & user object
 */
export async function loginApi(request, identifier, password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      identifier,
      password,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to login API: ${response.status()} ${await response.text()}`);
  }
  return await response.json();
}
