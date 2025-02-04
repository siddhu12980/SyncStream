import axios from "axios";
import config from "./config";
import { userState } from "../store/userStore";
import { getRecoil } from "recoil-nexus";

const axiosInstance = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

//isAxiosError



axiosInstance.interceptors.request.use((config) => {
  const auth = getRecoil(userState);

  console.log("Auth", auth);

  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail) {
      return Promise.reject(new Error(error.response.data.detail));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
