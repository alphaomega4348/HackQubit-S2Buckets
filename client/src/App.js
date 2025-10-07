import "@mui/material";
import "react-icons";
import "react-icons/bi";
import "react-icons/md";
import "react-icons/bs";
import "react-router-dom";
import './App.css'
import './styles/modern.css'
import './styles/loading.css'
import React from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import {background} from './assets/community.jpg'

import {
  BrowserRouter,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom"; 
import createAppTheme from "./theme";
import Loading from "./components/Loading";

import PostView from "./components/views/PostView";
import CreatePostView from "./components/views/CreatePostView";
import ProfileView from "./components/views/ProfileView";
import LoginView from "./components/views/LoginView";
import SignupView from "./components/views/SignupView";
import ExploreView from "./components/views/ExploreView";
import PrivateRoute from "./components/PrivateRoute";
import SearchView from "./components/views/SearchView";
import MessengerView from "./components/views/MessengerView";
import { initiateSocketConnection, socket } from "./helpers/socketHelper";
import { useEffect, useState, useMemo } from "react";
import { BASE_URL } from "./config";
import { io } from "socket.io-client";

function App() {
  initiateSocketConnection();

  const [mode, setMode] = useState('dark');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // auto-hide splash after ~2.3s
    const t = setTimeout(() => setShowSplash(false), 2300);
    return () => clearTimeout(t);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  React.useEffect(() => {
    document.body.setAttribute('data-theme', mode === 'light' ? 'light' : 'dark');
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <div className="background">
      <ThemeProvider theme={theme}>
        {showSplash ? (
          <Loading />
        ) : (
          <BrowserRouter>
          <CssBaseline />
          <Routes>
          <Route path="/" element={<ExploreView mode={mode} toggleMode={toggleMode} />} />
          <Route path="/posts/:id" element={<PostView mode={mode} toggleMode={toggleMode} />} />
          <Route
            path="/posts/create"
            element={
              <PrivateRoute>
                <CreatePostView mode={mode} toggleMode={toggleMode} />
              </PrivateRoute>
            }
          />
          <Route
            path="/messenger"
            element={
              <PrivateRoute>
                <MessengerView mode={mode} toggleMode={toggleMode} />
              </PrivateRoute>
            }
          />
          <Route path="/search" element={<SearchView mode={mode} toggleMode={toggleMode} />} />
          <Route path="/users/:id" element={<ProfileView mode={mode} toggleMode={toggleMode} />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<SignupView />} />
        </Routes>
      </BrowserRouter>
        )}
    </ThemeProvider>
    </div>
   
  );
}

export default App;
