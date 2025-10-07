import { Button, Card, Stack, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createComment } from "../api/posts";
import { isLoggedIn } from "../helpers/authHelper";
import ErrorAlert from "./ErrorAlert";
import HorizontalStack from "./util/HorizontalStack";

const CommentEditor = ({ label, comment, addComment, setReplying }) => {
  const [formData, setFormData] = useState({
    content: "",
  });

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      return data;
    } catch (error) {
      console.error("Error detecting hate speech:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setErrors({});

    try {
      // Check comment content for hate speech
      const contentResult = await detectHateSpeech(formData.content);
      
      if (contentResult.result === 1 || contentResult === 1) {
        setErrors({ 
          content: "Comment contains hateful content and cannot be posted" 
        });
        setLoading(false);
        return;
      }

      // If check passes, create the comment
      const body = {
        ...formData,
        parentId: comment && comment._id,
      };

      const data = await createComment(body, params, isLoggedIn());
      setLoading(false);

      if (data.error) {
        setError(data.error);
      } else {
        formData.content = "";
        setReplying && setReplying(false);
        addComment(data);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to validate comment. Please try again.");
    }
  };

  const handleFocus = (e) => {
    !isLoggedIn() && navigate("/login");
  };

  return (
    <Card>
      <Stack spacing={2}>
        <HorizontalStack justifyContent="space-between">
          <Typography variant="h5">
            {comment ? <>Reply</> : <>Comment</>}
          </Typography>
          <Typography>
            <a href="https://commonmark.org/help/" target="_blank">
              Markdown Help
            </a>
          </Typography>
        </HorizontalStack>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            multiline
            fullWidth
            label={label}
            rows={5}
            required
            name="content"
            sx={{
              backgroundColor: "white",
            }}
            onChange={handleChange}
            onFocus={handleFocus}
            value={formData.content}
            error={errors.content !== undefined}
            helperText={errors.content}
          />

          <ErrorAlert error={error} sx={{ my: 4 }} />
          <Button
            variant="outlined"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "white",
              mt: 2,
            }}
          >
            {loading ? <div>Checking and Submitting...</div> : <div>Submit</div>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default CommentEditor;