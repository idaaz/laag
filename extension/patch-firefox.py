import os
import re

extension_dir = r"e:\LAAG\extension\url-tracker"

# Firefox supports the `browser` namespace, but it also partially supports `chrome`. However, AMO validates strictly against `chrome` for Promise-based modern APIs.
# The safest and most standard cross-browser way to handle this without rewriting the entire extension is
# to inject a tiny polyfill at the top of each script to alias `chrome` to `browser` if `browser` exists and `chrome` doesn't, OR 
# just natively replace `chrome.` with `(globalThis.browser || globalThis.chrome).`

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple regex to replace chrome.api calls with a cross-browser compatible fallback
    # Match "chrome." but not "chrome.google.com" or inside strings if we can help it
    
    # Actually, the most robust way that AMO prefers is just checking `globalThis.browser || globalThis.chrome`
    # We will replace `chrome.` with `(globalThis.browser || globalThis.chrome).` 
    # BUT Firefox AMO validator might still complain if it sees the word `chrome.` literally calling APIs.
    
    # The absolute best way to pass Mozilla validation for Chrome extensions is to use their exact recommended polyfill:
    # `const api = globalThis.browser || globalThis.chrome;` 
    # and use `api.` everywhere.
    
    # Let's do a smart regex replacement: `chrome\.([a-zA-Z0-9_]+)` -> `(globalThis.browser || globalThis.chrome).\1`
    
    # To be extremely safe with the AST validator, we'll replace `chrome.` with `browser.` 
    # and rely on the fact that we ONLY care about this passing Firefox AMO right now for the Firefox zip.
    # So we will literally just replace `chrome.` with `browser.` in JS files before zipping.
    
    new_content = re.sub(r'\bchrome\.', 'browser.', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched: {os.path.basename(filepath)}")

for root, _, files in os.walk(extension_dir):
    for file in files:
        if file.endswith('.js'):
            patch_file(os.path.join(root, file))

print("Patching complete.")
