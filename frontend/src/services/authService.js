import api from "./api";

const login = async (email, password) => {
  const response = await api.post("/user/login", { email, password });
  return response.data;
};

const register = async (full_name, email, password) => {
  const response = await api.post("/user/register", {
    full_name,
    email,
    password,
    role: "user",
  });
  return response.data;
};

const verifyEmail = async (email, otp) => {
  const response = await api.post("/user/verify-email", { email, otp });
  return response.data;
};


const forgotPassword = async (email) => {
  const response = await api.post("/user/forgot-password", { email });
  return response.data;
};

const resetPassword = async (id, token, password, confirm_password) => {
  const response = await api.put(`/user/reset-password/${id}/${token}`, {
    password,
    confirm_password,
  });
  return response.data;
};

const logout = async () => {
  try {
    await api.post("/user/logout");
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

const authService = { login, register, forgotPassword, resetPassword, logout, verifyEmail };

export default authService;