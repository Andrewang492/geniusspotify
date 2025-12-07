import React, { createContext, useContext, useState } from "react";

const NowPlayingContext = createContext();

//@deprecated
export function NowPlayingProvider({ children }) {
  const [nowPlaying, setNowPlaying] = useState({});
  return (
    <NowPlayingContext.Provider value={{ nowPlaying, setNowPlaying }}>
      {children}
    </NowPlayingContext.Provider>
  );
}

export const useNowPlaying = () => useContext(NowPlayingContext);