export interface YaneuraOuModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
}

export function YaneuraOu_K_P(userModule?: any): Promise<YaneuraOuModule>;
