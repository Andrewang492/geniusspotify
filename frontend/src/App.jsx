import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Outlet, Link } from "react-router-dom";
import queryString from "query-string";

const baseurl = "http://127.0.0.1:5173";
const client_id = "5e6209bc2f3e4169811f798f5ffa2086";
const client_secret = "fad48b45176541de944c8f47b8d3f624";
var redirect_uri = `${baseurl}/redirect`;
var scope = `
user-read-playback-state 
user-read-currently-playing
`;
let state = null;

function App() {
  const [count, setCount] = useState(0);

  function onLoginClick() {
    // fetch(
    //   "https://accounts.spotify.com/authorize?" +
    //     queryString.stringify({
    //       response_type: "code",
    //       client_id: client_id,
    //       scope: scope,
    //       redirect_uri: redirect_uri,
    //       state: state,
    //     }),
    //   { mode: "no-cors" }
    // );
    window.location.replace(
      "https://accounts.spotify.com/authorize?" +
        queryString.stringify({
          response_type: "code",
          client_id: client_id,
          scope: scope,
          redirect_uri: redirect_uri,
          state: state,
        })
    );
  }

  return (
    <div id="main" style={{ display: "flex", flexDirection: "row" }}>
      <div id="left-main">
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link to={`redirect`}>redirect page</Link>
          <Link to={`user`}>show user</Link>
          <a href='http://localhost:8080' target="_blank">
            REAL login to spotify
          </a>
          <button onClick={onLoginClick}>login to spotify</button>
        </div>
      </div>
      <div id="right-main">
        <p>Right</p>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
