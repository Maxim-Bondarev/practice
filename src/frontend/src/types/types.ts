import type { ReactNode } from "react";
import type Keycloak from "keycloak-js";
import type { components } from "../api/schema";

type Schemas = components["schemas"];

export type Application = Schemas["Application"];
export type ApplicationStatus = Schemas["ApplicationStatus"];
export type ApplicationSort = Schemas["ApplicationSort"];
export type Project = Schemas["Project"];
export type CreateApplicationRequest = Schemas["CreateApplicationRequest"];
export type ChatAttachment = Schemas["ChatAttachment"];
export type ChatMessage = Schemas["ChatMessage"];
export type StatusEvent = Schemas["StatusEvent"];
export type ChatItem = Schemas["ChatItem"];
export type AppNotification = Schemas["Notification"];
export type ApiError = Schemas["ApiError"];


export type ApplicationCategory =
  | "Актуальные"
  | "Мои"
  | "Все"
  | ApplicationStatus;

export interface ApplicationForm {
  title: CreateApplicationRequest["title"];
  project: Project | "";
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  role?: string;
}

export interface AuthContextValue {
  keycloak: Keycloak;
  initialized: boolean;
  authenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (redirectPath?: string) => Promise<void>;
  register: (redirectPath?: string) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
  hasRole: (role: string) => boolean;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface CategoriesProps {
  current: ApplicationCategory;
  onCategoryChange: (category: ApplicationCategory) => void;
}