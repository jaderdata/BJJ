
import sys
import os

def remove_lines(file_path, start_line, end_line):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Adjust for 0-indexed list
        start_idx = start_line - 1
        end_idx = end_line # slice excludes end, so this works for inclusive removal? No.
        # lines[start_idx:end_idx] removes lines from start_idx up to but not including end_idx.
        # So to remove 'end_line' inclusive, we need lines[start_idx:end_line]
        
        if start_idx < 0 or end_idx > len(lines):
             print(f"Error: Range {start_line}-{end_line} out of bounds for file with {len(lines)} lines")
             sys.exit(1)
             
        new_lines = lines[:start_idx] + lines[end_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
        print(f"Successfully removed lines {start_line} to {end_line}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python remove_lines.py <file> <start_line> <end_line>")
        sys.exit(1)
        
    remove_lines(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
