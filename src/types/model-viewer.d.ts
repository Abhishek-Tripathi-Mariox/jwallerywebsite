// <model-viewer> is a web component (registered as a side effect of
// importing "@google/model-viewer"); it has no built-in JSX typing, so this
// declares just the attributes this app actually uses.
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ios-src"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string | number;
        exposure?: string | number;
      },
      HTMLElement
    >;
  }
}
