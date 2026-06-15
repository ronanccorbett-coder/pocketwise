#!/usr/bin/env python3
"""Run from project root: python3 fix_activities.py"""
import re

path = 'src/app/activities/page.tsx'
with open(path) as f:
    content = f.read()

CLEAN_T = '{ bg: isDark?"#0d1526":"#f0f4f8", bg2: isDark?"#111c30":"#ffffff", bg3: isDark?"#1a2540":"#f8fafc", card: isDark?"#111c30":"#ffffff", text: isDark?"#ffffff":"#0d1526", text2: isDark?"#8b9dc3":"#475569", text3: isDark?"#4a6a8a":"#94a3b8", border: isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)", border2: isDark?"rgba(255,255,255,.14)":"rgba(0,0,0,.16)", input: isDark?"rgba(255,255,255,.06)":"#f8fafc", shadow: isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)", green: isDark?"#76AD25":"#5a9a1a", accent: isDark?"#f59e0b":"#d97706", strip: isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)" }'

# Find XPCelebration and add T tokens to it
old = '''function XPCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {'''
new = '''function XPCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {
  const { isDark } = useTheme();
  const T = ''' + CLEAN_T + ''';'''

if old in content:
    content = content.replace(old, new)
    print("Added T to XPCelebration")
else:
    # Try without types (already sanitised)
    old2 = 'function XPCelebration({ xp, onDone }: { xp: any; onDone: any }) {'
    new2 = '''function XPCelebration({ xp, onDone }: { xp: any; onDone: any }) {
  const { isDark } = useTheme();
  const T = ''' + CLEAN_T + ''';'''
    if old2 in content:
        content = content.replace(old2, new2)
        print("Added T to XPCelebration (any types)")
    else:
        # Generic search for the function
        content = re.sub(
            r'(function XPCelebration\([^)]+\) \{)',
            r'\1\n  const { isDark } = useTheme();\n  const T = ' + CLEAN_T + ';',
            content
        )
        print("Added T to XPCelebration (regex)")

# Also revert the T.text replacements inside XPCelebration to hardcoded values
# since the celebration screen is always dark-themed regardless of mode
content = content.replace(
    '<div style={{ fontSize: "1.5rem", fontWeight: 900, color: T.text }}>Activity Complete!</div>',
    '<div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>Activity Complete!</div>'
)

with open(path, 'w') as f:
    f.write(content)

# Verify T is defined before it's used in XPCelebration
lines = content.split('\n')
xp_start = next((i for i,l in enumerate(lines) if 'function XPCelebration' in l), None)
if xp_start:
    chunk = '\n'.join(lines[xp_start:xp_start+5])
    print("XPCelebration start:\n", chunk)
print("Done")
