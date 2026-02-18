/**
 * In-process event bus for domain events.
 * Can be replaced by a message queue later.
 */
type Handler<T = unknown> = (event: T) => void | Promise<void>;

const handlersByType = new Map<string, Set<Handler>>();

export const EventBus = {
  publish<T>(event: { type: string } & T): void {
    const handlers = handlersByType.get(event.type);
    if (!handlers) return;
    handlers.forEach((h) => {
      try {
        const result = h(event);
        if (result instanceof Promise) {
          result.catch((err) =>
            console.error(`[EventBus] handler error for ${event.type}`, err)
          );
        }
      } catch (err) {
        console.error(`[EventBus] handler error for ${event.type}`, err);
      }
    });
  },

  subscribe<T>(eventType: string, handler: Handler<T>): () => void {
    let set = handlersByType.get(eventType);
    if (!set) {
      set = new Set();
      handlersByType.set(eventType, set);
    }
    set.add(handler as Handler);
    return () => set!.delete(handler as Handler);
  },
};
