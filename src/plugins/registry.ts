/**
 * Plugin registry – extensibility point for notifications, scheduled reports, etc.
 * Plugins register handlers that are invoked by the application layer.
 */

export type PluginId = string;

export interface PluginMeta {
  id: PluginId;
  name: string;
  version: string;
  description?: string;
}

export interface Plugin {
  meta: PluginMeta;
  init?(context: PluginContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
}

export interface EventBusLike {
  publish: (event: { type: string }) => void;
  subscribe?: (eventType: string, handler: (event: unknown) => void | Promise<void>) => () => void;
}

export interface PluginContext {
  register: (plugin: Plugin) => void;
  getPlugin: (id: PluginId) => Plugin | undefined;
  eventBus: EventBusLike;
}

const plugins = new Map<PluginId, Plugin>();

export const pluginRegistry = {
  register(plugin: Plugin): void {
    if (plugins.has(plugin.meta.id)) {
      console.warn(`[PluginRegistry] Plugin ${plugin.meta.id} already registered, skipping.`);
      return;
    }
    plugins.set(plugin.meta.id, plugin);
  },

  get(id: PluginId): Plugin | undefined {
    return plugins.get(id);
  },

  getAll(): Plugin[] {
    return Array.from(plugins.values());
  },

  async initAll(eventBus: EventBusLike): Promise<void> {
    const context: PluginContext = {
      register: this.register.bind(this),
      getPlugin: this.get.bind(this),
      eventBus,
    };
    for (const plugin of plugins.values()) {
      if (plugin.init) {
        await Promise.resolve(plugin.init(context));
      }
    }
  },

  async disposeAll(): Promise<void> {
    for (const plugin of plugins.values()) {
      if (plugin.dispose) {
        await Promise.resolve(plugin.dispose());
      }
    }
    plugins.clear();
  },
};
