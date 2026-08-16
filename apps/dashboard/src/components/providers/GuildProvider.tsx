"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface GuildContextValue {
  selectedGuild: string | null;
  setSelectedGuild: (id: string | null) => void;
}

const GuildContext = createContext<GuildContextValue>({
  selectedGuild: null,
  setSelectedGuild: () => {},
});

const STORAGE_KEY = "if26-taskpanel:selected-guild";

export function GuildProvider({ children }: { children: ReactNode }) {
  const [selectedGuild, setSelectedGuildState] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setSelectedGuildState(saved);
    }
  }, []);

  function setSelectedGuild(id: string | null) {
    setSelectedGuildState(id);

    if (id) {
      window.localStorage.setItem(STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <GuildContext.Provider
      value={{
        selectedGuild,
        setSelectedGuild,
      }}
    >
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild() {
  return useContext(GuildContext);
}
