import { getStorage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { logger } from '@/lib/logging';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

export interface FileMetadata {
  name: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  path: string;
}

export interface ExportFile {
  id: string;
  name: string;
  type: 'timesheet' | 'payroll' | 'report' | 'document' | 'other';
  userId?: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, string>;
}

export class FirebaseStorageService {
  private basePath = 'exports';

  /**
   * Lädt eine Datei in Firebase Storage hoch
   */
  async uploadFile(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const storageRef = ref(getStorage(), `${this.basePath}/${path}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        customMetadata: metadata || {},
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
        contentType: snapshot.metadata.contentType || file.type,
        uploadedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error uploading file', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Lädt eine Export-Datei hoch
   */
  async uploadExport(
    file: File,
    type: ExportFile['type'],
    userId?: string,
    metadata?: Record<string, string>
  ): Promise<ExportFile> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${type}_${timestamp}_${file.name}`;
      const path = userId ? `${userId}/${fileName}` : fileName;

      const uploadResult = await this.uploadFile(file, path, {
        ...metadata,
        type,
        userId: userId || 'system',
        uploadedAt: new Date().toISOString(),
      });

      return {
        id: uploadResult.path,
        name: file.name,
        type,
        userId,
        url: uploadResult.url,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        uploadedAt: uploadResult.uploadedAt,
        metadata,
      };
    } catch (error) {
      logger.error('Error uploading export', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Lädt eine Timesheet-Export-Datei hoch
   */
  async uploadTimesheetExport(
    file: File,
    userId: string,
    period: { year: number; month: number },
    metadata?: Record<string, string>
  ): Promise<ExportFile> {
    const exportMetadata = {
      ...metadata,
      period: `${period.year}-${period.month.toString().padStart(2, '0')}`,
      exportType: 'timesheet',
    };

    return this.uploadExport(file, 'timesheet', userId, exportMetadata);
  }

  /**
   * Lädt eine Payroll-Export-Datei hoch
   */
  async uploadPayrollExport(
    file: File,
    userId: string,
    period: { year: number; month: number },
    metadata?: Record<string, string>
  ): Promise<ExportFile> {
    const exportMetadata = {
      ...metadata,
      period: `${period.year}-${period.month.toString().padStart(2, '0')}`,
      exportType: 'payroll',
    };

    return this.uploadExport(file, 'payroll', userId, exportMetadata);
  }

  /**
   * Lädt eine Report-Datei hoch
   */
  async uploadReport(
    file: File,
    reportType: string,
    userId?: string,
    metadata?: Record<string, string>
  ): Promise<ExportFile> {
    const exportMetadata = {
      ...metadata,
      reportType,
      exportType: 'report',
    };

    return this.uploadExport(file, 'report', userId, exportMetadata);
  }

  /**
   * Holt alle Export-Dateien für einen User
   */
  async getUserExports(userId: string): Promise<ExportFile[]> {
    try {
      const userRef = ref(getStorage(), `${this.basePath}/${userId}`);
      const listResult = await listAll(userRef);

      const exports: ExportFile[] = [];

      for (const itemRef of listResult.items) {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);

          exports.push({
            id: itemRef.fullPath,
            name: metadata.name,
            type: (metadata.customMetadata?.type as ExportFile['type']) || 'other',
            userId,
            url: downloadURL,
            size: metadata.size,
            contentType: metadata.contentType || 'application/octet-stream',
            uploadedAt: new Date(metadata.timeCreated),
            metadata: metadata.customMetadata,
          });
        } catch (error) {
          logger.error('Error getting file metadata', error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Sort by upload date (newest first)
      return exports.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      logger.error('Error getting user exports', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Holt alle Export-Dateien (Admin)
   */
  async getAllExports(): Promise<ExportFile[]> {
    try {
      const baseRef = ref(getStorage(), this.basePath);
      const listResult = await listAll(baseRef);

      const exports: ExportFile[] = [];

      for (const folderRef of listResult.prefixes) {
        try {
          const folderExports = await this.getUserExports(folderRef.name);
          exports.push(...folderExports);
        } catch (error) {
          logger.error('Error getting folder exports', error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Sort by upload date (newest first)
      return exports.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      logger.error('Error getting all exports', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Löscht eine Export-Datei
   */
  async deleteExport(exportId: string): Promise<void> {
    try {
      const fileRef = ref(getStorage(), exportId);
      await deleteObject(fileRef);
    } catch (error) {
      logger.error('Error deleting export', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Generiert einen Download-Link für eine Datei
   */
  async getDownloadUrl(path: string): Promise<string> {
    try {
      const fileRef = ref(getStorage(), path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      logger.error('Error getting download URL', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Holt Metadaten einer Datei
   */
  async getFileMetadata(path: string): Promise<FileMetadata | null> {
    try {
      const fileRef = ref(getStorage(), path);
      const metadata = await getMetadata(fileRef);

      return {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType || 'application/octet-stream',
        uploadedAt: new Date(metadata.timeCreated),
        path: metadata.fullPath,
      };
    } catch (error) {
      logger.error('Error getting file metadata', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Bereinigt alte Export-Dateien (älter als 30 Tage)
   */
  async cleanupOldExports(daysOld: number = 30): Promise<number> {
    try {
      const allExports = await this.getAllExports();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      for (const exportFile of allExports) {
        if (exportFile.uploadedAt < cutoffDate) {
          try {
            await this.deleteExport(exportFile.id);
            deletedCount++;
          } catch (error) {
            logger.error('Error deleting old export', error instanceof Error ? error : new Error(String(error)));
          }
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old exports', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Generiert einen eindeutigen Dateinamen
   */
  generateFileName(originalName: string, prefix?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    
    if (prefix) {
      return `${prefix}_${baseName}_${timestamp}.${extension}`;
    }
    
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Validiert eine Datei vor dem Upload
   */
  validateFile(file: File, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Datei ist zu groß. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Dateityp nicht unterstützt. Erlaubt: PDF, Excel, CSV, JSON',
      };
    }

    return { valid: true };
  }
}

// Singleton instance
export const firebaseStorageService = new FirebaseStorageService();
