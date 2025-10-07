import { Avatar, Typography } from "@mui/material";
import React from "react";
import HorizontalStack from "./util/HorizontalStack";
import Moment from "react-moment";
import UserAvatar from "./UserAvatar";
import { Link } from "react-router-dom";

const ContentDetails = ({ username, createdAt, edited, preview }) => {
  return (
    <HorizontalStack sx={{}}>
      <UserAvatar width={30} height={30} username={username} />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        <Link
          to={"/users/" + username}
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          {username}
        </Link>
        {!preview && (
          <>
            {" "}
            · <Moment fromNow>{createdAt}</Moment> {edited && <>(Edited)</>}
          </>
        )}
      </Typography>
    </HorizontalStack>
  );
};

export default ContentDetails;
