// App.js
import React from 'react';
import Chats from './Chats';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a MUI theme instance
const theme = createTheme();

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Chats 
      agentId="your-agent-id"
      targetLang = "en"
      botName = "Resume Assistant" />
    </ThemeProvider>
  );
};

export default App;
