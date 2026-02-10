
import sys

def extract_lines(source_file, start_line, end_line, dest_file):
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Adjust for 0-indexed list
        start_idx = start_line - 1
        end_idx = end_line 
        
        if start_idx < 0 or end_idx > len(lines):
             print(f"Error: Range {start_line}-{end_line} out of bounds for file with {len(lines)} lines")
             sys.exit(1)
             
        extracted_lines = lines[start_idx:end_idx]
        
        with open(dest_file, 'w', encoding='utf-8') as f:
            f.writelines(extracted_lines)
            
        print(f"Successfully extracted lines {start_line} to {end_line} into {dest_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python extract_lines.py <source_file> <start_line> <end_line> <dest_file>")
        sys.exit(1)
        
    extract_lines(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
