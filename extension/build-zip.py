import os
import zipfile

source_dir = r'e:\LAAG\extension\url-tracker'
dest_zip = r'e:\LAAG\extension\url-tracker-firefox.zip'

if os.path.exists(dest_zip):
    os.remove(dest_zip)

with zipfile.ZipFile(dest_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        # Ignore git/DS_Store
        if '.git' in root:
            continue
            
        for file in files:
            if file == '.DS_Store':
                continue
                
            file_path = os.path.join(root, file)
            # Create a relative path and force forward slashes for Firefox validation
            arcname = os.path.relpath(file_path, source_dir).replace('\\', '/')
            zipf.write(file_path, arcname)

print("Created POSIX-compliant ZIP archive:", dest_zip)
