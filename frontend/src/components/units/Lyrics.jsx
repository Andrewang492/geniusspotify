import React from 'react'
import {TokenContext} from "../../App.jsx";
import { useState, useEffect, useContext} from "react";

const Lyrics = () => {
  const { spotifyToken, spotifyRToken} = useContext(TokenContext)
  
  return (
    <div>Lyrics</div>
  )
}

export default Lyrics