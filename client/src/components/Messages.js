import {
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
  Typography,
  Stack,
  Box,
  Snackbar,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { MdMoreVert, MdReport, MdBlock } from "react-icons/md";
import { AiFillCaretLeft, AiFillMessage } from "react-icons/ai";
import { Link } from "react-router-dom";
import { getMessages, sendMessage } from "../api/messages";
import { isLoggedIn } from "../helpers/authHelper";
import { socket } from "../helpers/socketHelper";
import Loading from "./Loading";
import Message from "./Message";
import SendMessage from "./SendMessage";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Messages = (props) => {
  const messagesEndRef = useRef(null);
  const user = isLoggedIn();
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  const showToast = (msg, severity = "info") => {
    setToast({ open: true, message: msg, severity });
  };

  const conversationsRef = useRef(props.conversations);
  const conservantRef = useRef(props.conservant);
  const messagesRef = useRef(messages);
  useEffect(() => {
    conversationsRef.current = props.conversations;
    conservantRef.current = props.conservant;
    messagesRef.current = messages;
  });

  const conversation =
    props.conversations &&
    props.conservant &&
    props.getConversation(props.conversations, props.conservant._id);

  const setDirection = (messages) => {
    messages.forEach((message) => {
      if (message.sender._id === user.userId) {
        message.direction = "from";
      } else {
        message.direction = "to";
      }
    });
  };

  const fetchMessages = async () => {
    if (conversation) {
      if (conversation.new) {
        setLoading(false);
        setMessages(conversation.messages);
        return;
      }
      setLoading(true);
      const data = await getMessages(user, conversation._id);
      setDirection(data);
      if (data && !data.error) setMessages(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [props.conservant]);

  // Preferences per conservant (Raw Mode)
  const prefKey = (id) => `messages_prefs_${id}`;
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [allowOffensive, setAllowOffensive] = useState(false);

  useEffect(() => {
    if (props.conservant) {
      try {
        const raw = localStorage.getItem(prefKey(props.conservant._id));
        const parsed = raw ? JSON.parse(raw) : null;
        setAllowOffensive(parsed ? !!parsed.allowOffensive : false);
      } catch {
        setAllowOffensive(false);
      }
    }
  }, [props.conservant]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const toggleAllowOffensive = () => {
    const next = !allowOffensive;
    setAllowOffensive(next);
    if (props.conservant) {
      const key = prefKey(props.conservant._id);
      localStorage.setItem(key, JSON.stringify({ allowOffensive: next }));
    }
  };

  const handleBlockUser = () => {
    alert("Block user feature not implemented yet.");
    handleMenuClose();
  };

  const handleReportUser = () => {
    alert("Report user feature not implemented yet.");
    handleMenuClose();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  const handleSendMessage = async (content) => {
    const newMessage = { direction: "from", content };
    const newMessages = [newMessage, ...messages];

    if (conversation.new) {
      conversation.messages = [...conversation.messages, newMessage];
    }

    let newConversations = props.conversations.filter(
      (conversationCompare) => conversation._id !== conversationCompare._id
    );

    newConversations.unshift(conversation);
    props.setConversations(newConversations);
    setMessages(newMessages);

    await sendMessage(user, newMessage, conversation.recipient._id);
    socket.emit(
      "send-message",
      conversation.recipient._id,
      user.username,
      content
    );
  };

  const handleReceiveMessage = (senderId, username, content) => {
    const newMessage = { direction: "to", content };
    const conversation = props.getConversation(
      conversationsRef.current,
      senderId
    );

    if (conversation) {
      let newMessages = [newMessage];
      if (messagesRef.current) {
        newMessages = [...newMessages, ...messagesRef.current];
      }

      setMessages(newMessages);

      if (conversation.new) {
        conversation.messages = newMessages;
      }
      conversation.lastMessageAt = Date.now();

      let newConversations = conversationsRef.current.filter(
        (conversationCompare) => conversation._id !== conversationCompare._id
      );
      newConversations.unshift(conversation);
      props.setConversations(newConversations);
    } else {
      const newConversation = {
        _id: senderId,
        recipient: { _id: senderId, username },
        new: true,
        messages: [newMessage],
        lastMessageAt: Date.now(),
      };
      props.setConversations([newConversation, ...conversationsRef.current]);
    }
    scrollToBottom();
  };

  useEffect(() => {
    socket.on("receive-message", handleReceiveMessage);
  }, []);

  return props.conservant ? (
    <>
      {messages && conversation && !loading ? (
        <>
          <HorizontalStack alignItems="center" spacing={2} sx={{ px: 2, height: "60px" }}>
            {props.mobile && (
              <IconButton
                onClick={() => props.setConservant(null)}
                sx={{ padding: 0 }}
              >
                <AiFillCaretLeft />
              </IconButton>
            )}
            <UserAvatar
              username={props.conservant.username}
              height={30}
              width={30}
            />
            <Typography>
              <Link to={"/users/" + props.conservant.username}>
                <b>{props.conservant.username}</b>
              </Link>
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={handleMenuOpen} size="small" aria-label="conversation menu">
              <MdMoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
              <MenuItem>
                <ListItemIcon>
                  <Switch checked={allowOffensive} onChange={toggleAllowOffensive} />
                </ListItemIcon>
                Raw Mode
              </MenuItem>
              <MenuItem onClick={handleBlockUser}>
                <ListItemIcon>
                  <MdBlock size={18} />
                </ListItemIcon>
                Block user
              </MenuItem>
              <MenuItem onClick={handleReportUser}>
                <ListItemIcon>
                  <MdReport size={18} />
                </ListItemIcon>
                Report user
              </MenuItem>
            </Menu>
          </HorizontalStack>
          <Divider />
          <Box sx={{ height: "calc(100vh - 240px)" }}>
            <Box sx={{ height: "100%" }}>
              <Stack sx={{ padding: 2, overflowY: "auto", maxHeight: "100%" }} direction="column-reverse">
                <div ref={messagesEndRef} />
                {messages.map((message, i) => (
                  <Message conservant={props.conservant} message={message} key={i} />
                ))}
              </Stack>
            </Box>
          </Box>
          <SendMessage onSendMessage={handleSendMessage} allowOffensive={allowOffensive} showToast={showToast} />
          <Snackbar
            open={toast.open}
            autoHideDuration={4000}
            onClose={() => setToast({ ...toast, open: false })}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: "10px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)",
                bgcolor:
                  toast.severity === "error"
                    ? "rgba(255, 51, 51, 0.9)"
                    : toast.severity === "warning"
                      ? "rgba(255, 165, 0, 0.9)"
                      : "rgba(46, 204, 113, 0.9)",
                color: "white",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {toast.message}
            </Box>
          </Snackbar>
        </>
      ) : (
        <Stack sx={{ height: "100%" }} justifyContent="center">
          <Loading />
        </Stack>
      )}
    </>
  ) : (
    <Stack sx={{ height: "100%" }} justifyContent="center" alignItems="center" spacing={2}>
      <AiFillMessage size={80} />
      <Typography variant="h5">PostIt Messenger</Typography>
      <Typography color="text.secondary">
        Privately message other users on PostIt
      </Typography>
    </Stack>
  );
};

export default Messages;