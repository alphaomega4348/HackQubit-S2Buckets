import React from "react";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";

const UserEntry = ({ username }) => {
  return (
    <HorizontalStack justifyContent="space-between" key={username}>
      <HorizontalStack>
  <UserAvatar width={30} height={30} username={username} />
  <Typography sx={{ color: 'var(--accent)', fontWeight: 600 }}>{username}</Typography>
      </HorizontalStack>
  <Link to={"/users/" + username} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View</Link>
    </HorizontalStack>
  );
};

export default UserEntry;
