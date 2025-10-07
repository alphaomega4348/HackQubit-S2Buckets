import { useTheme } from "@emotion/react";
import {
  Avatar,
  IconButton,
  Stack,
  TextField,
  Typography,
  Button,
  InputAdornment,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { BiLoader } from "react-icons/bi";
import { IoIosSearch } from "react-icons/io";
import "react-icons/ai";
import "react-icons/ri";
import {
  AiFillFileText,
  AiFillHome,
  AiFillMessage,
  AiOutlineSearch,
} from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, logoutUser } from "../helpers/authHelper";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";
import { RiContrast2Line } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";

const Navbar = ({ mode, toggleMode }) => {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const theme = useTheme();
  const username = user && isLoggedIn().username;
  const [search, setSearch] = useState("");
  const [searchIcon, setSearchIcon] = useState(false);
  const [width, setWindowWidth] = useState(0);

  useEffect(() => {
    updateDimensions();

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const mobile = width < 500;
  const navbarWidth = width < 600;

  const updateDimensions = () => {
    const width = window.innerWidth;
    setWindowWidth(width);
  };

  const handleLogout = async (e) => {
    logoutUser();
    navigate("/login");
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/search?" + new URLSearchParams({ search }));
  };

  const handleSearchIcon = (e) => {
    setSearchIcon(!searchIcon);
  };

  return (
    <Stack mb={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pt: 2,
          pb: 0,
        }}
        spacing={!mobile ? 2 : 0}
      >
        <HorizontalStack>
          <IconButton onClick={toggleMode} title="Toggle theme">
            {mode === 'dark' ? '☀️' : '🌙'}
          </IconButton>
          {/* <AiFillFileText
            size={33}
            color={theme.palette.primary.main}
            onClick={() => navigate("/")}
          /> */}
          <BiLoader 
            size={33}
             
          style={{ color:"purple" }}
           
           onClick={() => navigate("/")}
          />
          <Typography
            sx={{ display: mobile ? "none" : "block" }}
            variant={navbarWidth ? "h5" : "h3"}
            mr={1}
            style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '-0.5px' }}
          >
            Socialify
          </Typography>
        </HorizontalStack>

        {!navbarWidth && (
   <Box component="form" onSubmit={handleSubmit} >
     
        
        
        <TextField 
          size="small"
          label="Search for posts..."
          sx={{ flexGrow: 1, maxWidth: 300 }}
          onChange={handleChange}
          value={search}
          style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "5px",
              color: 'var(--text)'
          }}
        />
    </Box>
        )}

        <HorizontalStack>
          {mobile && (
            <IconButton onClick={handleSearchIcon}>
              <AiOutlineSearch />
            </IconButton>
          )}

          <IconButton component={Link} to={"/"}>
            <AiFillHome />
          </IconButton>
          {user ? (
            <>
              <IconButton component={Link} to={"/messenger"}>
                <AiFillMessage />
              </IconButton>
              <IconButton component={Link}  to={"/users/" + username}>
                <UserAvatar width={30} height={30} username={user.username} />
              </IconButton>
              {mobile ? (
                <IconButton onClick={handleLogout} title="Logout" aria-label="logout">
                  <FiLogOut />
                </IconButton>
              ) : (
                <Button onClick={handleLogout}>Logout</Button>
              )}
            </>
          ) : (
            <>
              <Button variant="text" sx={{ minWidth: 80 }} href="/signup">
                Sign Up
              </Button>
              <Button variant="text" sx={{ minWidth: 65 }} href="/login">
                Login
              </Button>
            </>
          )}
        </HorizontalStack>
      </Stack>
      {navbarWidth && searchIcon && (
        <Box component="form" onSubmit={handleSubmit} mt={2}>
          <TextField
            size="small"
            label="Search for posts..."
            fullWidth
            onChange={handleChange}
            value={search}
          />
        </Box>
      )}
    </Stack>
  );
};

export default Navbar;
