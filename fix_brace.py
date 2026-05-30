filepath = r"D:\mens hub front end (25.5\mens hub front end\src\app\App.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the problematic line (line 3222 is index 3221)
for i in range(len(lines)):
    if i == 3221:  # Line 3222 (0-indexed)
        print(f"Original line 3222 (last 100 chars): {repr(lines[i][-100:])}")
        line_stripped = lines[i].rstrip()
        # Remove trailing } if it's a stray closing brace
        if line_stripped.endswith('}') and not line_stripped.endswith('}}'):
            lines[i] = line_stripped[:-1] + '\n'
            print(f"Fixed line 3222 (last 100 chars): {repr(lines[i][-100:])}")
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("✅ File fixed!")
