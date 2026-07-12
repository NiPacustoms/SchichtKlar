import type { Plugin } from '@/src/plugins/registry';
import { pluginRegistry } from '@/src/plugins/registry';
import type { AssignmentStatusChangedEvent } from '@/src/domain/assignment/events';

const PLUGIN_ID = 'schichtklar/notifications';

const notificationsPlugin: Plugin = {
  meta: {
    id: PLUGIN_ID,
    name: 'Notifications',
    version: '1.0.0',
    description: 'In-app and push notification handling for assignment and document events',
  },

  init(context) {
    context.eventBus.publish({
      type: 'PluginLoaded',
      pluginId: PLUGIN_ID,
    } as { type: string; pluginId: string });

    if (context.eventBus.subscribe) {
      context.eventBus.subscribe('AssignmentStatusChanged', (event: unknown) => {
        const e = event as AssignmentStatusChangedEvent;
        if (e.type === 'AssignmentStatusChanged') {
          // Placeholder: trigger in-app/push when assignment status changes.
          // When wiring: notificationService.notifyAssignmentStatusChange(e);
          void [e.assignmentId, e.newStatus];
        }
      });
    }
  },
};

export function registerNotificationsPlugin(): void {
  pluginRegistry.register(notificationsPlugin);
}

export type { AssignmentStatusChangedEvent };
