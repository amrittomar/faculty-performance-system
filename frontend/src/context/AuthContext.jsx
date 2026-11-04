import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fpis_user") || "null");
    } catch {
      return null;
    }
  });
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!user || !localStorage.getItem("fpis_token")) return undefined;
    let active = true;
    api.get("/faculty/me")
      .then(({ data }) => {
        if (!active) return;
        setUser((current) => {
          if (!current) return current;
          const refreshed = { ...current, ...data };
          localStorage.setItem("fpis_user", JSON.stringify(refreshed));
          return refreshed;
        });
      })
      .catch((error) => {
        if (active && error.response?.status !== 401) {
          setProfileError(error.response?.data?.message || error.message || "Could not refresh your faculty profile.");
        }
      });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const token = data.token || data.accessToken;
    if (!token) throw new Error("The server did not return an access token.");
    const profile = data.user || data;
    localStorage.setItem("fpis_token", token);
    localStorage.setItem("fpis_user", JSON.stringify(profile));
    setProfileError("");
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem("fpis_token");
    localStorage.removeItem("fpis_user");
    setProfileError("");
    setUser(null);
  };

  const value = useMemo(() => ({ user, profileError, login, logout }), [user, profileError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
