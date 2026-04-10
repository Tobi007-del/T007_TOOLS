export * from "./index";

export * as utils from "./utils";

export * as plugins from "./plugins";

import * as vanilla from "./adapters/vanilla";
// import * as react from "../adapters/react";
const adapters = { vanilla };
export { adapters };
