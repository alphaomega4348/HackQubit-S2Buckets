import { createTheme } from "@mui/material";

const createAppTheme = (mode = 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#19c37d',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#0ea95b',
      },
      background: {
        default: mode === 'dark' ? '#000000' : '#f6fbf6',
        paper: mode === 'dark' ? '#0f0f0f' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f6f7f8' : '#071026',
      },
    },
    components: {
      MuiCard: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            ...{
              padding: theme.spacing(2),
              borderWidth: '1.5px',
            },
          }),
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: 'md',
        },
      },
      MuiButton: {
        styleOverrides: {
          containedPrimary: ({ ownerState, theme }) => ({
            background: 'linear-gradient(90deg,#19c37d,#0ea95b)',
          }),
        },
      },
    },
  });

export default createAppTheme;
