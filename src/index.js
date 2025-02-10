// index.js (for the plugin)
import React from 'react';
import ReactDOM from 'react-dom/client';
import Chats from './Chats';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

// Export the initialization function that websites will call
window.initAIChatPlugin = ({ agentId, containerId = 'ai-chat-root' }) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <ThemeProvider theme={theme}>
        <Chats agentId={agentId} />
      </ThemeProvider>
    );
  }
};