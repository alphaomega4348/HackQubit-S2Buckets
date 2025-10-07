import { IconButton, Stack, Typography, useTheme } from "@mui/material";
import React, { useState } from "react";
import { AiFillLike, AiOutlineLike } from "react-icons/ai";
import { IconContext } from "react-icons/lib";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../helpers/authHelper";

const LikeBox = (props) => {
  const { likeCount, onLike } = props;
  const theme = useTheme();
  const [liked, setLiked] = useState(props.liked);
  React.useEffect(() => {
    setLiked(props.liked);
  }, [props.liked]);
  const [animating, setAnimating] = useState(false);
  const timerRef = React.useRef(null);

  const navigate = useNavigate();

  const handleLike = (e) => {
    if (isLoggedIn()) {
      const newLikedValue = !liked;
      setLiked(newLikedValue);
      // trigger a short pop animation
      setAnimating(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setAnimating(false), 220);
      onLike(newLikedValue);
    } else {
      navigate("/login");
    }
  };

  React.useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Stack alignItems="center" sx={{ width: '48px' }}>
      <IconButton
        onClick={handleLike}
        sx={{
          padding: 0.5,
          color: liked ? '#ffffff' : 'var(--muted)',
          background: liked ? 'linear-gradient(90deg, var(--accent), var(--accent-2))' : 'transparent',
          borderRadius: '8px',
          transform: animating ? 'scale(1.18)' : liked ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': {
            background: liked ? 'linear-gradient(90deg, var(--accent), var(--accent-2))' : 'rgba(255,255,255,0.02)'
          },
        }}
      >
        {liked ? (
          <IconContext.Provider value={{ color: '#ffffff' }}>
            <AiFillLike />
          </IconContext.Provider>
        ) : (
          <AiOutlineLike />
        )}
      </IconButton>
      <Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{likeCount}</Typography>
    </Stack>
  );
};

export default LikeBox;
