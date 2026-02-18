'use client';

import { useCallback, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Title,
  Link as LinkIcon,
} from '@mui/icons-material';

export interface EmailTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: boolean;
  minHeight?: number;
}

export function EmailTemplateEditor({
  value,
  onChange,
  placeholder = 'E-Mail-Inhalt hier eingeben…',
  error = false,
  minHeight = 240,
}: EmailTemplateEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const current = editor.getHTML();
    const normalizedValue = value || '';
    if (normalizedValue !== current) {
      editor.commands.setContent(normalizedValue);
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL eingeben:', previousUrl || 'https://');
    if (url !== null) {
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        '& .ProseMirror': {
          outline: 'none',
          minHeight,
          p: 2,
          '& p.is-editor-empty:first-child::before': {
            content: `attr(data-placeholder)`,
            float: 'left',
            color: 'text.disabled',
            pointerEvents: 'none',
          },
          '& h1': { fontSize: '1.5rem', fontWeight: 600 },
          '& h2': { fontSize: '1.25rem', fontWeight: 600 },
          '& h3': { fontSize: '1.1rem', fontWeight: 600 },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            '& td, & th': { border: '1px solid', borderColor: 'divider', p: 1.5 },
            '& th': { fontWeight: 600, backgroundColor: 'action.hover' },
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          p: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'action.hover',
        }}
      >
        <ToggleButtonGroup size="small" sx={{ border: 'none' }}>
          <Tooltip title="Fett">
            <ToggleButton
              value="bold"
              selected={editor.isActive('bold')}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleBold().run();
              }}
              sx={{ minWidth: 40 }}
            >
              <FormatBold fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Kursiv">
            <ToggleButton
              value="italic"
              selected={editor.isActive('italic')}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleItalic().run();
              }}
              sx={{ minWidth: 40 }}
            >
              <FormatItalic fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Unterstrichen">
            <ToggleButton
              value="underline"
              selected={editor.isActive('underline')}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleUnderline().run();
              }}
              sx={{ minWidth: 40 }}
            >
              <FormatUnderlined fontSize="small" />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Box sx={{ width: 1, borderColor: 'divider' }} />

        <ToggleButtonGroup size="small" sx={{ border: 'none' }}>
          <Tooltip title="Überschrift 1">
            <ToggleButton
              value="h1"
              selected={editor.isActive('heading', { level: 1 })}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
              sx={{ minWidth: 40 }}
            >
              <Title fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Überschrift 2">
            <ToggleButton
              value="h2"
              selected={editor.isActive('heading', { level: 2 })}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                H2
              </Typography>
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Überschrift 3">
            <ToggleButton
              value="h3"
              selected={editor.isActive('heading', { level: 3 })}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                H3
              </Typography>
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Box sx={{ width: 1, borderColor: 'divider' }} />

        <ToggleButtonGroup size="small" sx={{ border: 'none' }}>
          <Tooltip title="Aufzählung">
            <ToggleButton
              value="bulletList"
              selected={editor.isActive('bulletList')}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleBulletList().run();
              }}
              sx={{ minWidth: 40 }}
            >
              <FormatListBulleted fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Nummerierte Liste">
            <ToggleButton
              value="orderedList"
              selected={editor.isActive('orderedList')}
              onMouseDown={e => {
                e.preventDefault();
                editor.chain().focus().toggleOrderedList().run();
              }}
              sx={{ minWidth: 40 }}
            >
              <FormatListNumbered fontSize="small" />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Tooltip title="Link einfügen">
          <IconButton
            size="small"
            onClick={setLink}
            color={editor.isActive('link') ? 'primary' : 'default'}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <EditorContent editor={editor} />
    </Box>
  );
}
