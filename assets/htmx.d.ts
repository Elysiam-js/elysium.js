/**
 * HTMX TypeScript Definitions
 * Generated for HTMX version 1.9.10
 */
declare namespace htmx {
  interface Config {
    historyEnabled: boolean;
    historyCacheSize: number;
    refreshOnHistoryMiss: boolean;
    defaultSwapStyle: string;
    defaultSwapDelay: number;
    defaultSettleDelay: number;
    includeIndicatorStyles: boolean;
    indicatorClass: string;
    requestClass: string;
    addedClass: string;
    settlingClass: string;
    swappingClass: string;
    allowEval: boolean;
    allowScriptTags: boolean;
    inlineScriptNonce: string;
    attributesToSettle: string[];
    withCredentials: boolean;
    timeout: number;
    wsReconnectDelay: 'full-jitter' | number;
    wsBinaryType: 'blob' | 'arraybuffer';
    disableSelector: string;
    useTemplateFragments: boolean;
    scrollBehavior: 'smooth' | 'auto';
    defaultFocusScroll: boolean;
    getCacheBusterParam: boolean | (() => string);
    globalViewTransitions: boolean;
    methodsThatUseUrlParams: string[];
    selfRequestsOnly: boolean;
    ignoreTitle: boolean;
    scrollIntoViewOnBoost: boolean;
    triggerSpecsCache: Record<string, any> | null;
  }

  interface TriggerSpec {
    trigger: string;
    target?: string;
    delay?: number;
    throttle?: number;
    once?: boolean;
    changed?: boolean;
    consume?: boolean;
    queue?: string;
    root?: string;
    threshold?: string;
    sync?: boolean;
    from?: string;
    pollInterval?: number;
    eventFilter?: (evt: Event) => boolean;
  }

  interface SwapSpec {
    swapStyle: string;
    swapDelay: number;
    settleDelay: number;
    ignoreTitle: boolean;
    scroll?: string;
    show?: string;
    focusScroll?: boolean;
    transition?: boolean;
  }

  interface RequestConfig {
    boosted: boolean;
    headers: Record<string, string>;
    parameters: Record<string, any>;
    unfilteredParameters: Record<string, any>;
    target: HTMLElement;
    verb: string;
    errors: any[];
    withCredentials: boolean;
    timeout: number;
    path: string;
    triggeringEvent: Event;
  }

  interface HtmxApi {
    _: (str: string) => any;
    onLoad: (callback: (content: HTMLElement) => void) => void;
    process: (element: HTMLElement) => void;
    on: (target: HTMLElement | string, eventName: string, listener: (event: Event) => void) => void;
    off: (target: HTMLElement | string, eventName: string, listener: (event: Event) => void) => void;
    trigger: (element: HTMLElement, eventName: string, detail?: any) => void;
    find: (selector: string) => HTMLElement | null;
    findAll: (selector: string) => NodeListOf<HTMLElement>;
    closest: (element: HTMLElement, selector: string) => HTMLElement | null;
    remove: (element: HTMLElement, delay?: number) => void;
    addClass: (element: HTMLElement, className: string, delay?: number) => void;
    removeClass: (element: HTMLElement, className: string, delay?: number) => void;
    toggleClass: (element: HTMLElement, className: string) => void;
    takeClass: (element: HTMLElement, className: string) => void;
    defineExtension: (name: string, extension: any) => void;
    removeExtension: (name: string) => void;
    logAll: () => void;
    logNone: () => void;
    logger: null | ((elt: HTMLElement, event: string, detail: any) => void);
    config: Config;
    parseInterval: (str: string) => number;
    createEventSource: (url: string) => EventSource;
    createWebSocket: (url: string) => WebSocket;
    version: string;
    ajax: (verb: string, path: string, options?: {
      target?: HTMLElement | string;
      swap?: string;
      values?: Record<string, any>;
      headers?: Record<string, string>;
      select?: string;
    }) => Promise<any>;
  }

  interface HtmxEvent extends CustomEvent {
    detail: {
      elt: HTMLElement;
      target: HTMLElement;
      requestConfig?: RequestConfig;
      xhr?: XMLHttpRequest;
      pathInfo?: {
        requestPath: string;
        finalRequestPath: string;
        anchor?: string;
      };
    };
  }

  interface HtmxValidationEvent extends HtmxEvent {
    detail: {
      elt: HTMLElement;
      target: HTMLElement;
      message: string;
      validity: ValidityState;
    };
  }
}

// Add HTMX to the window object
interface Window {
  htmx: htmx.HtmxApi;
}

// Add HTMX attributes to HTML elements
interface HTMLElement {
  // Core HTMX attributes
  'hx-boost'?: 'true' | 'false';
  'hx-get'?: string;
  'hx-post'?: string;
  'hx-put'?: string;
  'hx-delete'?: string;
  'hx-patch'?: string;
  'hx-push-url'?: string | 'true' | 'false';
  'hx-select'?: string;
  'hx-select-oob'?: string;
  'hx-swap'?: 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none' | string;
  'hx-swap-oob'?: string;
  'hx-target'?: string;
  'hx-trigger'?: string;
  'hx-vals'?: string;
  'hx-confirm'?: string;
  'hx-disable'?: string;
  'hx-disinherit'?: string;
  'hx-encoding'?: 'multipart/form-data' | string;
  'hx-ext'?: string;
  'hx-headers'?: string;
  'hx-history'?: 'true' | 'false';
  'hx-history-elt'?: string;
  'hx-include'?: string;
  'hx-indicator'?: string;
  'hx-params'?: 'none' | '*' | string;
  'hx-preserve'?: string;
  'hx-prompt'?: string;
  'hx-replace-url'?: string | 'true' | 'false';
  'hx-request'?: string;
  'hx-sync'?: string;
  'hx-validate'?: 'true' | 'false';
  'hx-vars'?: string;
  'hx-ws'?: string;
  'hx-sse'?: string;

  // Data attribute variants
  'data-hx-boost'?: 'true' | 'false';
  'data-hx-get'?: string;
  'data-hx-post'?: string;
  'data-hx-put'?: string;
  'data-hx-delete'?: string;
  'data-hx-patch'?: string;
  'data-hx-push-url'?: string | 'true' | 'false';
  'data-hx-select'?: string;
  'data-hx-select-oob'?: string;
  'data-hx-swap'?: 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none' | string;
  'data-hx-swap-oob'?: string;
  'data-hx-target'?: string;
  'data-hx-trigger'?: string;
  'data-hx-vals'?: string;
  'data-hx-confirm'?: string;
  'data-hx-disable'?: string;
  'data-hx-disinherit'?: string;
  'data-hx-encoding'?: 'multipart/form-data' | string;
  'data-hx-ext'?: string;
  'data-hx-headers'?: string;
  'data-hx-history'?: 'true' | 'false';
  'data-hx-history-elt'?: string;
  'data-hx-include'?: string;
  'data-hx-indicator'?: string;
  'data-hx-params'?: 'none' | '*' | string;
  'data-hx-preserve'?: string;
  'data-hx-prompt'?: string;
  'data-hx-replace-url'?: string | 'true' | 'false';
  'data-hx-request'?: string;
  'data-hx-sync'?: string;
  'data-hx-validate'?: 'true' | 'false';
  'data-hx-vars'?: string;
  'data-hx-ws'?: string;
  'data-hx-sse'?: string;
}
