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
  useTheme,
  AppBar,
  Toolbar,
  Tooltip,
  Snackbar,
  Alert,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Error as ErrorIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

const API_BASE_URL = 'https://phosai-dbec65d5-46be-45ae-9062.cranecloud.io';

const Chats = ({ agentId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const messagesEndRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const streamResponse = async (response) => {
    setIsStreaming(true);
    let streamedText = '';
    for (let word of response.split(' ')) {
      streamedText += word + ' ';
      setStreamingText(streamedText);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
    }
    setIsStreaming(false);
    return streamedText.trim();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('query', userMessage.content);
      formData.append('target_lang', 'en');

      const response = await fetch(`${API_BASE_URL}/agents/conversations`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();

      const streamedResponse = await streamResponse(data.answer);
      const botMessage = { role: 'assistant', content: streamedResponse, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      showSnackbar('Error processing message', 'error');
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(timestamp));
  };

  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      showSnackbar('Message copied to clipboard');
    } catch (error) {
      showSnackbar('Failed to copy message', 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}><BotIcon /></Avatar>
            <Typography variant="h6">Chatbot</Typography>
            <Tooltip title="Options">
              <IconButton color="inherit">
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Container maxWidth="md">
            <Stack spacing={2}>
              {messages.map((message, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {message.role === 'assistant' && <Avatar sx={{ bgcolor: theme.palette.primary.main }}><BotIcon /></Avatar>}
                  <Paper sx={{ p: 2, borderRadius: 2, bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper', color: message.role === 'user' ? 'common.white' : 'text.primary' }}>
                    <Typography variant="body1">{message.content}</Typography>
                  </Paper>
                  {message.role === 'user' && <Avatar sx={{ bgcolor: 'grey.300' }}><PersonIcon /></Avatar>}
                </Box>
              ))}
              {isStreaming && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}><BotIcon /></Avatar>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography>{streamingText}</Typography>
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </Container>
        </Box>

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Container maxWidth="md">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth variant="outlined" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} />
              <IconButton type="submit" disabled={!input.trim() || isLoading}><SendIcon /></IconButton>
            </Box>
          </Container>
        </Paper>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Chats;
