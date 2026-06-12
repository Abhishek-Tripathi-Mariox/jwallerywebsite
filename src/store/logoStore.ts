import { create } from "zustand";
import api from "../lib/axios";

export type LogoType =
  | "primary"
  | "secondary"
  | "favicon"
  | "mobile_splash"
  | "email_header";

export interface ManagedLogo {
  type: LogoType;
  imageUrl: string;
  title?: string;
  updatedAt?: string;
}

interface LogoState {
  byType: Partial<Record<LogoType, ManagedLogo>>;
  loaded: boolean;
  fetch: () => Promise<void>;
  get: (type: LogoType) => string | undefined;
}

export const useLogoStore = create<LogoState>((set, getState) => ({
  byType: {},
  loaded: false,
  fetch: async () => {
    try {
      const res = await api.get("/logos");
      const list: ManagedLogo[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      const byType: Partial<Record<LogoType, ManagedLogo>> = {};
      for (const l of list) byType[l.type] = l;
      set({ byType, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  get: (type) => getState().byType[type]?.imageUrl,
}));
