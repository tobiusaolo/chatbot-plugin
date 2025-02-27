import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Stack,
  AppBar,
  Toolbar,
  Tooltip,
  Snackbar,
  Alert,
  Fade,
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Mic as MicIcon,
} from '@mui/icons-material';

// Create a theme instance to ensure consistent styling
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
        },
      },
    },
  },
});

const API_BASE_URL = 'https://agents.tericlab.com:8000';

// Typing indicator component with inline styling
const TypingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <Box
        key={i}
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: 'pulse 1.4s infinite ease-in-out both',
          animationDelay: `${delay}s`,
          '@keyframes pulse': {
            '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.6 },
            '40%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      />
    ))}
  </Box>
);

// Message time formatter
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatComponent = ({ agentId, botName = 'AI Assistant', targetLang = 'en' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const isMobile = useMediaQuery(defaultTheme.breakpoints.down('sm'));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        // Only attempt to fetch if we have an agentId
        if (!agentId) {
          setIsLoadingInfo(false);
          return;
        }
        
        const formData = new FormData();
        formData.append("agent_id", agentId);

        const response = await fetch(`${API_BASE_URL}/agent-info`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to fetch agent info');
        setIsLoadingInfo(false);
      } catch (error) {
        console.error("Error fetching agent info:", error);
        showSnackbar('Failed to load agent information', 'error');
        setIsLoadingInfo(false);
      }
    };

    // Add welcome message first
    const welcomeMessage = {
      role: 'assistant',
      content: `Hello! I'm ${botName}. How can I assist you today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    
    // Then fetch agent info
    fetchAgentInfo();
  }, [agentId, botName]);

  // Make sure the chat container takes full height of its parent
  useEffect(() => {
    const adjustHeight = () => {
      if (chatBoxRef.current && chatBoxRef.current.parentElement) {
        const parentHeight = chatBoxRef.current.parentElement.offsetHeight;
        if (parentHeight > 0) {
          chatBoxRef.current.style.height = `${parentHeight}px`;
        } else {
          chatBoxRef.current.style.height = '600px'; // Fallback height
        }
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    
    // Try again after a short delay to ensure parent has rendered
    setTimeout(adjustHeight, 100);

    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const streamResponse = async (response) => {
    setIsStreaming(true);
    let streamedText = '';
    const sentences = response.split(/(?<=[.!?])\s+/);
    
    for (let sentence of sentences) {
      const words = sentence.split(' ');
      for (let word of words) {
        streamedText += word + ' ';
        setStreamingText(streamedText);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 40 + 10));
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setIsStreaming(false);
    return streamedText.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("agent_id", agentId || "default");
      formData.append("query", userMessage.content);
      formData.append("target_lang", targetLang);

      const response = await fetch(`${API_BASE_URL}/agents/conversations`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status})`);

      const data = await response.json();
      if (!data.answer) throw new Error("Invalid response from server");

      const streamedResponse = await streamResponse(data.answer);

      const botMessage = { role: 'assistant', content: streamedResponse, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Fetch Error:", error);
      showSnackbar("Failed to send message", "error");
      
      // Fallback response in case of API failure
      const fallbackMessage = { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting to my services right now. Please try again in a moment.", 
        timestamp: new Date().toISOString() 
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
      setStreamingText('');
      inputRef.current?.focus();
    }
  };

  // Message renderer with proper formatting
  const renderMessageContent = (content) => {
    // Split content by newlines and handle paragraphs properly
    const paragraphs = content.split('\n').filter(p => p.trim());
    
    if (paragraphs.length <= 1) {
      return <Typography variant="body1">{content}</Typography>;
    }
    
    return (
      <Stack spacing={1}>
        {paragraphs.map((paragraph, idx) => (
          <Typography key={idx} variant="body1">
            {paragraph}
          </Typography>
        ))}
      </Stack>
    );
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Box 
        ref={chatBoxRef}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          minHeight: '500px', // Minimum height to ensure visibility
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {/* HEADER */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'primary.main',
            backgroundImage: 'linear-gradient(to right, #1976d2, #42a5f5)',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 60, sm: 64 } }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.dark', 
                mr: 2,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {botName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {isLoading || isStreaming ? 'Typing...' : 'Online'}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Chat options">
              <IconButton size="small" color="inherit" edge="end">
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* CHAT MESSAGES */}
        <Box 
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={2} sx={{ maxWidth: '100%' }}>
            {messages.map((message, index) => (
              <Fade 
                key={index}
                in={true}
                timeout={{ enter: 300 }}
              >
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    {message.role === 'assistant' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          width: { xs: 32, sm: 36 }, 
                          height: { xs: 32, sm: 36 },
                        }}
                      >
                        <BotIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                      </Avatar>
                    )}

                    <Paper
                      elevation={message.role === 'user' ? 1 : 2}
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        maxWidth: { xs: '75%', sm: '70%' },
                        bgcolor: message.role === 'user' 
                          ? 'primary.main' 
                          : 'background.paper',
                        color: message.role === 'user' ? 'common.white' : 'text.primary',
                      }}
                    >
                      {renderMessageContent(message.content)}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 0.5,
                          color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary', 
                          fontSize: '0.7rem',
                          textAlign: 'right'
                        }}
                      >
                        {formatMessageTime(message.timestamp)}
                      </Typography>
                    </Paper>

                    {message.role === 'user' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: 'grey.300', 
                          width: { xs: 32, sm: 36 }, 
                          height: { xs: 32, sm: 36 },
                        }}
                      >
                        <PersonIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                      </Avatar>
                    )}
                  </Box>
                </Box>
              </Fade>
            ))}

            {/* Streaming message preview */}
            {isStreaming && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: { xs: 32, sm: 36 }, 
                    height: { xs: 32, sm: 36 },
                  }}
                >
                  <BotIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                </Avatar>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1.5, 
                    px: 2,
                    borderRadius: 2, 
                    maxWidth: { xs: '75%', sm: '70%' },
                  }}
                >
                  {streamingText ? renderMessageContent(streamingText) : <TypingIndicator />}
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* INPUT FIELD */}
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'background.paper',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField 
              fullWidth 
              variant="outlined"
              placeholder="Type your message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              inputRef={inputRef}
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              InputProps={{
                sx: {
                  borderRadius: 3,
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.07)',
                  },
                },
                endAdornment: !isMobile && (
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    <MicIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            
            <IconButton 
              type="submit" 
              disabled={!input.trim() || isLoading}
              color="primary"
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                p: 1,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                }
              }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Typography 
            variant="caption" 
            align="center" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              color: 'text.secondary',
              opacity: 0.7
            }}
          >
            Powered by Teric Lab AI
          </Typography>
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

// Wrapper component with explicit sizing to ensure proper display in embedded environments
const Chats = (props) => {
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      minHeight: '500px',
      display: 'flex',
      overflow: 'hidden'
    }}>
      <ChatComponent {...props} />
    </Box>
  );
};

export default Chats;