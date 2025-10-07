import { Box, Button, Stack, TextField } from "@mui/material";
import React, { useState } from "react";

const ContentUpdateEditor = (props) => {
  const [content, setContent] = useState(props.originalContent);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setContent(e.target.value);
    setError("");
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

    const content = e.target.content.value;
    setLoading(true);
    setError("");

    try {
      // Check content for hate speech
      const contentResult = await detectHateSpeech(content);
      
      if (contentResult.result === 1 || contentResult === 1) {
        setError("Content contains hateful content and cannot be updated");
        setLoading(false);
        return;
      }

      // Run custom validation if provided
      let validationError = null;
      if (props.validate) {
        validationError = props.validate(content);
      }

      if (validationError && validationError.length !== 0) {
        setError(validationError);
        setLoading(false);
      } else {
        await props.handleSubmit(e);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to validate content. Please try again.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack>
        <TextField
          value={content}
          fullWidth
          margin="normal"
          name="content"
          sx={{ backgroundColor: "white" }}
          onChange={handleChange}
          error={error.length !== 0}
          helperText={error}
          multiline
          disabled={loading}
        />
        <Button
          type="submit"
          variant="outlined"
          sx={{ backgroundColor: "white", mt: 1 }}
          disabled={loading}
        >
          {loading ? "Checking and Updating..." : "Update"}
        </Button>
      </Stack>
    </Box>
  );
};

export default ContentUpdateEditor;