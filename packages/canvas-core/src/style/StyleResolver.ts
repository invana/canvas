/**
 * StyleResolver - Resolves styles for nodes and edges
 * 
 * Combines theme defaults, style rules, and inline styles
 */

import type { NodeData, EdgeData, NodeStyle, EdgeStyle, StyleRule } from '../types';
import { ThemeManager } from './ThemeManager';

export class StyleResolver {
  private readonly themeManager: ThemeManager;
  private readonly rules: StyleRule[] = [];

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
  }

  /**
   * Add a style rule
   */
  addRule(rule: StyleRule): void {
    this.rules.push(rule);
    // Sort by priority (higher priority = later in array = applied last)
    this.rules.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * Remove a style rule
   */
  removeRule(rule: StyleRule): void {
    const index = this.rules.indexOf(rule);
    if (index !== -1) {
      this.rules.splice(index, 1);
    }
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.length = 0;
  }

  /**
   * Resolve the final style for a node
   */
  resolveNodeStyle(data: NodeData): NodeStyle {
    const theme = this.themeManager.current;
    
    // Start with theme defaults
    const baseStyle: NodeStyle = {
      shape: 'circle',
      fill: theme.colors.nodeFill,
      fillAlpha: 1,
      stroke: theme.colors.nodeStroke,
      strokeWidth: theme.sizes.nodeStrokeWidth,
      strokeAlpha: 1,
      radius: theme.sizes.nodeRadius,
      selectedFill: theme.colors.nodeSelectedFill,
      selectedStroke: theme.colors.nodeSelectedStroke,
      hoverFill: theme.colors.nodeHoverFill,
      hoverStroke: theme.colors.nodeHoverStroke,
    };

    // Apply matching rules
    const mergedStyle = this.applyRules(data, baseStyle);

    // Apply inline styles (highest priority)
    if (data.style) {
      Object.assign(mergedStyle, data.style);
    }

    return mergedStyle as NodeStyle;
  }

  /**
   * Resolve the final style for an edge
   */
  resolveEdgeStyle(data: EdgeData): EdgeStyle {
    const theme = this.themeManager.current;
    
    // Start with theme defaults
    const baseStyle: EdgeStyle = {
      path: 'line',
      stroke: theme.colors.edgeStroke,
      strokeWidth: theme.sizes.edgeStrokeWidth,
      strokeAlpha: 1,
      arrow: 'triangle',
      arrowSize: theme.sizes.arrowSize,
      selectedStroke: theme.colors.edgeSelectedStroke,
      hoverStroke: theme.colors.edgeHoverStroke,
    };

    // Apply matching rules
    const mergedStyle = this.applyRules(data, baseStyle);

    // Apply inline styles (highest priority)
    if (data.style) {
      Object.assign(mergedStyle, data.style);
    }

    return mergedStyle as EdgeStyle;
  }

  /**
   * Apply matching rules to a base style
   */
  private applyRules<T extends NodeStyle | EdgeStyle>(
    data: NodeData | EdgeData,
    baseStyle: T
  ): T {
    const result = { ...baseStyle };

    for (const rule of this.rules) {
      if (this.matchesRule(data, rule)) {
        Object.assign(result, rule.style);
      }
    }

    return result;
  }

  /**
   * Check if data matches a rule's selector
   */
  private matchesRule(data: NodeData | EdgeData, rule: StyleRule): boolean {
    const { selector } = rule;

    if (typeof selector === 'function') {
      return selector(data);
    }

    // String selector - support simple patterns
    // e.g., "type:person" or "label:*" or ".className"
    if (selector.startsWith('type:')) {
      const type = selector.slice(5);
      return data.type === type;
    }

    if (selector.startsWith('id:')) {
      const id = selector.slice(3);
      return data.id === id;
    }

    if (selector.startsWith('label:')) {
      const label = selector.slice(6);
      if (label === '*') {
        return !!data.label;
      }
      return data.label === label;
    }

    // Property selector: "prop:key=value"
    if (selector.startsWith('prop:')) {
      const propPart = selector.slice(5);
      const [key, value] = propPart.split('=');
      if (key && data.properties) {
        if (value === undefined) {
          return key in data.properties;
        }
        return String(data.properties[key]) === value;
      }
    }

    // Default: no match
    return false;
  }
}
