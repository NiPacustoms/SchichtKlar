'use client';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentGenerator } from '@/components/documents/DocumentGenerator';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { Document } from '@/lib/types';
import { toast } from '@/lib/utils/toast';

// ExtendedDocument type for DocumentCard
interface ExtendedDocument extends Document {
  status?: string;
  expiryDate?: Date | string;
  uploadedAt?: Date | string;
  notes?: string;
}
import { Upload, Description } from '@mui/icons-material';
import { Box, Button, Grid, Tab, Tabs, Typography, Stack } from '@mui/material';
import { useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { getStorage } from '@/lib/firebase';

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();

  const {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    verifyDocument,
    rejectDocument,
    getStatusColor,
    getStatusLabel,
    getDocumentsByStatus,
    getDocumentTypeColor,
    formatFileSize,
  } = useDocuments();

  const [showUpload, setShowUpload] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [_editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const validDocuments = getDocumentsByStatus('valid');
  const expiringDocuments = getDocumentsByStatus('expiring');
  const expiredDocuments = getDocumentsByStatus('expired');

  const handleUpload = (data: { file: File; type: string; description?: string }) => {
    uploadDocument.mutate(
      {
        ...data,
        name: data.file.name,
        type: data.type as 'Gesundheit' | 'Impfung' | 'Qualifikation' | 'Sonstiges',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr von jetzt
      },
      {
        onSuccess: () => {
          toast.success('Dokument erfolgreich hochgeladen!');
          setShowUpload(false);
        },
        onError: error => {
          toast.error('Fehler beim Hochladen: ' + error.message);
        },
      }
    );
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setShowUpload(true);
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Dokument wirklich löschen?')) {
      deleteDocument.mutate(documentId, {
        onSuccess: () => {
          toast.success('Dokument erfolgreich gelöscht!');
        },
        onError: error => {
          toast.error('Fehler beim Löschen: ' + error.message);
        },
      });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const fileRef = ref(
        getStorage(),
        (doc as unknown as { filePath?: string }).filePath || doc.name
      );
      const downloadURL = await getDownloadURL(fileRef);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = (doc as unknown as { fileName?: string }).fileName || doc.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download gestartet!');
    } catch (error) {
      toast.error(
        'Fehler beim Download: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const fileRef = ref(
        getStorage(),
        (doc as unknown as { filePath?: string }).filePath || doc.name
      );
      const downloadURL = await getDownloadURL(fileRef);

      // Open in new tab for preview
      window.open(downloadURL, '_blank');

      toast.success('Dokument wird geöffnet...');
    } catch (error) {
      toast.error(
        'Fehler beim Öffnen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    }
  };

  const _handleVerify = (documentId: string) => {
    if (confirm('Dokument als verifiziert markieren?')) {
      verifyDocument.mutate(
        { id: documentId, verifiedBy: user?.id || 'admin' },
        {
          onSuccess: () => {
            toast.success('Dokument erfolgreich verifiziert!');
          },
          onError: error => {
            toast.error('Fehler beim Verifizieren: ' + error.message);
          },
        }
      );
    }
  };

  const _handleReject = (documentId: string) => {
    const reason = prompt('Ablehnungsgrund:');
    if (reason) {
      rejectDocument.mutate(
        { id: documentId, rejectionReason: reason },
        {
          onSuccess: () => {
            toast.success('Dokument abgelehnt!');
          },
          onError: error => {
            toast.error('Fehler beim Ablehnen: ' + error.message);
          },
        }
      );
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Nachweise werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box
        className="min-height-viewport"
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>
            JobFlow
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Bitte melde dich an, um fortzufahren
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Meine Nachweise
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Verwalte deine Dokumente und behalte Ablaufdaten im Blick
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={() => setShowGenerator(true)}
            >
              Dokument erstellen
            </Button>
            <Button variant="contained" startIcon={<Upload />} onClick={() => setShowUpload(true)}>
              Hochladen
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Alle (${documents.length})`} />
          <Tab label={`Gültig (${validDocuments.length})`} />
          <Tab label={`Läuft ab (${expiringDocuments.length})`} />
          <Tab label={`Abgelaufen (${expiredDocuments.length})`} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Keine Nachweise vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Lade deine ersten Dokumente hoch
              </Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setShowUpload(true)}
              >
                Ersten Nachweis hochladen
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {documents.map(document => (
                <Grid size={{ xs: 12, md: 6 }} key={document.id}>
                  <DocumentCard
                    document={
                      {
                        ...document,
                        expiryDate: document.expiryDate,
                      } as unknown as ExtendedDocument
                    }
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onView={handleView}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    getDocumentTypeColor={getDocumentTypeColor}
                    formatFileSize={formatFileSize}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {validDocuments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Keine gültigen Nachweise
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {validDocuments.map(document => (
                <Grid size={{ xs: 12, md: 6 }} key={document.id}>
                  <DocumentCard
                    document={
                      {
                        ...document,
                        expiryDate: document.expiryDate,
                      } as unknown as ExtendedDocument
                    }
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onView={handleView}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    getDocumentTypeColor={getDocumentTypeColor}
                    formatFileSize={formatFileSize}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {expiringDocuments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Keine ablaufenden Nachweise
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {expiringDocuments.map(document => (
                <Grid size={{ xs: 12, md: 6 }} key={document.id}>
                  <DocumentCard
                    document={
                      {
                        ...document,
                        expiryDate: document.expiryDate,
                      } as unknown as ExtendedDocument
                    }
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onView={handleView}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    getDocumentTypeColor={getDocumentTypeColor}
                    formatFileSize={formatFileSize}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          {expiredDocuments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Keine abgelaufenen Nachweise
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {expiredDocuments.map(document => (
                <Grid size={{ xs: 12, md: 6 }} key={document.id}>
                  <DocumentCard
                    document={
                      {
                        ...document,
                        expiryDate: document.expiryDate,
                      } as unknown as ExtendedDocument
                    }
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onView={handleView}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    getDocumentTypeColor={getDocumentTypeColor}
                    formatFileSize={formatFileSize}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <DocumentUpload
        open={showUpload}
        onClose={() => {
          setShowUpload(false);
          setEditingDocument(null);
        }}
        onSubmit={handleUpload}
        isLoading={uploadDocument.isPending}
        uploadProgress={0} // This would need to be tracked
      />

      {/* Document Generator Dialog */}
      <DocumentGenerator
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onDocumentGenerated={(url, fileName) => {
          toast.success(`Dokument "${fileName}" erfolgreich erstellt!`);
          // Optional: Dokument zur Liste hinzufügen oder Seite neu laden
        }}
      />
    </Box>
  );
}
