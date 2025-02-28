import { MediaUIAttributes } from './constants.js';
import { nouns } from './labels/labels.js';
import { defineCustomElement } from './utils/defineCustomElement.js';
import {
  Window as window,
  Document as document,
} from './utils/server-safe-globals.js';
// Todo: Use data locals: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString

const template = document.createElement('template');

const loadingIndicatorIcon = `
<svg aria-hidden="true" viewBox="0 0 100 100">
  <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
    <animateTransform
       attributeName="transform"
       attributeType="XML"
       type="rotate"
       dur="1s"
       from="0 50 50"
       to="360 50 50"
       repeatCount="indefinite" />
  </path>
</svg>
`;

template.innerHTML = `
<style>
:host {
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
}

#status {
  color: rgba(0,0,0,0);
  width: 0px;
  height: 0px;
}

:host slot[name=loading] > *,
:host ::slotted([slot=loading]) {
  opacity: 1;
  transition: opacity 0.15s;
}

:host(:not([is-loading])) slot[name=loading] > *, 
:host(:not([is-loading])) ::slotted([slot=loading]) {
  opacity: 0;
}

:host(:not([is-loading])) #status {
  display: none;
}

svg, img, ::slotted(svg), ::slotted(img) {
  width: var(--media-loading-icon-width, 100px);
  height: var(--media-loading-icon-height);
  fill: var(--media-icon-color, #fff);
  vertical-align: middle;
}
</style>

<slot name="loading">${loadingIndicatorIcon}</slot>
<div id="status" role="status" aria-live="polite">${nouns.MEDIA_LOADING()}</div>
`;

const DEFAULT_LOADING_DELAY = 500;

class MediaLoadingIndicator extends window.HTMLElement {
  static get observedAttributes() {
    return [
      MediaUIAttributes.MEDIA_CONTROLLER,
      MediaUIAttributes.MEDIA_PAUSED,
      MediaUIAttributes.MEDIA_LOADING,
      'loading-delay',
    ];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const indicatorHTML = template.content.cloneNode(true);
    shadow.appendChild(indicatorHTML);
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (
      attrName === MediaUIAttributes.MEDIA_LOADING ||
      attrName === MediaUIAttributes.MEDIA_PAUSED
    ) {
      const isPaused =
        this.getAttribute(MediaUIAttributes.MEDIA_PAUSED) != undefined;
      const isMediaLoading =
        this.getAttribute(MediaUIAttributes.MEDIA_LOADING) != undefined;
      const isLoading = !isPaused && isMediaLoading;
      if (!isLoading) {
        if (this.loadingDelayHandle) {
          clearTimeout(this.loadingDelayHandle);
          this.loadingDelayHandle = undefined;
        }
        this.removeAttribute('is-loading');
      } else if (!this.loadingDelayHandle && isLoading) {
        const loadingDelay = +(
          this.getAttribute('loading-delay') ?? DEFAULT_LOADING_DELAY
        );
        this.loadingDelayHandle = setTimeout(() => {
          this.setAttribute('is-loading', '');
          this.loadingDelayHandle = undefined;
        }, loadingDelay);
      }
    } else if (attrName === MediaUIAttributes.MEDIA_CONTROLLER) {
      if (oldValue) {
        const mediaControllerEl = document.getElementById(oldValue);
        mediaControllerEl?.unassociateElement?.(this);
      }
      if (newValue) {
        const mediaControllerEl = document.getElementById(newValue);
        mediaControllerEl?.associateElement?.(this);
      }
    }
  }

  connectedCallback() {
    const mediaControllerId = this.getAttribute(
      MediaUIAttributes.MEDIA_CONTROLLER
    );
    if (mediaControllerId) {
      const mediaControllerEl = document.getElementById(mediaControllerId);
      mediaControllerEl?.associateElement?.(this);
    }
  }

  disconnectedCallback() {
    if (this.loadingDelayHandle) {
      clearTimeout(this.loadingDelayHandle);
      this.loadingDelayHandle = undefined;
    }
    const mediaControllerSelector = this.getAttribute(
      MediaUIAttributes.MEDIA_CONTROLLER
    );
    if (mediaControllerSelector) {
      const mediaControllerEl = document.getElementById(mediaControllerId);
      mediaControllerEl?.unassociateElement?.(this);
    }
  }
}

defineCustomElement('media-loading-indicator', MediaLoadingIndicator);

export default MediaLoadingIndicator;
