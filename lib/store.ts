"use client";

import { create } from "zustand";
import { Role } from "./types";

interface AppState {
  role: Role;
  activeSchoolId: string;
  supervisorSchoolId: string;
  setRole: (role: Role) => void;
  setActiveSchoolId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "ADMIN",
  activeSchoolId: "s1",
  supervisorSchoolId: "s1",
  setRole: (role) => set({ role }),
  setActiveSchoolId: (id) => set({ activeSchoolId: id }),
}));
