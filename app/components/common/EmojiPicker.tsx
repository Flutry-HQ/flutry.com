import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import emojiMartData from '@emoji-mart/data';

import Emoji from './Emoji';

const EmojiButton = memo(
  ({ emoji, onSelect }: { emoji: string; onSelect?: (emoji: string) => void }) => (
    <button
      onClick={() => onSelect?.(emoji)}
      className="aspect-square w-full rounded-lg flex items-center justify-center hover:bg-slate-800 transition"
    >
      <Emoji emoji={emoji} size={28} />
    </button>
  ),
  (prev, next) => prev.emoji === next.emoji,
);

export default function EmojiPicker({ onSelect }: { onSelect?: (emoji: string) => void }) {
  const data = emojiMartData as {
    categories: {
      id: string;
      emojis: string[];
    }[];
    emojis: Record<
      string,
      {
        id: string;
        name: string;
        skins: {
          native: string;
        }[];
      }
    >;
  };

  const categories = useMemo(() => data.categories, []);
  const emojis = useMemo(() => data.emojis, []);

  const [loaded, setLoaded] = useState(false);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [search, setSearch] = useState('');

  const deferredSearch = useDeferredValue(search);

  const contentRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const callback = () => {
      setLoaded(true);
    };

    if ('requestIdleCallback' in window) {
      const idle = requestIdleCallback(callback);

      return () => cancelIdleCallback(idle);
    }

    const timer = setTimeout(callback, 0);

    return () => clearTimeout(timer);
  }, []);

  const emojiSearchIndex = useMemo(() => {
    if (!loaded) return [];

    return Object.values(emojis)
      .map((emoji) => ({
        id: emoji.id,
        name: emoji.name.toLowerCase(),
        native: emoji.skins[0]?.native,
      }))
      .filter((emoji) => emoji.native);
  }, [emojis, loaded]);

  const searchResults = useMemo(() => {
    if (!deferredSearch) return [];

    const value = deferredSearch.toLowerCase();

    return emojiSearchIndex.filter((emoji) => emoji.name.includes(value));
  }, [deferredSearch, emojiSearchIndex]);

  function scrollToCategory(id: string) {
    const element = categoryRefs.current[id];
    const container = contentRef.current;

    if (!element || !container) return;

    container.scrollTop = element.offsetTop - 65;
    setActiveCategory(id);
  }

  if (!loaded) {
    return (
      <div className="w-full max-w-[26rem] h-[32rem] max-h-[90vh] bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center text-sm text-slate-400">
        Loading emojis...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[26rem] h-[32rem] max-h-[90vh] bg-slate-900 rounded-xl border border-white/10 overflow-hidden flex">
      <div className="w-12 shrink-0 bg-slate-800 flex flex-col items-center gap-2 p-1 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSearch('');
              scrollToCategory(cat.id);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
              activeCategory === cat.id ? 'bg-slate-600' : 'hover:bg-slate-700'
            }`}
          >
            <Emoji emoji={emojis[cat.emojis[0]]?.skins[0]?.native} size={22} />
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full h-9 rounded-lg bg-slate-800 border border-white/10 px-3 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto p-3 space-y-6">
          {deferredSearch ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
              {searchResults.map((emoji) => (
                <EmojiButton key={emoji.id} emoji={emoji.native} onSelect={onSelect} />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el;
                }}
                className="space-y-3"
              >
                <h3 className="text-xs uppercase font-bold text-slate-400">{cat.id}</h3>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
                  {cat.emojis.map((id) => (
                    <EmojiButton key={id} emoji={emojis[id]?.skins[0]?.native} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
