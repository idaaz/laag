from PIL import Image
import os
import zipfile

# 1. Resize Icons
icon_dir = r"e:\LAAG\extension\url-tracker\icons"
base_icon = os.path.join(icon_dir, "icon16.png")

print("Resizing icons...")
try:
    with Image.open(base_icon) as img:
        img_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
        img_48.save(os.path.join(icon_dir, "icon48.png"))
        print("Created icon48.png")

        img_128 = img.resize((128, 128), Image.Resampling.LANCZOS)
        img_128.save(os.path.join(icon_dir, "icon128.png"))
        print("Created icon128.png")
except Exception as e:
    print("Error resizing:", e)

# 2. Re-Zip
print("Creating ZIP...")
source_dir = r'e:\LAAG\extension\url-tracker'
dest_zip = r'e:\LAAG\extension\url-tracker-firefox.zip'

if os.path.exists(dest_zip):
    os.remove(dest_zip)

with zipfile.ZipFile(dest_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        if '.git' in root:
            continue
        for file in files:
            if file == '.DS_Store':
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, source_dir).replace('\\', '/')
            zipf.write(file_path, arcname)

print("Created POSIX-compliant ZIP archive:", dest_zip)
