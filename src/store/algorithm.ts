import { create } from "zustand";
import type { AlgorithmProfile } from "@/types";

interface AlgorithmStore {
  profiles: AlgorithmProfile[];
  activeProfile: AlgorithmProfile | null;
  isLoading: boolean;
  error: string | null;

  fetchProfiles: () => Promise<void>;
  setActiveProfile: (profile: AlgorithmProfile) => void;
  updateProfile: (id: string, changes: Partial<AlgorithmProfile>) => Promise<void>;
  createProfile: (name: string) => Promise<AlgorithmProfile>;
  deleteProfile: (id: string) => Promise<void>;
  applyNLInstruction: (instruction: string) => Promise<string>;
}

export const useAlgorithmStore = create<AlgorithmStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/algorithm");
      const data = await res.json();
      const profiles = data as AlgorithmProfile[];
      const active = profiles.find((p) => p.isActive) ?? profiles[0] ?? null;
      set({ profiles, activeProfile: active, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  setActiveProfile: (profile) => {
    set({ activeProfile: profile });
  },

  updateProfile: async (id, changes) => {
    const res = await fetch(`/api/algorithm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const updated = await res.json() as AlgorithmProfile;
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
      activeProfile: state.activeProfile?.id === id ? updated : state.activeProfile,
    }));
  },

  createProfile: async (name) => {
    const res = await fetch("/api/algorithm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const profile = await res.json() as AlgorithmProfile;
    set((state) => ({ profiles: [...state.profiles, profile] }));
    return profile;
  },

  deleteProfile: async (id) => {
    await fetch(`/api/algorithm/${id}`, { method: "DELETE" });
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfile: state.activeProfile?.id === id ? state.profiles[0] ?? null : state.activeProfile,
    }));
  },

  applyNLInstruction: async (instruction) => {
    const { activeProfile } = get();
    if (!activeProfile) throw new Error("No active profile");

    const res = await fetch("/api/nl-translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction,
        currentProfile: {
          categories: activeProfile.categories,
          controls: activeProfile.controls,
          nlRules: activeProfile.nlRules,
        },
      }),
    });

    const { changes, explanation } = await res.json();

    // Flatten changes into profile fields for the PATCH
    const flatChanges: Record<string, unknown> = {};
    if (changes.categories) {
      for (const [k, v] of Object.entries(changes.categories)) {
        const key = `cat${k.charAt(0).toUpperCase()}${k.slice(1)}`;
        flatChanges[key] = v;
      }
    }
    if (changes.controls) {
      Object.assign(flatChanges, changes.controls);
    }
    if (changes.nlRules) {
      flatChanges.nlRules = changes.nlRules;
    }

    await get().updateProfile(activeProfile.id, flatChanges as Partial<AlgorithmProfile>);
    return explanation as string;
  },
}));
