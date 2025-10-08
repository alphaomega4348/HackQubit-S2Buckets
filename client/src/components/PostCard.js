import {
  Button,
  Card,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Box as MuiBox,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { AiFillCheckCircle, AiFillEdit, AiFillMessage } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { deletePost, likePost, unlikePost, updatePost } from "../api/posts";
import { isLoggedIn } from "../helpers/authHelper";
import ContentDetails from "./ContentDetails";

import LikeBox from "./LikeBox";
import PostContentBox from "./PostContentBox";
import HorizontalStack from "./util/HorizontalStack";

import {} from "react-icons/ai";
import ContentUpdateEditor from "./ContentUpdateEditor";
import Markdown from "./Markdown";

import "./postCard.css";
import { MdCancel } from "react-icons/md";
import { BiTrash } from "react-icons/bi";
import { BsReplyFill } from "react-icons/bs";
import UserLikePreview from "./UserLikePreview";
import Grid from "@mui/material/Grid";

const PostCard = (props) => {
  const { preview, removePost } = props;
  let postData = props.post;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = isLoggedIn();
  const isAuthor = user && user.username === postData.poster.username;

  const theme = useTheme();
  const iconColor = theme.palette.primary.main;

  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [post, setPost] = useState(postData);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  let maxHeight = null;
  if (preview === "primary") {
    maxHeight = 250;
  }

  const handleDeletePost = async (e) => {
    e.stopPropagation();

    if (!confirm) {
      setConfirm(true);
    } else {
      setLoading(true);
      await deletePost(post._id, isLoggedIn());
      setLoading(false);
      if (preview) {
        removePost(post);
      } else {
        navigate("/");
      }
    }
  };

  const handleEditPost = async (e) => {
    e.stopPropagation();

    setEditing(!editing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content = e.target.content.value;
    await updatePost(post._id, isLoggedIn(), { content });
    setPost({ ...post, content, edited: true });
    setEditing(false);
  };

  const handleLike = async (liked) => {
    if (liked) {
      setLikeCount(likeCount + 1);
      await likePost(post._id, user);
    } else {
      setLikeCount(likeCount - 1);
      await unlikePost(post._id, user);
    }
  };

  // Hard-coded analysis JSON (provided by user)
  const analysis = {
    overall_score: 90,
    overall_classification: "offensive",
    justification:
      "The text contains direct, aggressive commands and highly offensive profanity intended to insult and demean, without any mitigating context.",
    language_detected: "en",
    context_adjustments:
      "No context was provided, so the evaluation is based solely on the inherent meaning and common usage of the words.",
    dimensions: {
      hate_speech: {
        score: 20,
        explanation:
          "While 'bitch' can carry misogynistic undertones, without specific context regarding the target, it's primarily a general insult rather than explicit hate speech against a protected group.",
      },
      harassment: {
        score: 95,
        explanation:
          "The phrases 'shutup' and 'bitch' are direct, aggressive, and demeaning, clearly constituting a form of verbal harassment or insult.",
      },
      profanity: {
        score: 90,
        explanation:
          "'Bitch' is a strong expletive and derogatory term. 'Shutup' is an aggressive command, often considered rude or abusive.",
      },
      toxicity: {
        score: 98,
        explanation:
          "The text is highly toxic due to its aggressive, insulting, and demeaning language, intended to be confrontational and harmful.",
      },
      self_harm_or_violence: { score: 0, explanation: "There are no indications of self-harm or violence in the provided text." },
      misinformation: { score: 0, explanation: "The text does not contain any factual claims, therefore misinformation is not applicable." },
    },
  };

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const openAnalysis = (e) => {
    e && e.stopPropagation();
    setAnalysisOpen(true);
  };
  const closeAnalysis = () => setAnalysisOpen(false);

  return (
    <Card sx={{ padding: 0 }} className="post-card">
      <Box className={preview}>
        <HorizontalStack spacing={0} alignItems="initial">
          {/* left column: controls only (no duplicate media) */}
          <Box sx={{ width: { xs: "100%", md: 80 }, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
              {/* reserved for avatar/controls or small thumbnails if needed */}
            </Box>

            <Stack
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              sx={{
                background: 'transparent',
                width: "100%",
                padding: theme.spacing(1),
              }}
            >
              <LikeBox
                likeCount={likeCount}
                liked={post.liked}
                onLike={handleLike}
              />
            </Stack>
          </Box>

          <PostContentBox clickable={preview} post={post} editing={editing}>
            <HorizontalStack justifyContent="space-between">
              <ContentDetails
                username={post.poster.username}
                createdAt={post.createdAt}
                edited={post.edited}
                preview={preview === "secondary"}
              />
              <Box>
                {user &&
                  (isAuthor || user.isAdmin) &&
                  preview !== "secondary" && (
                    <HorizontalStack>
                      <IconButton
                        disabled={loading}
                        size="small"
                        onClick={handleEditPost}
                      >
                        {editing ? (
                          <MdCancel color={iconColor} />
                        ) : (
                          <AiFillEdit color={iconColor} />
                        )}
                      </IconButton>
                      <IconButton
                        disabled={loading}
                        size="small"
                        onClick={handleDeletePost}
                      >
                        {confirm ? (
                          <AiFillCheckCircle color={theme.palette.error.main} />
                        ) : (
                          <BiTrash color={theme.palette.error.main} />
                        )}
                      </IconButton>
                    </HorizontalStack>
                  )}
              </Box>
            </HorizontalStack>

            <Typography
              variant="h5"
              gutterBottom
              sx={{ overflow: "hidden", mt: 1, maxHeight: 125 }}
              className="title"
            >
              {post.title}
            </Typography>

            {/* Render single larger image/video if present (Cloudinary URL) */}
            {post.image && (
              <Box sx={{ mt: 1, mb: 1, width: { xs: '100%', md: '100%' } }}>
                {(() => {
                  const url = post.image || "";
                  const ext = url.split("?")[0].split(".").pop().toLowerCase();
                  const videoExts = ["mp4", "webm", "ogg"];
                  if (videoExts.includes(ext)) {
                    return (
                      <Box component="video" src={url} controls sx={{ width: '100%', maxHeight: 520, borderRadius: 1 }} />
                    );
                  }
                  return (
                    <Box component="img" src={url} alt="post media" sx={{ width: '100%', maxHeight: 520, objectFit: "cover", borderRadius: 1 }} />
                  );
                })()}
              </Box>
            )}

            {preview !== "secondary" &&
              (editing ? (
                <ContentUpdateEditor
                  handleSubmit={handleSubmit}
                  originalContent={post.content}
                />
              ) : (
                <Box
                  maxHeight={maxHeight}
                  overflow="hidden"
                  className="content"
                >
                  <Markdown content={post.content} />
                </Box>
              ))}

            <HorizontalStack sx={{ mt: 2 }} justifyContent="space-between">
              <HorizontalStack>
                <AiFillMessage />
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  {post.commentCount}
                </Typography>
              </HorizontalStack>
              <Box>
                <UserLikePreview
                  postId={post._id}
                  userLikePreview={post.userLikePreview}
                />
              </Box>
            </HorizontalStack>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" onClick={openAnalysis}>Analyze offensiveness</Button>
            </Box>
          </PostContentBox>
        </HorizontalStack>
      </Box>
      {/* Analysis dialog */}
      <Dialog open={analysisOpen} onClose={closeAnalysis} fullWidth maxWidth="sm">
        <DialogTitle>Offensiveness analysis</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={analysis.overall_score} size={96} />
                <MuiBox
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6">{analysis.overall_score}%</Typography>
                </MuiBox>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{analysis.overall_classification}</Typography>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              {Object.entries(analysis.dimensions).map(([key, val]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <HorizontalStack justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Typography>
                    <Typography variant="subtitle2">{val.score}%</Typography>
                  </HorizontalStack>
                  <LinearProgress variant="determinate" value={val.score} sx={{ height: 10, borderRadius: 2 }} />
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAnalysis}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PostCard;
