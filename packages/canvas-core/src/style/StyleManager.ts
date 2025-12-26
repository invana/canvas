/**
 * StyleManager - Central style management facade
 * 
 * Coordinates ThemeManager and StyleResolver for unified style API
 */

import type { NodeData, EdgeData, NodeStyle, EdgeStyle, StyleRule, ThemeConfig } from '../types';
import { ThemeManager } from './ThemeManager';
import { StyleResolver } from './StyleResolver';

export class StyleManager {
  public readonly themeManager: ThemeManager;
  public readonly resolver: StyleResolver;

  private readonly updateCallbacks: Set<() => void> = new Set();

  constructor(theme?: ThemeConfig | string) {
    this.themeManager = new ThemeManager(theme);
    this.resolver = new StyleResolver(this.themeManager);

    // Forward theme changes to update callbacks
    this.themeManager.onThemeChange(() => {
      this.notifyUpdate();
    });
  }

  // ===========================================================================
  // Theme API
  // ===========================================================================

  /**
   * Get the current theme
   */
  get theme(): ThemeConfig {
    return this.themeManager.current;
  }

  /**
   * Set the theme
   */
  setTheme(theme: ThemeConfig | string): void {
    this.themeManager.setTheme(theme);
  }

  /**
   * Register a custom theme
   */
  registerTheme(theme: ThemeConfig): void {
    this.themeManager.registerTheme(theme);
  }

  /**
   * Get available theme names
   */
  getThemeNames(): string[] {
    return this.themeManager.getThemeNames();
  }

  // ===========================================================================
  // Style Rules API
  // ===========================================================================

  /**
   * Add a style rule
   */
  addRule(rule: StyleRule): void {
    this.resolver.addRule(rule);
    this.notifyUpdate();
  }

  /**
   * Add multiple style rules
   */
  addRules(rules: StyleRule[]): void {
    for (const rule of rules) {
      this.resolver.addRule(rule);
    }
    this.notifyUpdate();
  }

  /**
   * Remove a style rule
   */
  removeRule(rule: StyleRule): void {
    this.resolver.removeRule(rule);
    this.notifyUpdate();
  }

  /**
   * Clear all style rules
   */
  clearRules(): void {
    this.resolver.clearRules();
    this.notifyUpdate();
  }

  // ===========================================================================
  // Style Resolution API
  // ===========================================================================

  /**
   * Get the resolved style for a node
   */
  getNodeStyle(data: NodeData): NodeStyle {
    return this.resolver.resolveNodeStyle(data);
  }

  /**
   * Get the resolved style for an edge
   */
  getEdgeStyle(data: EdgeData): EdgeStyle {
    return this.resolver.resolveEdgeStyle(data);
  }

  // ===========================================================================
  // Update Notification
  // ===========================================================================

  /**
   * Subscribe to style updates
   */
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdate(): void {
    for (const callback of this.updateCallbacks) {
      callback();
    }
  }

  // ===========================================================================
  // Convenience Methods
  // ===========================================================================

  /**
   * Create a rule for styling nodes by type
   */
  styleNodesByType(type: string, style: Partial<NodeStyle>): StyleRule {
    const rule: StyleRule = {
      selector: `type:${type}`,
      style,
    };
    this.addRule(rule);
    return rule;
  }

  /**
   * Create a rule for styling edges by type
   */
  styleEdgesByType(type: string, style: Partial<EdgeStyle>): StyleRule {
    const rule: StyleRule = {
      selector: `type:${type}`,
      style,
    };
    this.addRule(rule);
    return rule;
  }

  /**
   * Create a rule for styling by property value
   */
  styleByProperty(
    property: string,
    value: string | number | boolean,
    style: Partial<NodeStyle | EdgeStyle>
  ): StyleRule {
    const rule: StyleRule = {
      selector: `prop:${property}=${value}`,
      style,
    };
    this.addRule(rule);
    return rule;
  }

  /**
   * Create a rule with a custom predicate
   */
  styleByPredicate(
    predicate: (data: NodeData | EdgeData) => boolean,
    style: Partial<NodeStyle | EdgeStyle>,
    priority?: number
  ): StyleRule {
    const rule: StyleRule = {
      selector: predicate,
      style,
      priority,
    };
    this.addRule(rule);
    return rule;
  }
}
