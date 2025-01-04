import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./routes/Chat/Chat";
import AppLayout from "./components/AppLayout";
import Home from "./routes/Home/Home";
import TeamInterface from "./routes/Teams/Team";
import Teams from "./routes/Teams/Teams";
import Login from "./routes/Login/Login";
import { useEffect, useState } from "react";
import Api from "./api";
import { User, Team } from "./interfaces";
import { AuthProvider } from "./contexts/AuthContext";
import { Spinner } from "@chakra-ui/react";
import { getTeamId } from "./utils";
import { TeamProvider } from "./contexts/TeamContext";
import RequireLoggedIn from "./components/RequireLogin";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndSetTeam = async () => {
      setLoading(true);
      try {
        const fetchedUser = await Api.getCurrentUser();
        setUser(fetchedUser);
        if (fetchedUser && fetchedUser.teams.length > 0) {
          const teamId = getTeamId();
          const selectedTeam = teamId
            ? fetchedUser.teams.find((t) => t.id === teamId)
            : fetchedUser.teams[0];
          setTeam(selectedTeam || null);
        } else {
          setTeam(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSetTeam();
  }, []);

  if (loading) {
    return <Spinner />;
  } else {
    return (
      <AuthProvider user={user}>
        <TeamProvider initialTeam={team}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<div>Not Found</div>} />
            <Route element={<RequireLoggedIn />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="chat" element={<Chat />} />
                <Route path="settings/teams" element={<Teams />} />
                <Route path="settings/teams/:teamId" element={<TeamInterface />} />
              </Route>
            </Route>
          </Routes>
        </TeamProvider>
      </AuthProvider>
    );
  }
}

export default App;