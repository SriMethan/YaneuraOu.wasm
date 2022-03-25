/// <reference types="emscripten" />
import { YaneuraOuModule } from "./yaneuraou.module";

declare const YaneuraOu_MATE: EmscriptenModuleFactory<YaneuraOuModule>;
export = YaneuraOu_MATE;
