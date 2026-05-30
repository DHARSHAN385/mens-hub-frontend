filepath = r"D:\mens hub front end (25.5\mens hub front end\src\app\App.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 3222 is index 3221
# The ternary needs to close with }
if not lines[3221].rstrip().endswith('}'):
    print(f"Before: {repr(lines[3221][-50:])}")
    lines[3221] = lines[3221].rstrip() + '}\n'
    print(f"After: {repr(lines[3221][-50:])}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("✅ Fixed!")
