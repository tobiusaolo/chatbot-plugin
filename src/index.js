import React from 'react';
import ReactDOM from 'react-dom/client';
import Chats from './Chats';
import { ThemeProvider, createTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Box, Tooltip } from '@mui/material';

const theme = createTheme();

// Floating Chat Component
const FloatingChat = ({ agentId,targetLang,botName }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Box>
      {isOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '350px',
            height: '500px',
            backgroundColor: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            borderRadius: '10px',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <ThemeProvider theme={theme}>
            <Chats 
              agentId={agentId}
              botName={botName}
              targetLang={targetLang}
            />
          </ThemeProvider>
        </Box>
      )}

      <Tooltip title={isOpen ? 'Close Chat' : 'Open Chat'}>
        <IconButton
          sx={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'primary.main',
            color: 'white',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            '&:hover': { backgroundColor: 'primary.dark' },
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Global initialization function with additional parameters
window.initAIChatPlugin = function ({ 
  agentId, 
  targetLang,
  botName ,                
  containerId = 'ai-chat-root' 
}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found.`);
    return;
  }

  if (!window.React || !window.ReactDOM) {
    console.error('React or ReactDOM is not available in the global scope.');
    return;
  }

  console.log('Initializing chatbot...', { agentId, botName, targetLang });
  const root = ReactDOM.createRoot(container);
  root.render(
    <FloatingChat 
      agentId={agentId}
      targetLang={targetLang}
      botName={botName}
    />
  );
};