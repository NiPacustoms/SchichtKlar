'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';

interface SignatureDialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave: (dataUrl: string, signerName?: string) => void;
  requireName?: boolean;
  nameLabel?: string;
  initialName?: string;
}

export function SignatureDialog({
  open,
  title = 'Unterschrift',
  onClose,
  onSave,
  requireName = false,
  nameLabel = 'Name der unterschreibenden Person',
  initialName = '',
}: SignatureDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [signerName, setSignerName] = useState(initialName);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const newWidth = Math.floor(container.clientWidth * dpr);
      const newHeight = Math.floor((container.clientWidth / 2.2) * dpr);

      // Nur resize, wenn sich die Größe geändert hat
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientWidth / 2.2}px`;
        // Canvas beim ersten Öffnen oder bei Resize leeren
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasStrokes(false);
      }
    };
    if (open) {
      // Initialisierung nach kurzer Verzögerung, damit Container gerendert ist
      setTimeout(resize, 10);
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    } else {
      // Beim Schließen zurücksetzen
      setHasStrokes(false);
      setIsDrawing(false);
      setSignerName(initialName);
    }
  }, [open, initialName]);

  const getCtx = () => canvasRef.current?.getContext('2d') || null;

  const startDraw = (x: number, y: number) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.lineWidth = 3 * dpr;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx || !isDrawing) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = () => setIsDrawing(false);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    startDraw(x, y);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    draw(x, y);
  };
  const handleMouseUp = () => endDraw();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = toCanvasCoords(touch.clientX, touch.clientY);
    startDraw(x, y);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = toCanvasCoords(touch.clientX, touch.clientY);
    draw(x, y);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endDraw();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Validierung: Wenn Name erforderlich ist, muss er eingegeben sein
    if (requireName && !signerName?.trim()) {
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, signerName?.trim() || undefined);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      sx={isMobile ? { '& .MuiDialog-container': { alignItems: 'flex-end' } } : undefined}
      PaperProps={{
        sx: isMobile ? { borderRadius: '16px 16px 0 0', m: 0 } : {},
      }}
    >
      <DialogTitle sx={{ fontSize: isMobile ? 18 : undefined, py: isMobile ? 1.5 : undefined }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={nameLabel}
            value={signerName}
            onChange={e => setSignerName(e.target.value)}
            fullWidth
            size="small"
            required={requireName}
            error={requireName && !signerName?.trim()}
            helperText={requireName && !signerName?.trim() ? 'Bitte geben Sie Ihren Namen ein' : ''}
          />
          <Box ref={containerRef} sx={{ width: '100%', userSelect: 'none' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: '100%',
                height: 160,
                border: '1px dashed rgba(0,0,0,0.3)',
                borderRadius: 8,
                background: '#fff',
                touchAction: 'none',
                cursor: 'crosshair',
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button onClick={handleClear} size="small">
                Zurücksetzen
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasStrokes || (requireName && !signerName?.trim())}
        >
          Unterschrift speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
