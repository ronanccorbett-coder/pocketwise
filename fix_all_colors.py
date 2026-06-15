#!/usr/bin/env python3
"""
Run this from your project root:
  python3 fix_all_colors.py

It rewrites every .tsx file to fix:
1. Self-referential T objects (T.bg inside const T = {...})
2. Unbraced JSX attributes (stroke=T.x -> stroke={T.x})
3. useState<Capital>() generics
4. Apostrophes in JSX text
5. Hardcoded colours that don't flip between dark/light
"""
import re, os, glob

CLEAN_T = '''const T = {
    bg:      isDark ? "#0d1526" : "#f0f4f8",
    bg2:     isDark ? "#111c30" : "#ffffff",
    bg3:     isDark ? "#1a2540" : "#f8fafc",
    card:    isDark ? "#111c30" : "#ffffff",
    text:    isDark ? "#ffffff" : "#0d1526",
    text2:   isDark ? "#8b9dc3" : "#475569",
    text3:   isDark ? "#4a6a8a" : "#94a3b8",
    border:  isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)",
    border2: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.16)",
    input:   isDark ? "rgba(255,255,255,.06)" : "#f8fafc",
    shadow:  isDark ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)",
    green:   isDark ? "#76AD25" : "#5a9a1a",
    accent:  isDark ? "#f59e0b" : "#d97706",
    strip:   isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
  };'''

CONTRACTIONS = [
    ("Today's", "Daily"), ("today's", "daily"),
    ("won't", "will not"), ("don't", "do not"), ("can't", "cannot"),
    ("isn't", "is not"), ("doesn't", "does not"), ("you'll", "you will"),
    ("it's", "it is"), ("that's", "that is"), ("there's", "there is"),
    ("they'll", "they will"), ("we'll", "we will"), ("I'll", "I will"),
    ("haven't", "have not"), ("hasn't", "has not"), ("didn't", "did not"),
    ("wouldn't", "would not"), ("couldn't", "could not"), ("shouldn't", "should not"),
    ("You'll", "You will"), ("That's", "That is"), ("There's", "There is"),
    ("It's", "It is"), ("Don't", "Do not"), ("Can't", "Cannot"),
]

def fix_file(path):
    with open(path) as f:
        content = f.read()
    original = content

    # 1. Fix self-referential T objects
    # Find const T = { ... }; blocks that reference T. inside them
    def replace_bad_T(m):
        block = m.group(0)
        if re.search(r'isDark\s*\?', block) and 'T.' in block:
            return CLEAN_T  # replace with clean version
        return block
    content = re.sub(r'const T = \{[^;]{20,}\};', replace_bad_T, content, flags=re.DOTALL)

    # 2. Fix unbraced JSX attributes: word=T.something -> word={T.something}
    content = re.sub(r'(\s)([a-zA-Z]+)=(T\.[a-zA-Z]+)([\s/>])', r'\1\2={\3}\4', content)

    # 3. Fix useState<Capital> generics
    def fix_usestate(m):
        tp, init = m.group(1), m.group(2)
        if re.search(r'[A-Z]', tp):
            return f'useState({init} as {tp})'
        return m.group(0)
    content = re.sub(r'useState<([^>]+)>\(([^)]*)\)', fix_usestate, content)

    # 4. Fix apostrophes in JSX text (not in strings/template literals)
    # Split on quoted strings to avoid touching string literals
    parts = re.split(r'("(?:[^"\\]|\\.)*")', content)
    fixed_parts = []
    for i, part in enumerate(parts):
        if i % 2 == 0:  # not inside a string
            for old, new in CONTRACTIONS:
                part = part.replace(old, new)
        fixed_parts.append(part)
    content = ''.join(fixed_parts)

    # 5. Fix hardcoded dark colours used as text colour (most common legibility bug)
    # These appear as color: "#0d1526" which is black text - invisible on dark bg
    # Only fix if the file has isDark theme support (has T. tokens)
    if 'isDark' in content and 'const T =' in content:
        # color: "#fff" or color: "#ffffff" -> color: T.text (white/dark adaptive)
        # These are the most dangerous - white text hardcoded = invisible on light bg
        content = re.sub(r'color:\s*"#fff(?:fff)?"(?!\s*:)', 'color: T.text', content)
        # color: "#0d1526" or "#1e293b" (dark text) hardcoded = invisible on dark bg
        content = re.sub(r'color:\s*"#0d1526"(?!\s*:)', 'color: T.text', content)
        content = re.sub(r'color:\s*"#1e293b"(?!\s*:)', 'color: T.text', content)
        content = re.sub(r'color:\s*"#334155"(?!\s*:)', 'color: T.text', content)
        # Muted text colours
        content = re.sub(r'color:\s*"#64748b"(?!\s*:)', 'color: T.text2', content)
        content = re.sub(r'color:\s*"#475569"(?!\s*:)', 'color: T.text2', content)
        content = re.sub(r'color:\s*"#8b9dc3"(?!\s*:)', 'color: T.text2', content)
        content = re.sub(r'color:\s*"#94a3b8"(?!\s*:)', 'color: T.text3', content)
        content = re.sub(r'color:\s*"#4a6a8a"(?!\s*:)', 'color: T.text3', content)
        content = re.sub(r'color:\s*"#slate-[0-9]+"(?!\s*:)', 'color: T.text2', content)

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        return True
    return False

# Run on all tsx files in src/
tsx_files = glob.glob('src/**/*.tsx', recursive=True)
changed = []
for path in tsx_files:
    try:
        if fix_file(path):
            changed.append(path)
    except Exception as e:
        print(f"ERROR {path}: {e}")

print(f"Fixed {len(changed)}/{len(tsx_files)} files:")
for f in changed:
    print(f"  {f}")
