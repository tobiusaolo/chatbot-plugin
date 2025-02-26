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
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';

const API_BASE_URL = 'https://agents.tericlab.com:8000';

const Chats = ({ agentId, botName, targetLang }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        const formData = new FormData();
        formData.append("agent_id", agentId);

        const response = await fetch(`${API_BASE_URL}/agent-info`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to fetch agent info');

        const data = await response.json();
        setAgentInfo(data);
      } catch (error) {
        showSnackbar('Failed to load agent information', 'error');
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchAgentInfo();
  }, [agentId]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const streamResponse = async (response) => {
    setIsStreaming(true);
    let streamedText = '';
    const words = response.split(' ');

    for (let word of words) {
      streamedText += word + ' ';
      setStreamingText(streamedText);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
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
      formData.append("agent_id", agentId);
      formData.append("query", userMessage.content);
      formData.append("target_lang", targetLang);

      console.log("🚀 Sending FormData:", Object.fromEntries(formData.entries()));

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
      console.error("❌ Fetch Error:", error);
      showSnackbar("Failed to send message", "error");
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.50' }}>
      
      {/* HEADER - Sticky at the top */}
      <AppBar position="sticky" sx={{ top: 0, left: 0, width: '100%', zIndex: 1100 }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}>
            <BotIcon />
          </Avatar>
          <Typography variant="h6">{botName}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Chat options">
            <IconButton color="inherit">
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* CHAT MESSAGES - Scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Container maxWidth="sm">
          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <BotIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    maxWidth: '70%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                    color: message.role === 'user' ? 'common.white' : 'text.primary'
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                </Paper>

                {message.role === 'user' && (
                  <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {/* Streaming message preview */}
            {isStreaming && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <BotIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, maxWidth: '70%' }}>
                  <Typography>{streamingText}</Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </Container>
      </Box>

      {/* INPUT FIELD - Sticky at the bottom */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth variant="outlined" placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} />
            <IconButton type="submit" disabled={!input.trim() || isLoading}>
              {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default Chats;
