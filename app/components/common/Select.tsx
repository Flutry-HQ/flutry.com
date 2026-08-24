import React, { useState, useRef, useEffect, useCallback, useId, type ReactNode } from 'react';

export type SelectOption<V extends string = string> = {
  value: V;
  label: string | ReactNode;
  searchLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SelectClassNames = {
  wrap?: string;
  trigger?: string;
  triggerClose?: string;
  triggerOpen?: string;
  triggerError?: string;
  placeholder?: string;
  value?: string;
  tag?: string;
  tagRemove?: string;
  countBadge?: string;
  clearBtn?: string;
  chevron?: string;
  errorText?: string;
  hintText?: string;
  dropdown?: string;
  searchWrap?: string;
  searchInput?: string;
  list?: string;
  item?: string;
  itemSelected?: string;
  itemFocused?: string;
  itemDisabled?: string;
  checkbox?: string;
  checkboxChecked?: string;
  empty?: string;
};

type BaseProps<V extends string = string> = {
  options: SelectOption<V>[];
  placeholder?: ReactNode | string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  hint?: string;
  maxTags?: number;
  className?: string;
  classNames?: SelectClassNames;
};

export type SelectProps<V extends string = string> = BaseProps<V> & {
  multi?: false;
  value?: V | null;
  onChange?: (value: V | null) => void;
};

export type MultiSelectProps<V extends string = string> = BaseProps<V> & {
  multi: true;
  value?: V[];
  onChange?: (values: V[]) => void;
};

type Props<V extends string = string> = SelectProps<V> | MultiSelectProps<V>;

type ThemeTokens = Record<keyof Omit<SelectClassNames, 'wrap'>, string>;

const THEMES = {
  trigger: 'flex items-center gap-2 min-h-[40px] bg-slate-800 px-3 py-2 border rounded-lg cursor-pointer duration-150',
  triggerClose: 'border-slate-700  hover:border-slate-600',
  triggerOpen: 'border-indigo-500 ring-2 ring-indigo-500/20',
  triggerError: 'border-rose-400',
  placeholder: 'text-sm text-slate-500',
  value: 'text-sm text-slate-100 truncate',
  tag: 'inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 rounded px-1.5 py-0.5 text-xs font-medium max-w-[130px]',
  tagRemove: 'opacity-70 hover:opacity-100 flex-shrink-0 flex',
  countBadge: 'bg-indigo-500/15 text-indigo-400 rounded px-1.5 py-0.5 text-xs font-semibold',
  clearBtn: 'flex-shrink-0 flex text-slate-500 hover:text-slate-200 hover:bg-slate-700 rounded p-0.5 transition-colors',
  chevron: 'flex-shrink-0 text-slate-400 transition-transform duration-200',
  errorText: 'text-rose-400 text-xs mt-1',
  hintText: 'text-slate-500 text-xs mt-1',
  dropdown: 'absolute left-0 right-0 z-50  bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden',
  searchWrap: 'p-2 border-b border-slate-700',
  searchInput:
    'w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors',
  list: 'max-h-[200px] overflow-y-auto p-1.5 flex flex-col gap-1.5',
  item: 'flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer transition-colors text-slate-200 hover:bg-slate-700/40',
  itemSelected: 'text-indigo-300 bg-indigo-500/15',
  itemFocused: 'bg-slate-700/60 text-slate-100',
  itemDisabled: 'opacity-40 cursor-not-allowed',
  checkbox: 'w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border border-slate-600 transition-colors',
  checkboxChecked: 'bg-indigo-500 border-indigo-500',
  empty: 'py-3 text-center text-sm text-slate-500',
};

function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6l3.5 3.5L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Select<V extends string = string>({
  options,
  placeholder = 'Select...',
  searchable = true,
  clearable = false,
  disabled = false,
  error = false,
  label,
  hint,
  maxTags = 3,
  className = '',
  classNames: cn_ = {},
  ...rest
}: Props<V>) {
  const isMulti = (rest as MultiSelectProps<V>).multi === true;
  const multiValue = isMulti ? ((rest as MultiSelectProps<V>).value ?? []) : [];
  const singleValue = !isMulti ? ((rest as SelectProps<V>).value ?? null) : null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const [dropUp, setDropUp] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const mergedThemes = {
    ...THEMES,
    ...Object.fromEntries(Object.entries(cn_).filter(([_, v]) => v !== undefined && v !== null)),
  };
  const t = (key: keyof ThemeTokens, over?: string) => cx(mergedThemes[key], over);

  const filtered = query.trim()
    ? options.filter((o) => (o.searchLabel ?? String(o.label)).toLowerCase().includes(query.toLowerCase().trim()))
    : options;

  const computePosition = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(260, filtered.length * 40 + 60);
    setDropUp(spaceBelow < estimatedHeight && rect.top > estimatedHeight);
  }, [filtered.length]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setQuery('');
    setFocusIdx(-1);
    computePosition();
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 10);
  }, [disabled, computePosition]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setFocusIdx(-1);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    open ? closeDropdown() : openDropdown();
  }, [open, openDropdown, closeDropdown]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeDropdown();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, closeDropdown]);

  const selectItem = useCallback(
    (val: V) => {
      if (isMulti) {
        const onChange = (rest as MultiSelectProps<V>).onChange;
        const next = multiValue.includes(val) ? multiValue.filter((v) => v !== val) : [...multiValue, val];
        onChange?.(next);
        searchRef.current?.focus();
      } else {
        (rest as SelectProps<V>).onChange?.(val === singleValue ? null : val);
        closeDropdown();
      }
    },
    [isMulti, multiValue, singleValue, rest, closeDropdown],
  );

  const clearSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isMulti) (rest as SelectProps<V>).onChange?.(null);
      else (rest as MultiSelectProps<V>).onChange?.([]);
    },
    [isMulti, rest],
  );

  const removeTag = useCallback(
    (val: V, e: React.MouseEvent) => {
      e.stopPropagation();
      (rest as MultiSelectProps<V>).onChange?.(multiValue.filter((v) => v !== val));
    },
    [multiValue, rest],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          openDropdown();
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'Escape') {
        closeDropdown();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setFocusIdx((i) => Math.max(i - 1, -1));
        e.preventDefault();
      } else if (e.key === 'Enter' && focusIdx >= 0 && filtered[focusIdx]) {
        selectItem(filtered[focusIdx].value);
        e.preventDefault();
      } else if (e.key === 'Tab') {
        closeDropdown();
      }
    },
    [open, filtered, focusIdx, openDropdown, closeDropdown, selectItem],
  );

  useEffect(() => {
    if (!listRef.current || focusIdx < 0) return;
    listRef.current.querySelectorAll<HTMLElement>('[data-item]')[focusIdx]?.scrollIntoView({ block: 'nearest' });
  }, [focusIdx]);

  const hasValue = isMulti ? multiValue.length > 0 : singleValue !== null;
  const singleLabel = !isMulti && singleValue ? (options.find((o) => o.value === singleValue)?.label ?? singleValue) : null;
  const selectedTags = isMulti ? (multiValue.map((v) => options.find((o) => o.value === v)).filter(Boolean) as SelectOption<V>[]) : [];
  const visibleTags = selectedTags.slice(0, maxTags);
  const hiddenCount = selectedTags.length - visibleTags.length;
  const showClear = clearable && hasValue && !disabled;

  return (
    <div ref={wrapRef} className={cx('relative select-none', cn_.wrap, className)}>
      {label && (
        <label htmlFor={uid} className="block text-xs font-medium text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div
        ref={triggerRef}
        id={uid}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onMouseDown={(e) => {
          e.preventDefault();
          toggle();
        }}
        onKeyDown={handleKeyDown}
        className={`outline-none ${cx(
          t('trigger', cn_.trigger),
          !open && !error && t('triggerClose', cn_.triggerClose),
          open && t('triggerOpen', cn_.triggerOpen),
          !open && error && t('triggerError', cn_.triggerError),
          disabled && 'opacity-45 cursor-not-allowed pointer-events-none ',
        )}`}
      >
        <div className="flex-1 min-w-0 flex flex-wrap gap-1">
          {isMulti ? (
            selectedTags.length === 0 ? (
              <span className={t('placeholder', cn_.placeholder)}>{placeholder}</span>
            ) : (
              <>
                {visibleTags.map((o) => (
                  <span key={o.value} className={t('tag', cn_.tag)}>
                    <span className="truncate">{o.label}</span>
                    <span
                      role="button"
                      aria-label={`Remove ${o.label}`}
                      onMouseDown={(e) => removeTag(o.value, e)}
                      className={t('tagRemove', cn_.tagRemove)}
                    >
                      <XIcon size={10} />
                    </span>
                  </span>
                ))}
                {hiddenCount > 0 && <span className={t('countBadge', cn_.countBadge)}>+{hiddenCount}</span>}
              </>
            )
          ) : singleLabel ? (
            <span className={t('value', cn_.value)}>{singleLabel}</span>
          ) : (
            <span className={t('placeholder', cn_.placeholder)}>{placeholder}</span>
          )}
        </div>

        {showClear && (
          <span role="button" aria-label="Clear" onMouseDown={clearSelection} className={t('clearBtn', cn_.clearBtn)}>
            <XIcon size={12} />
          </span>
        )}

        <span className={cx(t('chevron', cn_.chevron), open ? 'rotate-180' : '')}>
          <ChevronIcon />
        </span>
      </div>

      {error && <p className={t('errorText', cn_.errorText)}>{error}</p>}
      {hint && !error && <p className={t('hintText', cn_.hintText)}>{hint}</p>}

      {open && (
        <div className={cx(t('dropdown', cn_.dropdown), dropUp ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]')}>
          {searchable && (
            <div className={t('searchWrap', cn_.searchWrap)}>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 flex pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  autoComplete="off"
                  placeholder="Search..."
                  onInput={(e) => {
                    setQuery((e.target as HTMLInputElement).value);
                    setFocusIdx(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className={t('searchInput', cn_.searchInput)}
                />
              </div>
            </div>
          )}

          <div ref={listRef} role="listbox" aria-multiselectable={isMulti} className={t('list', cn_.list)}>
            {filtered.length === 0 ? (
              <div className={t('empty', cn_.empty)}>No results</div>
            ) : (
              filtered.map((o, i) => {
                const isSel = isMulti ? multiValue.includes(o.value) : singleValue === o.value;
                const isFocused = i === focusIdx;
                return (
                  <div
                    key={o.value}
                    data-item
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!o.disabled) selectItem(o.value);
                    }}
                    onMouseMove={() => setFocusIdx(i)}
                    className={cx(
                      t('item', cn_.item),
                      isSel && t('itemSelected', cn_.itemSelected),
                      !isSel && isFocused && t('itemFocused', cn_.itemFocused),
                      o.disabled && t('itemDisabled', cn_.itemDisabled),
                    )}
                  >
                    {isMulti ? (
                      <span className={cx(t('checkbox', cn_.checkbox), isSel && t('checkboxChecked', cn_.checkboxChecked))}>
                        {isSel && <CheckIcon size={10} />}
                      </span>
                    ) : (
                      <span className="w-4 flex-shrink-0 flex justify-center">{isSel && <CheckIcon size={12} />}</span>
                    )}
                    {o.icon && <span className="flex-shrink-0 flex">{o.icon}</span>}
                    <span className="flex-1 truncate">{o.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
