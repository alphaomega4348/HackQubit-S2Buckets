import {
  Button,
  Card,
  Link,
  Stack,
  TextField,
  Typography,
  IconButton,
  LinearProgress,
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
  //

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  //

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const user = isLoggedIn();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const errors = validate();
    setErrors(errors);
  };

  //

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));

    // auto upload to backend which uploads to Cloudinary
    await uploadFileToServer(f);
  };

  const uploadFileToServer = async (f) => {
    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", f);
      // optional: include folder (e.g. socialify/posts)
      data.append("folder", "socialify/posts");

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: data,
      });

      // handle non-JSON responses (server HTML error pages)
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("Upload endpoint returned non-JSON response:", text);
        setServerError("Upload failed: " + (text && text.length > 200 ? text.slice(0, 200) + "..." : text));
        return;
      }

      if (json && json.secure_url) {
        setFormData((prev) => ({ ...prev, image: json.secure_url }));
      } else if (json && json.error) {
        setServerError(json.error);
      } else {
        setServerError("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setServerError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  //

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    //
    // if file selected but image not yet uploaded, try uploading now
    if (file && !formData.image) {
      await uploadFileToServer(file);
    }
    //

    const data = await createPost(formData, isLoggedIn());
    setLoading(false);
    if (data && data.error) {
      setServerError(data.error);
    } else {
      navigate("/posts/" + data._id);
    }
  };

  const validate = () => {
    const errors = {};

    return errors;
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
          {/**/}
          <input
            id="post-file"
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="post-file">
            <Button component="span" sx={{ mt: 1 }}>
              Attach file
            </Button>
          </label>
          {uploadingImage && <LinearProgress sx={{ mt: 1, mb: 1 }} />}
          {preview && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="subtitle2">Preview</Typography>
              <Box component="img" src={preview} alt="preview" sx={{ maxWidth: "100%", maxHeight: 280 }} />
            </Box>
          )}

          {/**/}

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
            {loading ? <>Submitting</> : <>Submit</>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default PostEditor;