import {
  Button,
  Card,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import ErrorAlert from "./ErrorAlert";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";

const PostEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const user = isLoggedIn();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user types
    setErrors({});
  };

  const detectHateSpeech = async (text) => {
    try {
      const response = await fetch("http://localhost:5000/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      return data; // Assuming API returns { result: 0 } or { result: 1 }
    } catch (error) {
      console.error("Error detecting hate speech:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setServerError("");
    setErrors({});

    try {
      // Check title for hate speech
      const titleResult = await detectHateSpeech(formData.title);
      if (titleResult.result === 1 || titleResult === 1) {
        setErrors({ title: "Title contains hateful content and cannot be posted" });
        setLoading(false);
        return;
      }

      // Check content for hate speech
      const contentResult = await detectHateSpeech(formData.content);
      if (contentResult.result === 1 || contentResult === 1) {
        setErrors({ content: "Content contains hateful content and cannot be posted" });
        setLoading(false);
        return;
      }

      // If both checks pass, create the post
      const data = await createPost(formData, isLoggedIn());
      setLoading(false);
      
      if (data && data.error) {
        setServerError(data.error);
      } else {
        navigate("/posts/" + data._id);
      }
    } catch (error) {
      setLoading(false);
      setServerError("Failed to validate content. Please try again.");
    }
  };

  return (
    <Card>
      <Stack spacing={1}>
        {user && (
          <HorizontalStack spacing={2}>
            <UserAvatar width={50} height={50} username={user.username} />
            <Typography variant="h5">
              What would you like to post today {user.username}?
            </Typography>
          </HorizontalStack>
        )}

        <Typography>
          <a href="https://commonmark.org/help/" target="_blank">
            Markdown Help
          </a>
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            required
            name="title"
            margin="normal"
            onChange={handleChange}
            error={errors.title !== undefined}
            helperText={errors.title}
          />
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={10}
            name="content"
            margin="normal"
            onChange={handleChange}
            error={errors.content !== undefined}
            helperText={errors.content}
            required
          />
          <ErrorAlert error={serverError} />
          <Button
            variant="outlined"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
            }}
          >
            {loading ? <>Checking and Submitting...</> : <>Submit</>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default PostEditor;