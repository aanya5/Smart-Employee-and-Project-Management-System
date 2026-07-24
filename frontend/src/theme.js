import { createTheme } from '@mui/material/styles';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,

      primary: {
        main: '#0B3D4A',
        light: '#1A5C6B',
        dark: '#062830',
        contrastText: '#F7F4EC',
      },

      secondary: {
        main: '#C45C26',
        light: '#E07A45',
        dark: '#9A4418',
        contrastText: '#FFF8F3',
      },

      background:
        mode === 'light'
          ? {
              default: '#F3F0E8',
              paper: '#FFFCF7',
            }
          : {
              default: '#121212',
              paper: '#1E1E1E',
            },

      text:
        mode === 'light'
          ? {
              primary: '#1A2B2E',
              secondary: '#4A6066',
            }
          : {
              primary: '#FFFFFF',
              secondary: '#CFCFCF',
            },

      success: { main: '#2D6A4F' },
      warning: { main: '#B45309' },
      error: { main: '#9B2226' },
      info: { main: '#1D4E89' },
    },

    typography: {
      fontFamily: "'DM Sans', sans-serif",
      h1: { fontFamily: "'Fraunces', serif", fontWeight: 700 },
      h2: { fontFamily: "'Fraunces', serif", fontWeight: 700 },
      h3: { fontFamily: "'Fraunces', serif", fontWeight: 600 },
      h4: { fontFamily: "'Fraunces', serif", fontWeight: 600 },
      h5: { fontFamily: "'Fraunces', serif", fontWeight: 600 },
      h6: { fontFamily: "'Fraunces', serif", fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },

    shape: {
      borderRadius: 10,
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 18px',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

export default getTheme;