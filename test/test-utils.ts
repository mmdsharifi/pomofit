export * from "@testing-library/react";

// Polyfill for PromiseRejectionEvent in JSDOM
interface PromiseRejectionEventInit {
  promise: Promise<any>;
  reason: any;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).PromiseRejectionEvent =
  (global as any).PromiseRejectionEvent ||
  function PromiseRejectionEvent(
    this: any,
    type: string,
    props: PromiseRejectionEventInit
  ) {
    this.type = type;
    this.promise = props.promise;
    this.reason = props.reason;
  };
