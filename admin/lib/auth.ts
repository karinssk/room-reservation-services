export const getAdminAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
