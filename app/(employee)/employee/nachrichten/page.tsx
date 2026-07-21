'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChatPage } from '@/components/chat/ChatPage';

export default function EmployeeNachrichtenPage() {
  return (
    <PageContainer>
      <PageHeader title="Nachrichten" subtitle="Direkter Draht zur Verwaltung" />
      <ChatPage />
    </PageContainer>
  );
}
