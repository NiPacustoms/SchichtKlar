'use client';

import { RoleRedirect } from '@/components/auth/RoleRedirect';

export default function Page() {
  return <RoleRedirect admin="/admin/zeitnachweise" employee="/employee/zeiterfassung" />;
}
