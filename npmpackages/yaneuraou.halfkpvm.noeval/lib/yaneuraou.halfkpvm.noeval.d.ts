/// <reference types="emscripten" />

export interface YaneuraOuModule extends EmscriptenModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
  ccall: typeof ccall;
  FS: typeof FS;
}

declare const YaneuraOu_HalfKPvm_noeval: EmscriptenModuleFactory<YaneuraOuModule>;
export default YaneuraOu_HalfKPvm_noeval;
