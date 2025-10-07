import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { sendMessage } from "../api/messages";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import ErrorAlert from "./ErrorAlert";

const SendMessage = (props) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (content.trim().length === 0) return;

    setLoading(true);
    setError("");

    const result = await props.onSendMessage(content);
    
    setLoading(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      setContent("");
      setError("");
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    setError("");
  };

  return (
    <Stack
      sx={{
        m: 2,
      }}
    >
      {error && <ErrorAlert error={error} sx={{ mb: 2 }} />}
      <HorizontalStack>
        <TextField
          onChange={handleChange}
          label="Send a message..."
          fullWidth
          value={content}
          autoComplete="off"
          size="small"
          disabled={loading}
          error={error.length > 0}
          onKeyPress={(e) => {
            if (e.key === "Enter" && content.length > 0 && !loading) {
              handleSendMessage();
            }
          }}
        />

        <Button 
          onClick={handleSendMessage} 
          disabled={content.length === 0 || loading}
        >
          {loading ? "Sending..." : "Send"}
        </Button>
      </HorizontalStack>
    </Stack>
  );
};

export default SendMessage;