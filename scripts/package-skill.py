import os
import zipfile

def zip_folder():
    # Source folder to package (absolute path)
    source_dir = "/root/splitra"
    # Output path for the zipped archive
    output_zip = "/root/splitra/splitra.zip"
    
    # Directories to ignore
    ignore_dirs = { "node_modules", "build", ".git" }
    
    # Files to ignore
    ignore_files = { "splitra.zip", ".env" }
    
    print(f"Creating skill package from: {source_dir}")
    print(f"Output destination: {output_zip}")
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        count = 0
        for root, dirs, files in os.walk(source_dir):
            # Prune ignored directories in-place
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                # Filter out ignored files and patterns
                if (file in ignore_files or 
                    file.startswith(".env") or 
                    file.endswith(".log") or 
                    "proof-report" in file):
                    continue
                
                full_path = os.path.join(root, file)
                # Compute relative path from parent of splitra (/root)
                # This ensures the first folder in the zip is 'splitra/'
                arcname = os.path.relpath(full_path, "/root")
                zipf.write(full_path, arcname)
                count += 1
                
    print(f"Successfully packaged {count} files into {output_zip}")

if __name__ == "__main__":
    zip_folder()
