import os, re
files = [
    'src/App.tsx',
    'src/components/Navbar.tsx',
    'src/components/Sidebar.tsx',
    'src/pages/LandingPage.tsx',
    'src/pages/LoginPage.tsx',
    'src/pages/SignUpPage.tsx',
    'src/sections/ExtensionSection.tsx'
]
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(r'Brain,\s*', '', content)
    content = re.sub(r',\s*Brain', '', content)
    content = re.sub(r'import\s+{\s*Brain\s*}\s+from\s+[\'\"].*?[\'\"]\s*;\n?', '', content)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
