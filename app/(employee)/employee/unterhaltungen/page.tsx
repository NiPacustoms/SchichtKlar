'use client';

import { useChatState } from '@/lib/hooks/useChat';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import ChannelList from './components/ChannelList';
import ChatView from './components/ChatView';
import NewChatDialog from './components/NewChatDialog';

export default function MessengerPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    selectedChannel,
    showChannelList,
    selectChannel,
    toggleChannelList: _toggleChannelList,
  } = useChatState();

  const [newChatOpen, setNewChatOpen] = useState(false);

  const handleNewChat = () => {
    setNewChatOpen(true);
  };

  const handleCloseNewChat = () => {
    setNewChatOpen(false);
  };

  const handleChannelSelect = (channelId: string) => {
    selectChannel(channelId);
  };

  const handleBackToChannels = () => {
    selectChannel(null);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          zIndex: 1,
        }}
      >
        {isMobile && selectedChannel && (
          <IconButton onClick={handleBackToChannels} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            flex: 1,
          }}
        >
          {selectedChannel ? 'Chat' : 'Messenger'}
        </Typography>

        {!isMobile && (
          <Tooltip title="Neuer Chat">
            <IconButton onClick={handleNewChat}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Desktop: Split View */}
        {!isMobile && (
          <>
            {/* Channel List */}
            <Paper
              elevation={0}
              sx={{
                width: 320,
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRight: '1px solid rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChannelList
                onChannelSelect={handleChannelSelect}
                selectedChannel={selectedChannel}
                onNewChat={handleNewChat}
              />
            </Paper>

            {/* Chat View */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedChannel ? (
                <ChatView channelId={selectedChannel} />
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: 'rgba(0,0,0,0.6)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Wähle einen Chat aus
                  </Typography>
                  <Typography variant="body2">
                    Beginne eine Unterhaltung oder wähle einen bestehenden Chat
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Mobile: Single View */}
        {isMobile && (
          <>
            {showChannelList ? (
              <Box sx={{ flex: 1, height: '100%' }}>
                <ChannelList
                  onChannelSelect={handleChannelSelect}
                  selectedChannel={selectedChannel}
                  onNewChat={handleNewChat}
                />
              </Box>
            ) : (
              <Box sx={{ flex: 1, height: '100%' }}>
                {selectedChannel && <ChatView channelId={selectedChannel} />}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 80, // Über der Bottom Navigation
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleNewChat}
        >
          <AddIcon />
        </Fab>
      )}

      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatOpen}
        onClose={handleCloseNewChat}
        onChannelCreated={channelId => {
          selectChannel(channelId);
          setNewChatOpen(false);
        }}
      />
    </Box>
  );
}
