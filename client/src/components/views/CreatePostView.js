import { Container } from "@mui/material";
import React from "react";
import GoBack from "../GoBack";
import GridLayout from "../GridLayout";
import Navbar from "../Navbar";
import PostEditor from "../PostEditor";
import Sidebar from "../Sidebar";

const CreatePostView = ({ mode, toggleMode }) => {
  return (
    <Container className="page-container" sx={{ px: { xs: 1, md: 0 } }}>
      <Navbar mode={mode} toggleMode={toggleMode} />
      <GoBack />
      <GridLayout left={<PostEditor />} right={<Sidebar />} />
    </Container>
  );
};

export default CreatePostView;
