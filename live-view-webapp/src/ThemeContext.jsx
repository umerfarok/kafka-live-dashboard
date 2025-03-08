import { createContext, useState, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create context
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

// Custom hook to use the theme context
export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProviderWrapper = ({ children }) => {
  // Get initial mode from localStorage, default to 'light' if not found
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Update the theme only after the initial render to avoid hydration mismatch
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = {
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    mode,
  };

  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode colors
            primary: {
              main: '#1976d2',
            },
            secondary: {
              main: '#9c27b0',
            },
            background: {
              default: '#f9f9f9',
              paper: '#ffffff',
              card: '#f5f5f5',
            },
            text: {
              primary: '#000000',
              secondary: '#666666',
            },
          }
        : {
            // Dark mode colors
            primary: {
              main: '#90caf9',
            },
            secondary: {
              main: '#ce93d8',
            },
            background: {
              default: '#121212',
              paper: '#1e1e1e',
              card: '#2d2d2d',
            },
            text: {
              primary: '#ffffff',
              secondary: '#cccccc',
            },
          }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#121212' : '#f9f9f9',
            color: mode === 'dark' ? '#ffffff' : '#000000',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#ffffff' : 'inherit',
          },
          head: {
            backgroundColor: mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
            color: mode === 'dark' ? '#ffffff' : '#000000',
          },
        },
      },
    },
  });

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};