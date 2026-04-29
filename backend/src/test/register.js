import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { addHook } from "pirates";

register("tsx/esm", pathToFileURL("./"));
