import type { ReactNode } from "react";
import type Keycloak from "keycloak-js";

export type ApplicationStatus =
  | "На модерации"
  | "Новые"
  | "В обработке"
  | "Завершенные"
  | "Отклоненные";

export type ApplicationCategory =
  | "Все"
  | "Новые"
  | "В обработке"
  | "Завершенные"
  | "Отклоненные"
  | "Мои"
  | "На модерации";

export interface Application {
  id: string;
  title: string;
  date: Date;
  project: Project | "";
  status: ApplicationStatus;
  authorId: string;
}
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}
export interface ChatMessage {
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  isAdmin?: boolean;
  text: string;
  attachment?: ChatAttachment;
  createdAt: string;
}
export type Project = "1X" | "Music" | "Delivery";

export interface ApplicationForm {
  title: string;
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

export interface HomePageProps {
  items: Application[];
  searchValue: string;
  onCategoryChange: (category: ApplicationCategory) => void;
  onSetSearchValue: (value: string) => void;
}

export interface CategoriesProps {
  items: Application[];
  current?: ApplicationCategory;
  onCategoryChange: (category: ApplicationCategory) => void;
}

export interface ApplicationDto {
  id: string;
  title: string;
  date: string;
  project: Project;
  status: ApplicationStatus;
  authorId?: string;
}

export interface CreateApplicationRequest {
  title: string;
  project: Project;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export interface ModerationDecisionRequest {
  decision: "approve" | "reject";
  comment?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type ApplicationsResponse = ApplicationDto[];

export interface ApplicationFilters {
  status?: ApplicationStatus;
  search?: string;
  mine?: boolean;
}
