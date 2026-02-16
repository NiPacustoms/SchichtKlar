import AuditLogViewer from '@/components/admin/AuditLogViewer';

export default function AuditLogsPage() {
  // companyId wird automatisch aus dem AuthContext geholt
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Audit Logs</h1>
      <AuditLogViewer />
    </div>
  );
}
