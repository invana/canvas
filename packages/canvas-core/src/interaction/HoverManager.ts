/**
 * HoverManager - Manages hover state for elements
 * 
 * Handles pointer enter/leave with visual feedback
 */

import type { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import type { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';

export type HoverableElement = RendererNodeBase | RendererEdgeBase;

export interface HoverConfig {
  hoverStyle?: {
    alpha?: number;
    scale?: number;
  };
  hoverDelay?: number; // ms before hover activates
}

export type HoverEventType = 'start' | 'end';
export type HoverEventCallback = (element: HoverableElement) => void;

export class HoverManager {
  private readonly config: Required<HoverConfig>;
  private readonly listeners: Map<HoverEventType, Set<HoverEventCallback>> = new Map();
  private currentHover: HoverableElement | null = null;
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: HoverConfig = {}) {
    this.config = {
      hoverStyle: config.hoverStyle ?? {
        alpha: 0.8,
        scale: 1.05,
      },
      hoverDelay: config.hoverDelay ?? 0,
    };
  }

  /**
   * Register an element for hover
   */
  registerElement(element: HoverableElement): void {
    element.eventMode = 'static';

    element.on('pointerover', () => {
      this.onHoverStart(element);
    });

    element.on('pointerout', () => {
      this.onHoverEnd(element);
    });
  }

  /**
   * Unregister an element
   */
  unregisterElement(element: HoverableElement): void {
    if (this.currentHover === element) {
      this.clearHover();
    }
    element.off('pointerover');
    element.off('pointerout');
  }

  /**
   * Handle hover start
   */
  private onHoverStart(element: HoverableElement): void {
    // Clear any pending hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Clear previous hover if different element
    if (this.currentHover && this.currentHover !== element) {
      this.clearHover();
    }

    if (this.config.hoverDelay > 0) {
      this.hoverTimeout = setTimeout(() => {
        this.activateHover(element);
      }, this.config.hoverDelay);
    } else {
      this.activateHover(element);
    }
  }

  /**
   * Activate hover state
   */
  private activateHover(element: HoverableElement): void {
    this.currentHover = element;
    this.applyHoverStyle(element, true);
    this.emit('start', element);
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(element: HoverableElement): void {
    // Clear pending hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (this.currentHover === element) {
      this.clearHover();
    }
  }

  /**
   * Clear current hover
   */
  clear(): void {
    this.clearHover();
  }

  /**
   * Clear hover state
   */
  private clearHover(): void {
    if (this.currentHover) {
      this.applyHoverStyle(this.currentHover, false);
      this.emit('end', this.currentHover);
      this.currentHover = null;
    }
  }

  /**
   * Get currently hovered element
   */
  getHovered(): HoverableElement | null {
    return this.currentHover;
  }

  /**
   * Check if element is hovered
   */
  isHovered(element: HoverableElement): boolean {
    return this.currentHover === element;
  }

  /**
   * Apply hover visual style
   */
  private applyHoverStyle(element: HoverableElement, hovered: boolean): void {
    if (hovered) {
      // Store original style
      (element as any)._hoverOriginalStyle = {
        alpha: element.alpha,
        scaleX: element.scale.x,
        scaleY: element.scale.y,
      };

      // Apply hover style
      if (this.config.hoverStyle.alpha !== undefined) {
        element.alpha = this.config.hoverStyle.alpha;
      }
      if (this.config.hoverStyle.scale !== undefined) {
        element.scale.set(this.config.hoverStyle.scale);
      }
    } else {
      // Restore original style
      const original = (element as any)._hoverOriginalStyle;
      if (original) {
        element.alpha = original.alpha;
        element.scale.set(original.scaleX, original.scaleY);
        delete (element as any)._hoverOriginalStyle;
      }
    }
  }

  /**
   * Update hover style
   */
  setHoverStyle(style: Partial<typeof this.config.hoverStyle>): void {
    Object.assign(this.config.hoverStyle, style);
    
    // Re-apply style to currently hovered element
    if (this.currentHover) {
      this.applyHoverStyle(this.currentHover, true);
    }
  }

  /**
   * Set hover delay
   */
  setHoverDelay(delay: number): void {
    this.config.hoverDelay = delay;
  }

  /**
   * Subscribe to hover events
   */
  on(event: HoverEventType, callback: HoverEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from hover events
   */
  off(event: HoverEventType, callback: HoverEventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit hover event
   */
  private emit(event: HoverEventType, element: HoverableElement): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(element));
    }
  }

  /**
   * Destroy the hover manager
   */
  destroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.clearHover();
    this.listeners.clear();
  }
}
