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

  public emit = <T extends MessageType>(message: Message<T>) => {
    this.listeners[message.type]?.forEach((cb) => cb(message.payload));
  };
}

export default new MessageHub();
