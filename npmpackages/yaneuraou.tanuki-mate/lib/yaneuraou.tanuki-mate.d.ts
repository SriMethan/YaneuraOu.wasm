/// <reference types="emscripten" />
import { YaneuraOuModule } from "./yaneuraou.module";

declare const tanuki_MATE: EmscriptenModuleFactory<YaneuraOuModule>;
export = tanuki_MATE;
