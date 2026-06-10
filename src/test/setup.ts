import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverMock;

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  if (this instanceof HTMLElement && this.classList.contains("recharts-responsive-container")) {
    return {
      x: 0,
      y: 0,
      width: 320,
      height: 260,
      top: 0,
      right: 320,
      bottom: 260,
      left: 0,
      toJSON() {
        return this;
      },
    };
  }

  return originalGetBoundingClientRect.call(this);
};
