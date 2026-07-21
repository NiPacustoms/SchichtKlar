'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { ArrowBack, AttachFile, Close, DoneAll, Send } from '@mui/icons-material';
import { format } from 'date-fns';
import type { Channel, Message } from '@/lib/types';
import { useChatMessages } from '@/lib/hooks/useChat';
import { avatarColor, formatDayChip, groupMessagesByDay, initials } from './chatFormat';
import { logger } from '@/lib/logging';

interface ConversationProps {
  channel: Channel;
  title: string;
  subtitle?: string;
  userId: string;
  onBack?: () => void;
}

function AttachmentView({ message }: { message: Message }) {
  if (!message.attachments || message.attachments.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: message.content ? 0.5 : 0 }}>
      {message.attachments.map(att =>
        att.mimeType.startsWith('image/') ? (
          <Box
            key={att.id}
            component="img"
            src={att.url}
            alt={att.name}
            sx={{ maxWidth: 220, maxHeight: 260, borderRadius: 2, display: 'block' }}
          />
        ) : (
          <MuiLink
            key={att.id}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <AttachFile fontSize="small" />
            <Typography component="span" variant="body2">
              {att.name}
            </Typography>
          </MuiLink>
        )
      )}
    </Box>
  );
}

/** Gesprächsansicht im WhatsApp-Stil: Datums-Chips, Sprechblasen, Lesehäkchen, Eingabezeile. */
export function Conversation({ channel, title, subtitle, userId, onBack }: ConversationProps) {
  const theme = useTheme();
  const { messages, loading, send } = useChatMessages(channel.id, userId);
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, channel.id]);

  const otherParticipants = channel.participants.filter(p => p !== userId);

  const handleSend = async () => {
    const content = draft.trim();
    if ((!content && files.length === 0) || sending) return;
    setSending(true);
    try {
      await send(content, files.length > 0 ? files : undefined);
      setDraft('');
      setFiles([]);
    } catch (e) {
      logger.error('Chat: Senden fehlgeschlagen', e);
    } finally {
      setSending(false);
    }
  };

  const ownBubbleBg =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.success.main, 0.28)
      : alpha(theme.palette.success.main, 0.16);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Kopfzeile */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {onBack && (
          <IconButton aria-label="Zurück zur Chat-Liste" onClick={onBack} edge="start">
            <ArrowBack />
          </IconButton>
        )}
        <Avatar sx={{ bgcolor: avatarColor(title), width: 40, height: 40 }}>{initials(title)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Verlauf */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 3 }, py: 2, bgcolor: 'action.hover' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} aria-label="Nachrichten werden geladen" />
          </Box>
        )}
        {!loading && messages.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Chip label="Noch keine Nachrichten – schreib die erste!" size="small" />
          </Box>
        )}
        {groupMessagesByDay(messages).map(group => (
          <Box key={group.day.toISOString()}>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
              <Chip label={formatDayChip(group.day)} size="small" sx={{ bgcolor: 'background.paper' }} />
            </Box>
            {group.messages.map(message => {
              const own = message.userId === userId;
              const readByOthers =
                otherParticipants.length > 0 && otherParticipants.every(p => message.readBy.includes(p));
              return (
                <Box
                  key={message.id}
                  sx={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start', mb: 0.75 }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: own ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: own ? ownBubbleBg : 'background.paper',
                      boxShadow: 1,
                    }}
                  >
                    <AttachmentView message={message} />
                    {message.content && (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.content}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 0.25,
                        mt: 0.25,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                        {format(message.createdAt, 'HH:mm')}
                      </Typography>
                      {own && (
                        <DoneAll
                          aria-label={readByOthers ? 'Gelesen' : 'Gesendet'}
                          sx={{
                            fontSize: '0.95rem',
                            color: readByOthers ? 'info.main' : 'text.disabled',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
        <Box ref={bottomRef} />
      </Box>

      {/* Datei-Vorschau */}
      {files.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, px: 2, pt: 1, flexWrap: 'wrap', bgcolor: 'background.paper' }}>
          {files.map((f, i) => (
            <Chip
              key={`${f.name}-${i}`}
              label={f.name}
              size="small"
              onDelete={() => setFiles(prev => prev.filter((_, j) => j !== i))}
              deleteIcon={<Close aria-label={`Anhang ${f.name} entfernen`} />}
            />
          ))}
        </Box>
      )}

      {/* Eingabezeile */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          py: 1.25,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={e => {
            const selected = Array.from(e.target.files || []);
            if (selected.length > 0) setFiles(prev => [...prev, ...selected]);
            e.target.value = '';
          }}
        />
        <IconButton
          aria-label="Datei anhängen"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
        >
          <AttachFile />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          size="small"
          placeholder="Nachricht schreiben …"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          slotProps={{ input: { sx: { borderRadius: 5, bgcolor: 'action.hover' } } }}
        />
        <IconButton
          aria-label="Nachricht senden"
          onClick={() => void handleSend()}
          disabled={sending || (!draft.trim() && files.length === 0)}
          sx={{
            bgcolor: 'success.main',
            color: 'success.contrastText',
            width: 44,
            height: 44,
            '&:hover': { bgcolor: 'success.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
          }}
        >
          {sending ? <CircularProgress size={20} sx={{ color: 'success.contrastText' }} /> : <Send />}
        </IconButton>
      </Box>
    </Box>
  );
}
