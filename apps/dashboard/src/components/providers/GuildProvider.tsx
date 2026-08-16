"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface Ctx {
  selectedGuild: string | null;
  setSelectedGuild: (id: string | null) => void;
}

const C = createContext<Ctx>({ selectedGuild: null, setSelectedGuild: () => {} });

export function GuildProvider({ children }: { children: ReactNode }) {
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  return <C.Provider value={{ selectedGuild, setSelectedGuild }}>{children}</C.Provider>;
}

export function useGuild() {
  return useContext(C);
}
