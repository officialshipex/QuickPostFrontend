import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface GlassDropdownProps {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function GlassDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Search...',
  searchable = true,
  icon,
  className = '',
}: GlassDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange(options.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasSelected = selected.length > 0;
  const allSelected = selected.length === options.length && options.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="glass-dropdown-trigger group"
        type="button"
      >
        {icon && <span className="glass-dropdown-icon">{icon}</span>}
        <span className={`glass-dropdown-label ${hasSelected ? 'has-value' : ''}`}>
          {label}
        </span>
        {hasSelected && (
          <span className="glass-dropdown-badge">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`glass-dropdown-chevron ${open ? 'rotate' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="glass-dropdown-panel">
          {/* Glass Shimmer Effect */}
          <div className="glass-shimmer" />

          {/* Search Bar */}
          {searchable && (
            <div className="glass-dropdown-search-wrapper">
              <Search className="glass-dropdown-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="glass-dropdown-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="glass-dropdown-search-clear"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className="glass-dropdown-actions">
            <button
              onClick={allSelected ? clearAll : selectAll}
              className="glass-dropdown-action-btn"
              type="button"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {hasSelected && (
              <button
                onClick={clearAll}
                className="glass-dropdown-action-btn clear"
                type="button"
              >
                Clear ({selected.length})
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="glass-dropdown-options">
            {filtered.length === 0 ? (
              <div className="glass-dropdown-empty">
                No results found
              </div>
            ) : (
              filtered.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`glass-dropdown-option ${isSelected ? 'selected' : ''}`}
                    type="button"
                  >
                    <div className={`glass-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    {option.icon && (
                      <span className="glass-dropdown-option-icon">{option.icon}</span>
                    )}
                    <span className="glass-dropdown-option-label">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          {hasSelected && (
            <div className="glass-dropdown-footer">
              <span>{selected.length} of {options.length} selected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
