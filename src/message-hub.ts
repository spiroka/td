import { Message, MessagePayloads, MessageType } from './messages';

class MessageHub {
  private listeners: Partial<Record<MessageType, ((payload: any) => void)[]>> = {};

  public on = <T extends MessageType>(
    messageType: T,
    callback: (payload: MessagePayloads[T]) => void
  ) => {
    this.listeners[messageType] ??= [];

    this.listeners[messageType].push(callback);
  };

  public emit = <T extends MessageType>({ type, ...payload }: Message<T>) => {
    this.listeners[type]?.forEach((cb) => cb(payload));
  };
}

export default new MessageHub();
