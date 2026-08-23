import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    interface Element extends ReactJSX.Element { }
  }
}

export { };
