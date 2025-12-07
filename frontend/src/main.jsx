import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error.jsx";
import Redirect from "./routes/redirect.jsx";
import User from "./routes/User.jsx";
import NotFoundPage from "./routes/NotFoundPage.jsx";
import { AuthProvider } from "./components/contexts/AuthContext.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [

    ],
  },
  {
    path: "redirect",
    element: <Redirect />,
  },
  {
    path: "user",
    element: <User />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
