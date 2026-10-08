const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function searchVendors(
  lat: number,
  lng: number,
  radiusKm: number,
  category?: string
) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radiusKm: radiusKm.toString(),
  });
  if (category && category !== "ALL") {
    params.append("category", category);
  }

  const res = await fetch(`${API_BASE}/vendors/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to search vendors");
  const data = await res.json();
  return data.data || [];
}

export async function countNearby(lat: number, lng: number, radiusKm: number) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radiusKm: radiusKm.toString(),
  });
  const res = await fetch(`${API_BASE}/vendors/count-nearby?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch nearby counts");
  const data = await res.json();
  return data.data || { total: 0, byCategory: {} };
}

export async function getVendorDetail(id: string, lat?: number, lng?: number) {
  const params = new URLSearchParams();
  if (lat != null && lng != null) {
    params.append("lat", lat.toString());
    params.append("lng", lng.toString());
  }
  const res = await fetch(`${API_BASE}/vendors/${id}?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch vendor detail");
  const data = await res.json();
  return data.data;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data.data;
}

export async function registerUser(formData: any) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data.data;
}

export async function submitInquiry(inquiryData: any, token: string) {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(inquiryData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit inquiry");
  return data.data;
}

export async function getCustomerInquiries(token: string) {
  const res = await fetch(`${API_BASE}/inquiries/my-inquiries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch inquiries");
  return data.data || [];
}

export async function getInquiryById(id: string, token: string) {
  const res = await fetch(`${API_BASE}/inquiries/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (res.status === 404) throw new Error("Booking request not found");
  if (res.status === 403) throw new Error("You do not have access to this booking");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch booking");
  return data.data;
}

export async function getVendorInbox(token: string) {
  const res = await fetch(`${API_BASE}/inquiries/vendor-inbox`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch vendor leads");
  return data.data || [];
}

export async function updateInquiryStatus(id: string, status: string, notes: string, token: string) {
  const res = await fetch(`${API_BASE}/inquiries/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, vendorNotes: notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update inquiry status");
  return data.data;
}

export async function toggleVendorAvailability(token: string) {
  const res = await fetch(`${API_BASE}/vendor-portal/availability`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle availability");
  return data.data;
}

export async function getMyProfile(token: string) {
  const res = await fetch(`${API_BASE}/vendor-portal/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
  return data.data;
}

export async function updateMyProfile(payload: any, token: string) {
  const res = await fetch(`${API_BASE}/vendor-portal/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data.data;
}

export async function addPortfolioItem(payload: any, token: string) {
  const res = await fetch(`${API_BASE}/vendor-portal/portfolio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add portfolio item");
  return data.data;
}

export async function deletePortfolioItem(itemId: string, token: string) {
  const res = await fetch(`${API_BASE}/vendor-portal/portfolio/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove portfolio item");
  return data.data;
}

// Aliases for convenience
export const getVendorProfile = getMyProfile;
export const updateVendorProfile = updateMyProfile;
