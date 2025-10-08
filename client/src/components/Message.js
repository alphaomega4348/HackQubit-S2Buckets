import { Avatar, Card, useTheme } from "@mui/material";
import React from "react";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Message = (props) => {
  const username = props.conservant.username;
  const message = props.message;
  const theme = useTheme();

  let styles = {};
  // Use theme-aware colors for message bubbles so they contrast in dark mode
  const incomingBg = theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100];
  const outgoingBg = theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main;
  const outgoingText = theme.palette.getContrastText(outgoingBg);

  if (message.direction === "to") {
    styles = {
      justifyContent: "flex-start",
      messageColor: incomingBg,
      messageTextColor: theme.palette.text.primary,
    };
  } else if (message.direction === "from") {
    styles = {
      messageColor: outgoingBg,
      messageTextColor: outgoingText,
      justifyContent: "flex-end",
    };
  }

  return (
    <HorizontalStack
      sx={{ paddingY: 1, width: "100%" }}
      spacing={2}
      justifyContent={styles.justifyContent}
      alignItems="flex-end"
    >
      {message.direction === "to" && (
        <UserAvatar username={username} height={30} width={30} />
      )}

      <Card
        sx={{
          borderRadius: "25px",
          backgroundColor: styles.messageColor,
          color: styles.messageTextColor,
          borderWidth: "1px",
          paddingY: "12px",
          maxWidth: "70%",
          paddingX: 2,
        }}
      >
        {message.content}
      </Card>
    </HorizontalStack>
  );
};

export default Message;