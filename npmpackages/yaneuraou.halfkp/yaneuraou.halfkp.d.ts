export interface YaneuraOuModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
}

export function YaneuraOu_HalfKP(userModule?: any): Promise<YaneuraOuModule>;
