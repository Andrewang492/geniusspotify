import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyRToken, setSpotifyRToken] = useState("");

  return (
    <AuthContext.Provider
      value={{ spotifyToken, setSpotifyToken, spotifyRToken, setSpotifyRToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}