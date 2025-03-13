import axios, { AxiosRequestConfig } from "axios";
import { Config } from "../Config";

const authInterceptor = (config: AxiosRequestConfig) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

export const ADMIN_CLIENT = axios.create({
  baseURL: Config.SERVICES.urlBackEndAdmin,
  timeout: 30000,
  withCredentials: true,
});

ADMIN_CLIENT.interceptors.request.use(authInterceptor);

export const LANGUAGES_CLIENT = axios.create({
  baseURL: Config.SERVICES.urlBackEndLanguage,
  timeout: 30000,
  withCredentials: true,
});

LANGUAGES_CLIENT.interceptors.request.use(authInterceptor);

export const PROJECTS_CLIENT = axios.create({
  baseURL: Config.SERVICES.urlBackEndProjectPersistence,
  timeout: 30000,
  withCredentials: true,
});

PROJECTS_CLIENT.interceptors.request.use(authInterceptor);
