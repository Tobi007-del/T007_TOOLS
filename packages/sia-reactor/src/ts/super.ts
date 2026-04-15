export * from "./index";

export * as utils from "./utils";

export * as modules from "./modules";

import * as vanilla from "./adapters/vanilla";
// import * as react from "../adapters/react";
const adapters = { vanilla };
export { adapters };
