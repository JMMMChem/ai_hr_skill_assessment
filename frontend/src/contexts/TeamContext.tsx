import React, { createContext, ReactNode, useContext, useState } from "react";
import { Team } from "../interfaces";

interface TeamContextType {
  team: Team | null;
  setTeam: (team: Team | null) => void;
}

const TeamContext = createContext<TeamContextType>({
  team: null,
  setTeam: () => {},
});

export const TeamProvider: React.FC<{ initialTeam?: Team | null; children: ReactNode }> = ({
  initialTeam = null,
  children,
}) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(initialTeam);

  return (
    <TeamContext.Provider value={{ team: currentTeam, setTeam: setCurrentTeam }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => useContext(TeamContext);
