/// <reference types="emscripten" />
import { YaneuraOuModule } from "./yaneuraou.module";

declare const YaneuraOu_Material: EmscriptenModuleFactory<YaneuraOuModule>;
export = YaneuraOu_Material;
